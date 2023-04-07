import config from "../config";

import logger, { traceLogger } from "../services/logger";

import * as Boom from "@hapi/boom";
import * as Joi from "@hapi/joi";
import * as Hapi from "@hapi/hapi";
import * as hapiSwagger from "hapi-swagger";
import * as hapiInert from "@hapi/inert";
import * as hapiVision from "@hapi/vision";
import { hapiScheme } from "@triggerpointmedia/dts-microservice/service/auth";
import * as hapiXray from "hapi-xray";

const swaggerOptions: hapiSwagger.RegisterOptions = {
  info: {
    title: "Content service",
    version: config.version,
  },
  schemes: [config.is_debug ? "http" : "https"],
  // host: config.api.host,
  // basePath: config.api.path,
  reuseDefinitions: false,
  securityDefinitions: {
    jwt: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
    },
  },
};

export class WebServer {
  public hapi: Hapi.Server;

  constructor(private readonly handlers: any) {
    this.hapi = new Hapi.Server({
      debug:
        config.is_debug && !config.is_testing ? { request: ["error"] } : false,
      port: config.is_testing ? 0 : config.port,
      routes: {
        cors: {
          origin: ["*"],
          headers: [
            "Accept",
            "Accept-language",
            "Authorization",
            "Content-Type",
            "If-None-Match",
          ],
        },
        payload: {
          maxBytes: 10 * 1048576,
        },
        validate: {
          failAction: async (request, h, error) => {
            logger.warn({ error }, "Controller validation error.");

            if (config.env === "production") {
              throw Boom.badRequest(`Invalid request payload input`);
            } else {
              throw error;
            }
          },
        },
        // auth: config.is_debug && !config.is_testing ? false : undefined,
      },
      query: {
        parser: (q) => {
          const out = Object.keys(q).reduce((res, x) => {
            let key = x;

            if (key.endsWith("[]")) {
              key = key.substr(0, key.length - 2);
            }

            res[key] = q[x];

            return res;
          }, {});

          return out;
        },
      },
    });
    this.hapi.validator(Joi);
  }

  public async init() {
    this.handlers(this.hapi);
  }

  public async start() {
    await this.hapi.register(
      [
        hapiInert,
        hapiVision,
        {
          plugin: hapiSwagger,
          options: swaggerOptions,
        },
        config.is_tracing
          ? {
              plugin: hapiXray,
              options: {
                logger: traceLogger,
                segmentName: config.name,
                automaticMode: true,
              },
            }
          : undefined,
      ].filter((x) => x) as Hapi.ServerRegisterPluginObject<any>[]
    );

    this.hapi.auth.scheme("api", hapiScheme);
    this.hapi.auth.strategy("api", "api", {});
    this.hapi.auth.default({ strategy: "api" });

    await this.hapi.start();
  }

  public async stop() {
    if (this.hapi) {
      await this.hapi.stop();
      this.hapi = undefined;
    }
  }
}
