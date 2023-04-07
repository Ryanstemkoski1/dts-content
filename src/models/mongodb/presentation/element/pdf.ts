import { generateObjectSchema, enumField } from "../../schema";

import File from '../../file';

export enum EPresentationPdfType {
  Reader = 'reader',
  Magazine = 'magazine',
  Flip = 'flip',
}

export const schema = generateObjectSchema('PresentationElementPdf', {
  type:       enumField(EPresentationPdfType, true),
  media:      File,
});

export default schema;
