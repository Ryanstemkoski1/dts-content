import {
  applicationLogger,
  createLogger,
} from "@triggerpointmedia/dts-microservice/service/logger";

export const traceLogger = createLogger("xray", "error");

export default applicationLogger;
