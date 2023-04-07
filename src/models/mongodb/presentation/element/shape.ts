import { generateObjectSchema, enumField } from "../../schema";

export enum EPresentationShapeType {
  Rectangle = 'rectangle',
  Circle = 'circle',
  Line = 'line',
}

export const schema = generateObjectSchema('PresentationElementShape', {
  type:         enumField(EPresentationShapeType, true),
});

export default schema;
