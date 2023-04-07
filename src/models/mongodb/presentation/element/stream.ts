import { generateObjectSchema, enumField } from "../../schema";

export enum EPresentationStreamType {
  Url = 'url',
  Webcam = 'webcam',
}

export const schema = generateObjectSchema('PresentationElementStream', {
  type:        enumField(EPresentationStreamType, true),
  url:         String,
});

export default schema;
