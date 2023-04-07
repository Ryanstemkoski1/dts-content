import File, { IFile } from '../file';
import Entry, { IEntry } from '../entry';
import { ISubDocument, generateSubDocumentSchema, enumField } from '../schema';
import { Schema } from 'mongoose';

export enum EModifierItemSelection {
  States = 'states',
  Toggle = 'toggle',
}

export interface IModifierItem extends ISubDocument {
  position?:number;
  title?:string;
  is_default?:boolean;
  image?:IFile;
  order:IEntry;
  selection?:EModifierItemSelection;
  hidden?:boolean;
  link?:string;
  links?:string[];
}

export const schema = generateSubDocumentSchema<IModifierItem>('ModifierItem', {
  position:     { type: Number, default: 0 },
  title:        { type: String, trim: true },
  image:        { type: File },
  order:        { type: Entry, required: true },
  is_default:   { type: Boolean },
  selection:    enumField(EModifierItemSelection, true, EModifierItemSelection.Toggle),
  links: {
    type: [Schema.Types.ObjectId],
    description: 'Linked modifier group IDs.',
  },
  link: {
    type: Schema.Types.ObjectId,
    description: 'Linked modifier group ID (deprecated).',
  },
  labels:       { type: [String] },
  ingredients_list:  { type: [Schema.Types.ObjectId] },
  hidden: {
    type: Boolean,
    description: 'Hide modifier',
  },
  source_item: {
    type: Schema.Types.ObjectId,
    description: 'Copy source modifier item ID',
  },
});

export default schema;
