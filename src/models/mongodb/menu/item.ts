import { ISubDocument, generateSubDocumentSchema, validateUuid, enumField } from '../schema';
import { Schema } from 'mongoose';

import Allergen from '../allergen';
import File, { IFile } from '../file';
import Entry, { IEntry } from '../entry';
import MenuItemIngredient, { IMenuItemIngredient } from './ingredient';
import { schemaPayload as ModifierPayload } from '../modifier';
import MenuItemModifierOverride, { IMenuItemModifierOverride } from './override';
import Schedule, { ISchedule } from '../schedule';

import { EEntityType } from '../../../domain/service';

export interface IMenuItem extends ISubDocument {
  title:string;
  image?:IFile;
  ingredients_list?:IMenuItemIngredient[];
  hidden?:boolean;
  schedule?:ISchedule;
  order:IEntry;
  order_refill?:IEntry;
  order_main?:{ [x:string]:IEntry };
  main_modifier?:string;
  modifiers_overrides?:IMenuItemModifierOverride[];
  allergens?:string[];
  modifiers?:string[];
  source_menu?:string;
  source_item?:string;
}

export enum EMenuItemType {
  Orderable = 'orderable',
  Website = 'website',
  Dmc = 'dmc',
  Pdf = 'pdf',
}

export enum EMenuItemUi {
  Regular = 'regular',
}

const fields = {
  parent:       { type: Schema.Types.ObjectId },
  position:     { type: Number, default: 0 },
  type:         enumField(EMenuItemType, true, EMenuItemType.Orderable),
  ui:           enumField(EMenuItemUi, true, EMenuItemUi.Regular),
  title:        { type: String, trim: true, required: true },
  description:  { type: String, trim: true },
  ingredients:  { type: String, trim: true },
  image:        { type: File },
  image_mobile: { type: File },
  photos:       { type: [File] },
  order:        { type: Entry, required: true },
  order_refill: { type: Entry },
  order_main:   { type: Schema.Types.Map },
  website:      { type: String, trim: true },
  flash:        { type: File },
  pdf:          { type: File },
  ingredients_list:  { type: [MenuItemIngredient] },
  dmc_device:   { type: String, required: false, validate: validateUuid(true), },
  schedule:     { type: Schedule },
  hide_in_menu: { type: Boolean, default: false },
  hide_in_pos:  { type: Boolean, default: false },
  main_modifier:{ type: Schema.Types.ObjectId },
  modifiers_overrides:    { type: [MenuItemModifierOverride] },
  hidden:       { type: Boolean, description: 'Hide menu item' },
  source_menu:  { type: Schema.Types.ObjectId, ref: 'Menu', description: 'Copy source menu ID' },
  source_item:  { type: Schema.Types.ObjectId, description: 'Copy source menu item ID' },
};

export const schema = generateSubDocumentSchema<IMenuItem>('MenuItem', {
  ...fields,
  allergens:    { type: [Schema.Types.ObjectId] },
  modifiers:    { type: [Schema.Types.ObjectId] },
}, {}, [
  {
    field: 'allergens_list',
    description: 'Allergens',
    dependencies: ['allergens'],
    type: EEntityType.Allergen,
    isArray: true,
    method: async ({ db, select, parent }) => {
      return parent.allergens ?
        await db.Allergen.find({
          _id: { $in: parent.allergens },
        }).select(select).exec() :
        undefined;
    },
  },
  {
    field: 'modifiers_list',
    description: 'Modifiers',
    dependencies: ['modifiers'],
    type: EEntityType.Modifier,
    isArray: true,
    method: async ({ db, select, parent }) => {
      return parent.modifiers ?
        await db.Modifier.find({
          _id: { $in: parent.modifiers },
        }).select(select).exec() :
        undefined;
    },
  },
]);

export const schemaPayload = generateSubDocumentSchema<IMenuItem>('MenuItemPayload', {
  ...fields,
  allergens: { type: [Allergen] },
  modifiers: { type: [ModifierPayload] },
});

export default schema;
