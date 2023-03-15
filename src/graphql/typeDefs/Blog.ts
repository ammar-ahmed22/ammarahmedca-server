import "reflect-metadata";
import { ObjectType, Field, Int, createUnionType } from "type-graphql";
import { Text, Image, RichText } from "./Global";
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

@ObjectType({ description: "Metadata model for blog and project posts" })
export class Metadata implements IMetadata {
  @Field({ description: "ID of the page in Notion." })
  id: string;

  @Field({ description: "Timestamp when page was last edited." })
  lastEdited: Date;

  @Field({ description: "Name of the page entry." })
  name: string;

  @Field({ nullable: true, description: "Pathname for blog posts." })
  pathname?: string;

  @Field({
    nullable: true,
    description: "Month year string for project posts.",
  })
  timeline?: string;

  @Field(type => [String], {
    nullable: true,
    description: "List of types for project or blog post.",
  })
  type?: string[];

  @Field(type => [String], {
    nullable: true,
    description: "Programming languages used for project or blog post.",
  })
  languages?: string[];

  @Field(type => [String], {
    nullable: true,
    description: "Frameworks used for project or blog post.",
  })
  frameworks?: string[];

  @Field({
    nullable: true,
    description: "GitHub link for project or blog post.",
  })
  github?: string;

  @Field({
    nullable: true,
    description: "External link for project or blog post.",
  })
  external?: string;

  @Field({
    nullable: true,
    description: "Description for project or blog post.",
  })
  description?: string;

  @Field({
    nullable: true,
    description: "Published date for project or blog post.",
  })
  published?: Date;

  @Field({ nullable: true, description: "Boolean for blog post." })
  isBlog?: boolean;

  @Field({ nullable: true, description: "Boolean for project post." })
  isProject?: boolean;

  @Field(type => Int, {
    nullable: true,
    description: "Read time in minutes for blog post.",
  })
  readTime?: number;

  @Field({ nullable: true, description: "Category for blog post." })
  category?: string;

  @Field({ nullable: true, description: "Boolean to show blog post." })
  isPublished?: boolean;
}

const TextOrImage = createUnionType({
  name: "TextOrImage",
  description: "Text or Image union type for content blocks.",
  types: () => [Text, Image] as const,
  // our implementation of detecting returned object type
  resolveType: value => {
    if ("plainText" in value && "annotations" in value) {
      return Text;
    }
    if ("url" in value && "caption" in value) {
      return Image;
    }
    return undefined;
  },
});

@ObjectType({ description: "Content block for blog." })
export class Content implements IContent {
  @Field()
  type: string;

  @Field(type => [TextOrImage])
  content: TextOrImageType[];
}

@ObjectType({ description: "Metadata filter options." })
export class FilterOpts implements IFilterOpts {
  @Field(type => [String])
  frameworks: string[];

  @Field(type => [String])
  type: string[];

  @Field(type => [String])
  languages: string[];

  @Field(type => [String])
  category: string[];
}

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
