import {
  DatabaseProperty,
  IRichText,
  IListItem,
  IUnmergedBlock,
  IBlock,
  ITimeframe,
  IList,
} from "@ammarahmedca/types";
import {
  RichTextItemResponse,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import { isFullUser, Client, isFullBlock } from "@notionhq/client";

/**
 * Maps Notion rich text to custom rich text type
 *
 * @param {RichTextItemResponse} item Notion rich text
 * @returns {RichText}
 */
export const mapRichText = (
  item: RichTextItemResponse,
  language?: string
): IRichText => {
  return {
    plainText: item.plain_text,
    annotations: { ...item.annotations, language },
    href: item.href ?? undefined,
    inlineLatex: item.type === "equation",
  };
};

/**
 * Extracts values from Notion database property
 *
 * @private
 * @param {DatabaseProperty} property Notion database property
 * @returns {*}
 */
export const extractPropertyValue = (
  property: DatabaseProperty
):
  | string
  | string[]
  | boolean
  | ITimeframe
  | IRichText[]
  | number
  | undefined => {
  if (property.type === "title") {
    return property.title.map(item => item.plain_text).join("");
  }

  if (property.type === "rich_text") {
    return property.rich_text.map(r => mapRichText(r));
  }

  if (property.type === "checkbox") {
    return property.checkbox;
  }

  if (property.type === "date" && property.date) {
    const ymd = (str: string): Date => {
      const [year, month, day] = str.split("-").map(c => parseInt(c));
      let date = new Date(year, month - 1, day);
      if (process.env.NODE_ENV !== "production") {
        // in prod, time is in UTC, subtract offset
        const offset = new Date().getTimezoneOffset() * 60 * 1000;
        date.setTime(date.getTime() - offset);
      }
      return date;
    };
    return {
      start: ymd(property.date.start),
      end: property.date.end ? ymd(property.date.end) : undefined,
    };
  }

  if (property.type === "people") {
    const result: string[] = [];
    property.people.reduce((acc, curr) => {
      if (isFullUser(curr) && curr.name) {
        acc.push(curr.name);
      }
      return acc;
    }, result);
    return result;
  }

  if (property.type === "multi_select") {
    return property.multi_select.map(item => {
      return item.name;
    });
  }

  if (property.type === "select") {
    return property.select?.name;
  }

  if (property.type === "url") {
    return property.url ?? undefined;
  }

  if (property.type === "number") {
    return property.number?.valueOf();
  }
};

/**
 * Recursively gets all list children
 *
 * @async
 * @param {BlockObjectResponse} block  List block item
 * @param {ListItem} item Custom list item type
 * @returns {Promise<ListItem>}
 */
export const getAllListChildren = async (
  notion: Client,
  block: BlockObjectResponse,
  item: IListItem
): Promise<IListItem | void> => {
  if (
    block.type === "bulleted_list_item" ||
    block.type === "numbered_list_item"
  ) {
    if (!block.has_children) {
      return item;
    } else {
      const resp = await notion.blocks.children.list({
        block_id: block.id,
        page_size: 100,
      });
      for (const b of resp.results) {
        if (isFullBlock(b)) {
          if (
            b.type === "numbered_list_item" ||
            b.type === "bulleted_list_item"
          ) {
            const type = b.type;
            const newItem: IListItem = {
              content: b[type].rich_text.map(mapRichText),
            };
            if (item.children) {
              item.children.push(newItem);
            } else {
              item.children = [newItem];
            }
            await getAllListChildren(notion, b, newItem);
          }
        }
      }
    }
  }
};

/**
 * Merges list items into list objects
 *
 * @param {UnmergedBlock[]} unmerged Unmerged block array
 * @returns {Block[]}
 */
export const mergeListItems = (unmerged: IUnmergedBlock[]): IBlock[] => {
  const merged: IBlock[] = [];
  const isListItem = (b: IUnmergedBlock) =>
    b !== undefined && b.type.includes("list_item");
  let l = 0;
  let r = 1;
  let list: IList | undefined;
  let listType: "numbered_list" | "bulleted_list" | undefined;
  while (l < unmerged.length) {
    const left = unmerged[l];
    const right = r < unmerged.length ? unmerged[r] : undefined;
    if (list) {
      if (!right || listType !== right.type.slice(0, -5)) {
        merged.push({
          type: listType as "numbered_list" | "bulleted_list",
          content: [list],
        });
        listType = undefined;
        list = undefined;
        l = r;
      } else {
        list.children.push(right.content as IListItem);
      }
      r++;
      continue;
    }

    if (
      right !== undefined &&
      left !== undefined &&
      left.type !== right.type &&
      !isListItem(left) &&
      isListItem(right)
    ) {
      list = {
        children: [right.content as IListItem],
      };
      listType = right.type.slice(0, -5) as "numbered_list" | "bulleted_list";
      r++;
      merged.push(left as IBlock);
      continue;
    }
    merged.push(left as IBlock);
    l++;
    r++;
  }

  return merged;
};
