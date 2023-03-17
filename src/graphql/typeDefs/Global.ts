import "reflect-metadata";
import { ObjectType, Field } from "type-graphql";
import {
  IAnnotations,
  AnnotationsColor,
  IImage,
  IRichText,
} from "@ammarahmedca/types";

@ObjectType({ description: "Object containing properties for rich text." })
class Annotations implements IAnnotations {
  @Field({ description: "Bold text." })
  bold: boolean;

  @Field({ description: "Underlined text." })
  underline: boolean;

  @Field({ description: "Text with a line through it." })
  strikethrough: boolean;

  @Field({ description: "Inline code text." })
  code: boolean;

  @Field({ description: "Italicized text." })
  italic: boolean;

  @Field(returns => String, { description: "Colored text." })
  color: AnnotationsColor;

  @Field({ nullable: true, description: "Name of language for code block." })
  language?: string;
}



@ObjectType()
export class RichText implements IRichText {
  @Field({ description: "Text content for rich text." })
  plainText: string;

  @Field({ description: "HREF for link text.", nullable: true })
  href?: string;

  @Field(type => Annotations, { description: "Rich text annotations." })
  annotations: Annotations;
}

@ObjectType({ description: "Object containing image properties." })
export class Image implements IImage {
  @Field({ description: "Image url." })
  url: string;

  @Field(returns => [RichText], { description: "Image caption." })
  caption: IRichText[];
}
