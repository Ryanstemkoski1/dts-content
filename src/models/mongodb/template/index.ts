import { IDocument,  generateDocumentSchema, validateUuid } from '../schema';

import PresentationAsset, { IPresentationAsset } from '../presentation/asset';
import Bitmap, { IPresentationBitmap } from '../presentation/bitmap';
import Canvas from '../presentation/canvas';
import TemplateSlide, { ITemplateSlide } from './slide';
import TemplateData, { ITemplateData } from '../templatedata';
import { EEntityType } from '../../../domain/service';

import { Schema } from 'mongoose';

export interface ITemplate extends IDocument {
  title:string;
  category?:string;
  canvas:any;
  slides:ITemplateSlide[];
  preview?:string;
  size?:number;
  template_data:ITemplateData;
  render?:boolean;
  assets?:IPresentationAsset[];
  databases?:string[];
  bitmaps?:IPresentationBitmap[];
  tags?:string[];
  price?:number;
  purchased?:boolean;
  published?:boolean;
}

export const schema = generateDocumentSchema<ITemplate>(EEntityType.Template, {
  title:          { type: String, trim: true, required: true, description: 'Title' },
  category:       { type: String, trim: true, description: 'Category name' },
  canvas:         { type: Canvas, required: true, description: 'Campaign canvas' },
  slides:         { type: [TemplateSlide], required: true, description: 'Campaign slides' },
  preview:        { type: String, validate: validateUuid(true), description: 'Preview image ID' },
  preview_image:  { type: String },
  size:           { type: Number, description: 'Campaign content size' },
  template_data:  { type: TemplateData, required: true, description: 'Template data' },
  render:         { type: Boolean, description: 'Indicates if the campaign will be pre-recorded' },
  assets:         {
    type: [PresentationAsset],
    description: 'Related media files to include with this campaign',
  },
  bitmaps:        { type: [Bitmap], description: 'Bitmap elements data' },
  databases:      { type: [Schema.Types.ObjectId], description: 'Related databases to include with this campaign' },
  tags:           { type: [String], index: true, trim: true, description: 'List of tags' },
  price:          { type: Number, default: 0, description: 'Template price' },
  published:      { type: Boolean, description: 'Template is published' },
}, {
  minimal: [
    'title',
    'preview',
    'canvas',
    'tags',
    'price',
    'published',
  ],
});

schema.virtual('purchased').get(() => false);

export default schema;
