import "reflect-metadata";
import dotenv from "dotenv";
dotenv.config({ path: "./config.env" });
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import express from "express";
import cors from "cors";
import { verify } from "jsonwebtoken";

import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";

import { connect } from "./utils/connectDB";
import { authChecker } from "./utils/auth";

import { buildSchema, GraphQLTimestamp } from "type-graphql";

import { BlogResolver } from "./graphql/resolvers/Blog";
import { WebsiteResolver } from "./graphql/resolvers/Website";
import { UserResolver } from "./graphql/resolvers/User";
import { GameResolver } from "./graphql/resolvers/Game";

import UserModel from "./models/User";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;
const EMIT_SCHEMA = process.env.EMIT_SCHEMA ? true : false;
import ConfirmationCode from "./emails/ConfirmationCode";
import { toHTML, toPlainText } from "./emails";

(async () => {
  const gameSchema = await buildSchema({
    resolvers: [UserResolver, GameResolver],
    scalarsMap: [{ type: Date, scalar: GraphQLTimestamp }],
    authChecker,
    emitSchemaFile: {
      path: __dirname + "/game.gql",
      sortedSchema: false,
    },
    validate: true,
  });

  const schema = await buildSchema({
    resolvers: [BlogResolver, WebsiteResolver],
    scalarsMap: [{ type: Date, scalar: GraphQLTimestamp }],
    authChecker,
    emitSchemaFile: {
      path: __dirname + "/schema.gql",
      sortedSchema: false,
    },
    validate: true,
  });

  if (EMIT_SCHEMA) return;
  const app = express();

  const gameServer = new ApolloServer<Context>({
    schema: gameSchema,
    introspection: true,
    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageProductionDefault({
            graphRef: "ammarahmedca-api-v2@production",
            footer: false,
          })
        : ApolloServerPluginLandingPageLocalDefault(),
    ],
    formatError: (formattedError, error) => {
      if (
        formattedError.message ===
        "Access denied! You need to be authorized to perform this action!"
      ) {
        const extensions = formattedError.extensions;
        return {
          ...formattedError,
          extensions: {
            ...extensions,
            code: "UNAUTHENTICATED",
          },
        };
      }
      return formattedError;
    },
  });

  const server = new ApolloServer({
    schema,
    introspection: true,
    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageProductionDefault({
            graphRef: "ammarahmedca-api-v2@production",
            footer: false,
          })
        : ApolloServerPluginLandingPageLocalDefault(),
    ],
  });

  if (process.env.NODE_ENV !== "production") {
    if (process.env.MONGO_URI) await connect(process.env.MONGO_URI);
    // Creating my own user and a test user
    const exists = await UserModel.findOne({ email: "a353ahme@uwaterloo.ca" });
    const testExists = await UserModel.findOne({ email: "ammar@fragbuy.ca" });

    if (!exists && process.env.MY_USER_PASS) {
      await UserModel.create({
        firstName: "Ammar",
        lastName: "Ahmed",
        company: "AI Arena",
        position: "Frontend Developer",
        email: "a353ahme@uwaterloo.ca",
        emailConfirmed: true,
        password: process.env.MY_USER_PASS,
      });

      console.log("my user created!");
    }

    if (!testExists && process.env.MY_USER_PASS) {
      await UserModel.create({
        firstName: "Test",
        lastName: "Testerman",
        company: "Test Inc.",
        position: "Tester",
        email: "ammar@fragbuy.ca",
        emailConfirmed: true,
        password: process.env.MY_USER_PASS,
      });

      console.log("test user created!");
    }
  }

  await server.start();
  await gameServer.start();

  app.use(
    "/game",
    cors<cors.CorsRequest>(),
    express.json({ limit: "10mb" }),
    expressMiddleware<Context>(gameServer, {
      context: async ({ req }) => {
        if (
          !req.headers.authorization ||
          !req.headers.authorization.split(" ")[1]
        )
          return {};

        const token = req.headers.authorization.split(" ")[1];

        const user = <JWTUserPayload>(
          verify(token, process.env.JWT_SECRET as string)
        );

        return {
          userId: user.id,
        };
      },
    })
  );

  app.use(
    "/",
    cors<cors.CorsRequest>(),
    express.json({ limit: "10mb" }),
    expressMiddleware(server)
  );

  app.listen(PORT, () =>
    console.log(`🚀 Server listening at http://localhost:${PORT}`)
  );
})();
