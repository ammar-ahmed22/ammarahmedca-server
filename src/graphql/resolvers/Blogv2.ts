import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import { Client } from "@notionhq/client";
import { Query, Resolver, Arg } from "type-graphql";
import {
  PartialBlockObjectResponse,
  BlockObjectResponse,
  ListBlockChildrenResponse,
  PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints";
import {
  IPostMetadata,
  IRichText,
  IBlock,
  IUnmergedBlock,
  IListItem,
  IPost,
} from "@ammarahmedca/types";
import {
  extractPropertyValue,
  mapRichText,
  getAllListChildren,
  mergeListItems,
} from "../../utils/notion-v2";
import { PostMetadata, Post } from "../typeDefs/Blog";

@Resolver()
export class BlogResolverV2 {
  constructor(
    private notion: Client = new Client({
      auth: process.env.NOTION_INTEGRATION_KEY,
    }),
    private db_id: string = process.env.NOTION_BLOG_DB_2_ID as string
  ) {}

  private getAllPaginatedBlocks = async (blockId: string) => {
    let hasNext = true;
    let startCursor: string | undefined = undefined;
    let result: (PartialBlockObjectResponse | BlockObjectResponse)[] = [];
    while (hasNext) {
      const resp: ListBlockChildrenResponse =
        await this.notion.blocks.children.list({
          block_id: blockId,
          start_cursor: startCursor,
          page_size: 100,
        });

      hasNext = resp.has_more;
      startCursor = resp.next_cursor ?? undefined;
      result = result.concat(resp.results);
    }
    return result;
  };

  private createSlugFromString = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .split(" ")
      .join("-");
  };

  private addSlug = async (page_id: string, slug: string) => {
    await this.notion.pages.update({
      page_id,
      properties: {
        slug: {
          rich_text: [
            {
              text: {
                content: slug,
              },
            },
          ],
        },
      },
    });
  };

  private createMetadata = async (
    page: PageObjectResponse
  ): Promise<IPostMetadata> => {
    const { name, description, category, tags, date, slug } = page.properties;

    const nameString = extractPropertyValue(name) as string;
    const extractedSlug: IRichText[] = extractPropertyValue(
      slug
    ) as IRichText[];
    const nameSlug = this.createSlugFromString(nameString);
    if (!extractedSlug.length) await this.addSlug(page.id, nameSlug);

    let image: string | undefined;
    if (page.cover) {
      if (page.cover.type === "external") {
        image = page.cover.external.url;
      }

      if (page.cover.type === "file") {
        image = page.cover.file.url;
      }
    }

    return {
      id: page.id,
      name: extractPropertyValue(name) as string,
      description: extractPropertyValue(description) as IRichText[],
      category: extractPropertyValue(category) as string,
      tags: extractPropertyValue(tags) as string[],
      date: (extractPropertyValue(date) as ITimeframe).start,
      slug: !extractedSlug.length
        ? nameSlug
        : extractedSlug.map(r => r.plainText).join(""),
      image,
    };
  };

  private createBlocks = async (
    blocks: BlockObjectResponse[]
  ): Promise<IBlock[]> => {
    const unmerged = (await Promise.all(
      blocks
        .map(async (block): Promise<IUnmergedBlock | undefined> => {
          if (
            block.type === "heading_1" ||
            block.type === "heading_2" ||
            block.type === "heading_3" ||
            block.type === "paragraph" ||
            block.type === "quote"
          ) {
            const type = block.type;
            return {
              type: block.type,
              content: block[type].rich_text.map(mapRichText),
            };
          }

          if (block.type === "image") {
            if (block.image.type === "external") {
              return {
                type: "image",
                content: [
                  {
                    url: block.image.external.url,
                    caption: block.image.caption.map(mapRichText),
                  },
                ],
              };
            }
            if (block.image.type === "file") {
              return {
                type: "image",
                content: [
                  {
                    url: block.image.file.url,
                    caption: block.image.caption.map(mapRichText),
                  },
                ],
              };
            }
          }

          if (
            block.type === "bulleted_list_item" ||
            block.type === "numbered_list_item"
          ) {
            const type = block.type;
            const listItem: IListItem = {
              content: block[type].rich_text.map(mapRichText),
            };
            await getAllListChildren(this.notion, block, listItem);
            return {
              type,
              content: listItem,
            };
          }

          if (block.type === "equation"){
            return {
              type: block.type,
              content: [{
                expression: block.equation.expression
              }]
            }
          }
        })
        .filter(b => b !== undefined)
    )) as IUnmergedBlock[];
    return mergeListItems(unmerged).filter(b => b);
  };

  @Query(returns => [PostMetadata])
  async v2blogMetadata(
    @Arg("onlyPublished", { nullable: true }) onlyPublished?: boolean,
    @Arg("category", { nullable: true }) category?: string,
    @Arg("tags", returns => [String], { nullable: true }) tags?: string[]
  ): Promise<IPostMetadata[]> {
    const publishedFilter = {
      property: "publish",
      checkbox: {
        equals: true,
      },
    };

    const categoryFilter = {
      property: "category",
      select: {
        equals: category as string,
      },
    };

    const tagsFilters = tags?.map(tag => ({
      property: "tags",
      multi_select: {
        contains: tag,
      },
    }));

    let hasFilter = false;

    const filters: { or: { and: any[] }[] } = {
      or: [
        {
          and: [],
        },
      ],
    };
    if (onlyPublished) {
      filters.or[0].and.push(publishedFilter);
      hasFilter = true;
    }

    if (category) {
      filters.or[0].and.push(categoryFilter);
      hasFilter = true;
    }

    if (tags && tagsFilters) {
      filters.or[0].and.push(...tagsFilters);
      hasFilter = true;
    }

    

    const resp = await this.notion.databases.query({
      database_id: this.db_id,
      filter: hasFilter ? filters : undefined,
    });

    const result = await Promise.all(
      resp.results.map(async page => {
        const metadata = await this.createMetadata(page as PageObjectResponse);
        return metadata;
      })
    );

    return result;
  }

  @Query(returns => Post)
  async postBySlug(@Arg("slug") slug: string): Promise<IPost> {
    const resp = await this.notion.databases.query({
      database_id: this.db_id,
      filter: {
        and: [
          {
            property: "slug",
            rich_text: {
              equals: slug,
            },
          },
        ],
      },
    });

    if (!resp.results) throw new Error(`No post found with slug: '${slug}'`);

    const [page] = resp.results;
    const blocks = await this.getAllPaginatedBlocks(page.id);
    const metadata = await this.createMetadata(page as PageObjectResponse);
    const generatedBlocks = await this.createBlocks(
      blocks as BlockObjectResponse[]
    );

    return {
      metadata,
      content: generatedBlocks,
    };
  }

  @Query(returns => [String])
  async blogCategories(){
    const resp = await this.notion.databases.retrieve({ database_id: this.db_id });
    if (resp.properties.category.type === "select"){
      return resp.properties.category.select.options.map( opt => opt.name );
    }

    return []
  }

  @Query(returns => [String])
  async blogTags(){
    const resp = await this.notion.databases.retrieve({ database_id: this.db_id });
    if (resp.properties.tags.type === "multi_select"){
      return resp.properties.tags.multi_select.options.map( opt => opt.name );
    }

    return []
  }
}
