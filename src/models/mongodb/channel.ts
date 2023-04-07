import { IDocument, generateDocumentSchema } from './schema';
import { EEntityType } from '../../domain/service';

export interface IChannel extends IDocument {
  title:string;
  category?:string;
  devices:string[];
  presentations:string[];
}

export const schema = generateDocumentSchema<IChannel>(EEntityType.Channel, {
  title:      { type: String, trim: true, required: true },
  category:   { type: String },
  devices:    { type: [String], required: true },
  presentations: { type: [String], required: true },
});

export default schema;
