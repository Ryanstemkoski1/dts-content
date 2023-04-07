import { validateColor, ISubDocument, generateSubDocumentSchema, generateObjectSchema, enumField } from '../schema';
import File, { IFile } from '../file';

import { Document, Schema } from 'mongoose';

export interface ITemplateDataItem extends ISubDocument {
  description:string;
  type:ETemplateDataItemType;
  value_text?:string;
  value_color?:string;
  value_media?:IFile;
  default_text?:string;
  default_color?:string;
  default_media?:IFile;
  hidden?:boolean;
  hints_media?:any[];
  group?:string;
  position?:number;
}

export interface ITemplateDataItemTheme extends Document {
  theme:string;
  default_text?:string;
  default_color?:string;
  default_media?:IFile;
  hints_media?:IFile[];
}

export enum ETemplateDataItemType {
  Text = 'text',
  Color = 'color',
  Media = 'media',
}

export const itemTheme = generateObjectSchema<ITemplateDataItemTheme>('TemplateDataItemTheme', {
  theme: {
    type: Schema.Types.ObjectId,
    required: true,
    description: 'Theme ID',
  },
  default_text: { type: String, description: 'Theme-defined text' },
  default_color: { type: String, validate: validateColor(true), description: 'Theme-defined color' },
  default_media: { type: File, description: 'Theme-defined media' },
  hints_media: {
    type: [File],
    description: 'Suggested media files',
  },
});

export const schema = generateSubDocumentSchema<ITemplateDataItem>('TemplateDataItem', {
  description:    {
    type: String,
    required: false,
    trim: true,
    default: '',
    description: 'Field description',
  },
  type:           enumField(ETemplateDataItemType, true),
  default_text:   { type: String, description: 'Template-defined text' },
  default_color:  { type: String, validate: validateColor(true), description: 'Template-defined color' },
  default_media:  { type: File, description: 'Template-defined media' },
  value_text:     { type: String, description: 'User-defined text' },
  value_color:    { type: String, validate: validateColor(true), description: 'User-defined color' },
  value_media:    { type: File, description: 'User-defined media' },
  themes:         {
    type: [itemTheme],
    required: false,
    description: 'Theme overrides',
  },
  hidden:         {
    type: Boolean,
    description: 'Hide related presentation elements',
  },
  hints_media:    {
    type: [File],
    description: 'Suggested media files',
  },
  group:          {
    type: String,
    required: false,
    trim: true,
    description: 'Group name',
  },
  position:       {
    type: Number,
    required: false,
    default: 0,
    description: 'Sort position',
  },
});

export default schema;
