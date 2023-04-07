import { generateObjectSchema, enumField, ISubDocument } from "../../schema";

export enum EPresentationWebImplementation {
  Default = 'default',
  Iframe = 'iframe',
}

export interface IPresentationElementWeb extends ISubDocument {
  implementation?:EPresentationWebImplementation;
}

export const schema = generateObjectSchema('PresentationElementWeb', {
  implementation:        enumField(EPresentationWebImplementation, true),
});

export default schema;
