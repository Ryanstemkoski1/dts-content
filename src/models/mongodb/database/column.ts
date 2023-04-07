import { ISubDocument, generateSubDocumentSchema, enumField } from '../schema';

export enum EDatabaseColumnType {
  Text = 'text',
  Media = 'media',
}

export interface IDatabaseColumn extends ISubDocument {
  name:string;
  type:EDatabaseColumnType;
}

export const schema = generateSubDocumentSchema<IDatabaseColumn>('DatabaseColumn', {
  name: { type: String, required: true },
  type: enumField(EDatabaseColumnType),
});

export default schema;
