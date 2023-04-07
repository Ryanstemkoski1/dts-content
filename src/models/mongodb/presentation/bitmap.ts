import { ISubDocument, generateSubDocumentSchema } from '../schema';

export interface IPresentationBitmap extends ISubDocument {
  data:string;
}

export const schema = generateSubDocumentSchema<IPresentationBitmap>('PresentationBitmap', {
  data: { type: String, required: true },
});

export default schema;
