import config from "../config";
import logger from "./logger";

import { Client, EClientStage } from "@triggerpointmedia/dts-server-client";

const client = new Client({
  logger,
  env:
    config.env === "production"
      ? EClientStage.Production
      : EClientStage.Staging,
  vpc: !config.is_debug,
  trace: config.is_tracing,
  testing: config.is_testing,
  name: config.name,
});

export default client;
