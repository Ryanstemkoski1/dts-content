import Bitmap, { IPresentationBitmap } from './bitmap';
import Canvas, { IPresentationCanvas } from './canvas';
import Display, { IPresentationDisplay } from './display';
import PresentationAsset, { IPresentationAsset } from './asset';
import PresentationSlide, { IPresentationSlide } from './slide';
import Schedule, { ISchedule } from '../schedule';
import TemplateData, { ITemplateData } from '../templatedata';
import { EEntityType } from '../../../domain/service';

import {
  IDocument,
  validateTokens,
  validateUuid,
  generateDocumentSchema,
  generateObjectSchema,
  enumField,
} from '../schema';

import { Schema, Document } from 'mongoose';

export interface IPresentationUse extends Document {
  slide?:string;
}

export const presentationUseSchema = generateObjectSchema<IPresentationUse>('PresentationUse', {
  slide: { type: Schema.Types.ObjectId },
});

export interface IPresentation extends IDocument {
  title:string;
  category?:string;
  schedule:ISchedule;
  canvas:IPresentationCanvas;
  slides:IPresentationSlide[];
  preview?:string;
  size?:number;
  template_data:ITemplateData;
  render?:boolean;
  assets?:IPresentationAsset[];
  bitmaps?:IPresentationBitmap[];
  tags?:string[];
  displays?:IPresentationDisplay[];
  databases?:string[];
  player_device?:string;
  player_devices?:string[];
  crossfade?:boolean;
  type?:EPresentationType;
}

export enum EPresentationType {
  Regular = 'regular',
  Slideshow = 'slideshow',
}

export const schema = generateDocumentSchema<IPresentation>(EEntityType.Presentation, {
  title:            { type: String, trim: true, required: true },
  schedule:         { type: Schedule },
  player_device:    {
    type: String,
    required: false,
    validate: validateUuid(true),
  },
  player_devices:   {
    type: [String],
    required: false,
    validate: validateTokens,
  },
  canvas:           { type: Canvas, required: true },
  slides:           { type: [PresentationSlide] },
  preview:          { type: String, validate: validateUuid(true), description: 'Preview image ID' },
  preview_image:    { type: String },
  size:             { type: Number },
  template_data:    { type: TemplateData },
  screensaver:      { type: Schema.Types.ObjectId, ref: EEntityType.Presentation },
  assets:           { type: [PresentationAsset] },
  databases:        { type: [Schema.Types.ObjectId] },
  bitmaps:          { type: [Bitmap] },
  category:         { type: String, trim: true },
  autoreload:       { type: Boolean },
  crossfade:        { type: Boolean },
  render:           { type: Boolean },
  displays:         { type: [Display] },
  tags:             { type: [String], ref: EEntityType.Tag },
  type: enumField(EPresentationType, true, EPresentationType.Regular),
}, {
  minimal: [
    'title',
    'player_device',
    'player_devices',
    'schedule',
    'preview',
    'screensaver',
    'category',
    'render',
    'tags',
    'type',
  ],
});

export default schema;
