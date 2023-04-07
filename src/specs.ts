import { schemaPayload as Menu } from "./models/mongodb/menu";

import * as utils from "./routes/utils";
import { extensionSchema } from "./schema";

import logger from "./services/logger";
import server from "./server";

import { ISwagger } from "@triggerpointmedia/dts-service/domain/swagger";
import { buildSchemaDefinitions } from "@triggerpointmedia/dts-service/service/swagger";
import * as fs from "fs";

const filepathGraphql = "schema.graphql";
const filepathSwagger = "swagger.json";

const extras: any[] = [Menu];

server
  .start()
  .then(async (srv) => {
    const res = await srv.inject({
      url: "/swagger.json",
      method: "GET",
    });

    if (fs.existsSync(filepathSwagger)) {
      fs.unlinkSync(filepathSwagger);
    }

    const schema = res.result as ISwagger;

    const extraSchemas = extras.map((x) =>
      utils.documentModel(x, { operation: "read" })
    );
    const extraDefs = await buildSchemaDefinitions(extraSchemas);

    Object.keys(extraDefs).forEach((x) => {
      if (schema.definitions[x]) {
        return;
      }

      schema.definitions[x] = extraDefs[x];
    });

    fs.writeFileSync(filepathSwagger, JSON.stringify(schema));

    return srv;
  })
  .then(async (srv) => {
    if (fs.existsSync(filepathGraphql)) {
      fs.unlinkSync(filepathGraphql);
    }

    const data = server.graphql.getSchema();

    const schema =
      data.replace(/type Subscription/g, "") + "\n" + extensionSchema;

    fs.writeFileSync(filepathGraphql, schema);
  })
  .then(async () => {
    logger.debug({}, "Spec files have been generated.");

    await server.stop();
    process.exit(0);
  })
  .catch((error) => {
    logger.fatal({ error }, "Server error.");
    process.exit(1);
  });
