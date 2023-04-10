import config from "../config";

import logger from "../services/logger";

import * as AWSXRay from "aws-xray-sdk-core";
import { LevelLogger } from "@triggerpointmedia/dts-microservice/service/logger";
import * as Hapi from "@hapi/hapi";
import { buildFederatedSchema } from "@apollo/federation";
import { mergeSchemas } from "@graphql-tools/schema";
import { ApolloServer, gql } from "apollo-server-hapi";
import { ApolloServerPluginInlineTraceDisabled } from "apollo-server-core";
import { schemaComposer } from "graphql-compose";
import { printSchema } from "graphql/utilities";
import { buildSchema } from "graphql";

import { IGraphContext } from "../domain/graphql";

import { extensionSchema } from "../schema";

export class GraphQLServer {
  public server: ApolloServer;

  constructor(private readonly hapi: Hapi.Server) {}

  public async start() {
    const mergedSchema = mergeSchemas({
      schemas: [
        buildSchema(this.getSchema()),
        buildSchema(extensionSchema, { assumeValid: true }),
      ],
    });

    const schema = buildFederatedSchema([
      {
        resolvers: schemaComposer.getResolveMethods() as any, // TODO: fix
        typeDefs: gql(printSchema(mergedSchema)),
      },
    ]);

    // if (config.is_tracing) {
    //   schema = aws.applySchemaTracer(schema);
    // }

    // const schema = schemaComposer.buildSchema();

    this.server = new ApolloServer({
      schema,
      logger: new LevelLogger("debug", [logger]),
      debug: config.is_debug,
      // playground: config.is_debug,
      // subscriptions: false,
      // tracing: false, // config.env !== 'production',
      introspection: config.env !== "production",
      persistedQueries: config.is_debug ? false : { ttl: null },
      context: async ({ h }) => {
        return {
          request: h.request,
          auth: h.request.auth,
          segment:
            h.request.segment ||
            (config.is_tracing ? AWSXRay.getSegment() : undefined),
        } as IGraphContext;
      },
      plugins:
        config.env === "production"
          ? [ApolloServerPluginInlineTraceDisabled()]
          : undefined,
    });

    await this.server.start();

    await this.server.applyMiddleware({
      app: this.hapi,
      path:'/graphql'
      // route: config.is_debug ? {
      //   auth: false,
      // } : undefined,
    });
  }

  public async stop() {
    if (this.server) {
      await this.server.stop();
      this.server = undefined;
    }
  }

  public getSchema(): string {
    let sdl = schemaComposer.toSDL({
      exclude: ["Boolean", "Float", "ID", "String", "Int"],
    });
    // sdl = sdl.replace(/type Subscription[\s\S]*}/g, '');
    // sdl = sdl.replace(/type (Content[A-Za-z0-9]+) {/g, 'type $1 @key(fields: "token") {');

    return sdl;
  }
}
