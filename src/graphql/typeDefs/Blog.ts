import "reflect-metadata";
import { ObjectType, Field, Int, createUnionType } from "type-graphql";
import { Image, RichText } from "./Global";
import {
  IList,
  IListItem,
  IRichText,
  IBlock,
  IBlockContent,
  BlockType,
  IPost,
  IPostMetadata,
  IEquation,
} from "@ammarahmedca/types";

@ObjectType()
export class PostMetadata implements IPostMetadata {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(returns => [RichText])
  description: IRichText[];

  @Field()
  category: string;

  @Field(returns => [String])
  tags: string[];

  @Field()
  date: Date;

  @Field()
  slug: string;

  @Field({ nullable: true })
  image?: string;
}

@ObjectType({
  description: "List item with unlimited depth of children",
})
export class ListItem implements IListItem {
  @Field(returns => [RichText])
  public content: IRichText[];

  @Field(returns => [ListItem], { nullable: true })
  public children?: IListItem[];
}

@ObjectType()
export class List implements IList {
  @Field(returns => [ListItem])
  public children: IListItem[];
}

@ObjectType()
export class Equation implements IEquation {
  @Field()
  expression: string;
}

export const BlockContent = createUnionType({
  name: "BlockContent",
  description: "Union type for block content",
  types: () => [Image, List, RichText, Equation] as const,
  resolveType: value => {
    if ("expression" in value) {
      return Equation;
    }

    if ("plainText" in value) {
      return RichText;
    }
    if ("children" in value) {
      return List;
    }
    if ("url" in value) {
      return Image;
    }
    return undefined;
  },
});

@ObjectType({
  description: "Block content for posts",
})
export class Block implements IBlock {
  @Field(returns => String)
  public type: BlockType;

  @Field(returns => [BlockContent])
  public content: IBlockContent[];
}

@ObjectType()
export class Post implements IPost {
  @Field(returns => PostMetadata)
  public metadata: IPostMetadata;

  @Field(returns => [Block])
  public content: IBlock[];
}
