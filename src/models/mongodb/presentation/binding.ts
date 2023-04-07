import {
  ISubDocument,
  generateSubDocumentSchema,
  enumField,
  generateObjectSchema,
} from '../schema';
import { Document } from 'mongoose';

export enum EPresentationBindingType {
  Subscription = 'subscription',
  Database = 'database',
  Datetime = 'datetime',
  Menu = 'menu',
  Template = 'template',
  Url = 'url',
}

export enum EPresentationBindingTarget {
  Color = 'color',
  BackgroundColor = 'background-color',
  StrokeColor = 'stroke-color',
  BorderColor = 'border-color',
  Media = 'media',
  Medias = 'medias',
  Text = 'text',
}

export enum EPresentationTransformType {
  Datetime = 'datetime',
}

export interface IPresentationBinding extends ISubDocument {
  path:string;
  feed:string;
  filter?:string;
  type:EPresentationBindingType;
  target:EPresentationBindingTarget;
}

export interface IPresentationBindingTransform extends Document {
  type:EPresentationTransformType;
  datetime?:IPresentationBindingTransformDatetime;
}

export interface IPresentationBindingTransformDatetime extends Document {
  format?:string;
  timezone?:string;
}

const transformDatetimeSchema = generateObjectSchema<IPresentationBindingTransformDatetime>('PresentationBindingTransformDatetime', {
  format: { type: String, required: false },
  timezone: { type: String, required: false },
});

const transformSchema = generateObjectSchema<IPresentationBindingTransform>('PresentationBindingTransform', {
  type:  enumField(EPresentationTransformType),
  datetime: transformDatetimeSchema,
});

export const schemaFilter = (value:IPresentationBinding):boolean => {
  if (!value.path || !value.feed || !value.type || !value.target) {
    return false;
  }

  return true;
};

export const schema = generateSubDocumentSchema<IPresentationBinding>('PresentationBinding', {
  path:    { type: String, required: true },
  feed:    { type: String, required: true },
  filter:  { type: String, required: false },
  type:    enumField(EPresentationBindingType),
  target:  enumField(EPresentationBindingTarget),
  transform: transformSchema,
});

export default schema;
