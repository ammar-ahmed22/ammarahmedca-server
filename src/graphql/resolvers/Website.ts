import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import { Client, isFullPage } from "@notionhq/client";
import { Arg, Query, Resolver } from "type-graphql";
import { extractPropertyValue } from "../../utils/notion";
import { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

import { Experience, ProjectMetadata, Skill } from "../typeDefs/Website";
import {
  IProjectMetadata,
  IRichText,
  ISkill,
  IExperience,
  ITimeframe,
} from "@ammarahmedca/types";

@Resolver()
export class WebsiteResolver {
  constructor(
    private notion = new Client({ auth: process.env.NOTION_INTEGRATION_KEY }),
    private exp_db_id = process.env.NOTION_EXP_DB_ID as string,
    private skill_db_id = process.env.NOTION_SKILL_DB_ID as string,
    private projects_db_id = process.env.NOTION_PROJECT_DB_ID as string
  ) {}

  private createExperience = (page: PageObjectResponse): IExperience => {
    return {
      company: extractPropertyValue(page.properties.Name) as string,
      role: extractPropertyValue(page.properties.Role) as string,
      description: extractPropertyValue(
        page.properties.Description
      ) as IRichText[],
      type: extractPropertyValue(page.properties.Type) as string,
      skills: extractPropertyValue(page.properties.Skills) as string[],
      timeframe: extractPropertyValue(page.properties.Timeframe) as ITimeframe,
    };
  };

  private createProjectMetadata = (
    page: PageObjectResponse
  ): IProjectMetadata => {
    const {
      name,
      description,
      date,
      languages,
      frameworks,
      type,
      external,
      github,
    } = page.properties;
    return {
      id: page.id,
      name: extractPropertyValue(name) as string,
      description: extractPropertyValue(description) as IRichText[],
      dateRange: extractPropertyValue(date) as ITimeframe,
      languages: extractPropertyValue(languages) as string[],
      frameworks: extractPropertyValue(frameworks) as string[],
      type: extractPropertyValue(type) as string[],
      github: extractPropertyValue(github) as string | undefined,
      external: extractPropertyValue(external) as string | undefined,
    };
  };

  private createSkill = (page: PageObjectResponse): ISkill => {
    return {
      name: extractPropertyValue(page.properties.Name) as string,
      type: extractPropertyValue(page.properties.Type) as string,
      value: extractPropertyValue(page.properties.Competency) as number,
    };
  };

  @Query(returns => [Experience], { description: "Gets all experiences." })
  async experiences() {
    const response = await this.notion.databases.query({
      database_id: this.exp_db_id,
      filter: {
        or: [],
      },
    });

    return response.results.map(page => {
      if (isFullPage(page)) {
        return this.createExperience(page);
      }
    });
  }

  @Query(returns => [Skill], {
    description: "Gets all skill values with optional filtering by type.",
  })
  async skills(
    @Arg("onlyType", { nullable: true }) onlyType?: string
  ): Promise<ISkill[]> {
    const filter: any = {
      or: [],
    };

    if (onlyType) {
      filter.or.push({
        property: "Type",
        select: {
          equals: onlyType,
        },
      });
    }
    const response = await this.notion.databases.query({
      database_id: this.skill_db_id,
      filter,
    });

    return response.results.map(page => {
      return this.createSkill(page as PageObjectResponse);
    });
  }

  @Query(returns => [String], { description: "Gets all types for skills." })
  async skillTypes() {
    const response = await this.notion.databases.retrieve({
      database_id: this.skill_db_id,
    });

    if (response.properties.Type.type === "select") {
      return response.properties.Type.select.options.map(option => option.name);
    }
  }

  @Query(returns => [ProjectMetadata])
  async projectMetadata(
    @Arg("onlyPublished", { nullable: true }) onlyPublished?: boolean,
    @Arg("languages", returns => [String], { nullable: true })
    languages?: string[],
    @Arg("frameworks", returns => [String], { nullable: true })
    frameworks?: string[],
    @Arg("type", returns => [String], { nullable: true }) type?: string[]
  ) {
    const filters: { or: { and: any[] }[] } = {
      or: [
        {
          and: [],
        },
      ],
    };
    let hasFilters = false;
    if (onlyPublished) {
      filters.or[0].and.push({
        property: "publish",
        checkbox: {
          equals: true,
        },
      });
      hasFilters = true;
    }

    if (languages) {
      filters.or[0].and.push(
        ...languages.map(l => ({
          property: "languages",
          multi_select: {
            contains: l,
          },
        }))
      );
      hasFilters = true;
    }

    if (frameworks) {
      filters.or[0].and.push(
        ...frameworks.map(f => ({
          property: "frameworks",
          multi_select: {
            contains: f,
          },
        }))
      );
      hasFilters = true;
    }

    if (type) {
      filters.or[0].and.push(
        ...type.map(t => ({
          property: "type",
          multi_select: {
            contains: t,
          },
        }))
      );
      hasFilters = true;
    }

    const resp = await this.notion.databases.query({
      database_id: this.projects_db_id,
      filter: hasFilters ? filters : undefined,
    });
    console.log("QUERY: projectMetadata");
    return resp.results.map(page => {
      return this.createProjectMetadata(page as PageObjectResponse);
    });
  }

  @Query(returns => [String])
  async projectFrameworks() {
    const resp = await this.notion.databases.retrieve({
      database_id: this.projects_db_id,
    });

    if (resp.properties.frameworks.type === "multi_select") {
      return resp.properties.frameworks.multi_select.options.map(
        opt => opt.name
      );
    }

    return [];
  }

  @Query(returns => [String])
  async projectTypes() {
    const resp = await this.notion.databases.retrieve({
      database_id: this.projects_db_id,
    });

    if (resp.properties.type.type === "multi_select") {
      return resp.properties.type.multi_select.options.map(opt => opt.name);
    }

    return [];
  }

  @Query(returns => [String])
  async projectLanguages() {
    const resp = await this.notion.databases.retrieve({
      database_id: this.projects_db_id,
    });

    if (resp.properties.languages.type === "multi_select") {
      return resp.properties.languages.multi_select.options.map(
        opt => opt.name
      );
    }

    return [];
  }
}
