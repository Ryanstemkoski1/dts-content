import { generateDocumentSchema, IDocument } from "../schema";
import { EEntityType } from "../../../domain/service";

import { AssetLocation } from "@triggerpointmedia/dts-server-client";

export interface ILocation extends IDocument {
  token: string;
  parent?: string;
  name: string;
  type: AssetLocation["type"];
}

export const schema = generateDocumentSchema<ILocation>(
  EEntityType.Location,
  {
    parent: { type: String },
    name: { type: String, required: true },
    type: { type: String, required: true },
  },
  {
    id: "uuid",
  }
);

export default schema;
