import ModifierItem, { IModifierItem } from './item';
import File, { IFile } from '../file';
import { IDocument, generateDocumentSchema } from '../schema';
import { EEntityType } from '../../../domain/service';

import { Schema } from 'mongoose';

export interface IModifier extends IDocument {
  title:string;
  display_title?:string;
  audio?:IFile;
  image?:IFile;
  required?:boolean;
  items?:IModifierItem[];
  limit?:number;
  hidden?:boolean;
  source_modifier?:string;
}

const fields = {
  title:            { type: String, trim: true, required: true },
  display_title:    { type: String, trim: true },
  audio:            { type: File },
  image:            { type: File },
  required:         { type: Boolean },
  limit:            { type: Number, default: 0 },
  hidden:           { type: Boolean, description: 'Hide modifier' },
  items:            { type: [ModifierItem] },
  source_modifier:  { type: Schema.Types.ObjectId, ref: 'Modifier', description: 'Copy source modifier ID' },
};

export const schema = generateDocumentSchema<IModifier>(EEntityType.Modifier, {
  ...fields,
});

export const schemaPayload = generateDocumentSchema<IModifier>('ModifierPayload', {
  ...fields,
  link:         { type: Schema.Types.ObjectId },
});

export default schema;
