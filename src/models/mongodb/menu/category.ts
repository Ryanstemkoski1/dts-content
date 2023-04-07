import { ISubDocument, generateSubDocumentSchema } from '../schema';
import { Schema } from 'mongoose';

import File, { IFile } from '../file';

export interface IMenuCategory extends ISubDocument {
  parent?:string;
  position?:number;
  title?:string;
  subtitle?:string;
  description?:string;
  audio?:IFile;
  image?:IFile;
  image_mobile?:IFile;
}

export const schema = generateSubDocumentSchema<IMenuCategory>('MenuCategory', {
  parent:       { type: Schema.Types.ObjectId },
  position:     { type: Number, default: 0 },
  title:        { type: String, trim: true, required: true },
  subtitle:     { type: String, trim: true },
  description:  { type: String, trim: true },
  audio:        File,
  image:        File,
  image_mobile: File,
});

export default schema;
