import { Schema } from 'mongoose';

import { EEntityType } from '../../../domain/service';

import { IDocument, generateDocumentSchema, enumField } from '../schema';

import File, { IFile } from '../file';
import Schedule, { ISchedule } from '../schedule';

import MenuCategory, { IMenuCategory } from './category';
import MenuItem, { IMenuItem, schemaPayload as MenuItemPayload } from './item';
import MenuUpsale, { IMenuUpsale } from './upsale';

export interface IMenu extends IDocument {
  parent?:string;
  type?:EMenuType;
  position:number;
  title?:string;
  subtitle?:string;
  audio?:IFile;
  image?:IFile;
  image_mobile?:IFile;
  categories?:IMenuCategory[];
  items?:IMenuItem[];
  schedule?:ISchedule;
  upsales?:IMenuUpsale[];
}

export enum EMenuType {
  Orderable = 'orderable',
  Website = 'website',
  Dmc = 'dmc',
}

const fields = {
  parent:       { type: Schema.Types.ObjectId, ref: 'Menu', index: true, description: 'Parent menu ID' },
  type:         enumField(EMenuType, true, EMenuType.Orderable),
  position:     { type: Number, default: 0, description: 'Sort position' },
  title:        { type: String, trim: true, description: 'Title' },
  subtitle:     { type: String, trim: true, description: 'Subtitle' },
  audio:        { type: File, description: 'Intro audio' },
  image:        { type: File, description: 'Cover image' },
  image_mobile: { type: File, description: 'Cover image for mobile' },
  categories:   { type: [MenuCategory], default: [], description: 'Categories' },
  schedule:     { type: Schedule, description: 'Schedule' },
  upsales:      { type: [MenuUpsale], default: [], description: 'Upsale items' },
};

export const schema = generateDocumentSchema<IMenu>(EEntityType.Menu, {
  ...fields,
  items:        { type: [MenuItem], default: [], description: 'Items' },
}, {
  minimal: [
    'parent',
    'title',
    'image',
    'schedule',
    'type',
  ],
}, [
  {
    field: 'parent_menu',
    description: 'Parent menu',
    dependencies: ['parent'],
    type: EEntityType.Menu,
    method: async ({ db, select, parent }) => {
      return parent.parent ?
        await db.Menu.findById(parent.parent).select(select).exec() :
        undefined;
    },
  },
]);

export const schemaPayload = generateDocumentSchema<IMenu>('MenuPayload', {
  ...fields,
  items:        { type: [MenuItemPayload], default: [], description: 'Items' },
});

export default schema;
