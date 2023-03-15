import "reflect-metadata";
import { Field, Int, ObjectType } from "type-graphql";
import { Text, RichText } from "./Global";
import {
  IExperience,
  IRichText,
  ISkill,
  ITimeframe,
  IProjectMetadata,
} from "@ammarahmedca/types";

// EXPERIENCE
@ObjectType({
  description: "Duration of experience (null end means currently active)",
})
export class Timeframe implements ITimeframe {
  @Field({ description: "Start of experience." })
  start: Date;

  @Field({ nullable: true, description: "End of experience." })
  end?: Date;
}

@ObjectType({ description: "Experience information." })
export class Experience implements IExperience {
  @Field({ description: "Company experience is for." })
  company: string;

  @Field({ description: "Role at company." })
  role: string;

  @Field(type => [RichText], { description: "Description of experience." })
  description: IRichText[];

  @Field({ description: "Type/Field of experience." })
  type: string;

  @Field(type => [String], {
    description: "Skills learned/employed at experience.",
  })
  skills: string[];

  @Field(type => Timeframe, { description: "Duration of experience." })
  timeframe: ITimeframe;
}

@ObjectType({ description: "Skill information." })
export class Skill implements ISkill {
  @Field({ description: "Name of skill." })
  name: string;

  @Field({ description: "Type categorization of skill." })
  type: string;

  @Field(type => Int, { description: "Competency in skill out of 100." })
  value: number;
}

@ObjectType({ description: "Metadata for project posts" })
export class ProjectMetadata implements IProjectMetadata {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field(returns => [RichText])
  description: IRichText[];

  @Field(returns => [String])
  languages: string[];

  @Field(returns => [String])
  frameworks: string[];

  @Field(returns => [String])
  type: string[];

  @Field(returns => Timeframe)
  dateRange: ITimeframe;

  @Field({ nullable: true })
  external?: string;

  @Field({ nullable: true })
  github?: string;
}
