import { Document, Schema } from 'mongoose';

import { ISubDocument, generateSubDocumentSchema, generateObjectSchema, enumField } from '../schema';
import Schedule, { ISchedule } from '../schedule';

export interface IMenuUpsale extends ISubDocument {
  title:string;
  menu_item:string;
  criteria:IMenuUpsaleCriteria;
}

export interface IMenuUpsaleCriteria extends Document {
  demographics?:IMenuUpsaleCriteriaDemographics;
  order?:IMenuUpsaleCriteriaOrder;
  page?:IMenuUpsaleCriteriaPage;
  schedule?:ISchedule;
  weather?:IMenuUpsaleCriteriaWeather;
}

export interface IMenuUpsaleCriteriaOrder extends Document {
  menu?:string;
  menu_item?:string;
}

export interface IMenuUpsaleCriteriaPage extends Document {
  type:EMenuUpsaleCriteriaPageType;
  menu?:string;
  menu_category?:string;
}

export enum EMenuUpsaleCriteriaPageType {
  Home = 'home',
  Menu = 'menu',
  MenuCategory = 'menu_category',
  Cart = 'cart',
}

export enum EMenuUpsaleCriteriaDemographicsSex {
  Male = 'male',
  Female = 'female',
}

export interface IMenuUpsaleCriteriaDemographics extends Document {
  sex?:EMenuUpsaleCriteriaDemographicsSex;
  age_min?:number;
  age_max?:number;
}

export interface IMenuUpsaleCriteriaWeather extends Document {
  condition?:EMenuUpsaleCriteriaWeatherCondition;
  temperature_min?:number;
  temperature_max?:number;
}

export enum EMenuUpsaleCriteriaWeatherCondition {
  Rain = 'rain',
}

const criteriaDemographicsSchema = generateObjectSchema<IMenuUpsale>('MenuUpsaleCriteriaDemographics', {
  sex:          enumField(EMenuUpsaleCriteriaDemographicsSex, true),
  age_min:      { type: Number, min: 0 },
  age_max:      { type: Number, max: 100 },
});

const criteriaOrderSchema = generateObjectSchema<IMenuUpsale>('MenuUpsaleCriteriaOrder', {
  menu:          { type: Schema.Types.ObjectId, ref: 'Menu' },
  menu_item:     { type: Schema.Types.ObjectId },
});

const criteriaPageSchema = generateObjectSchema<IMenuUpsale>('MenuUpsaleCriteriaPage', {
  type:          enumField(EMenuUpsaleCriteriaPageType, false),
  menu:          { type: Schema.Types.ObjectId, ref: 'Menu' },
  menu_category: { type: Schema.Types.ObjectId },
});

const criteriaWeatherSchema = generateObjectSchema<IMenuUpsale>('MenuUpsaleCriteriaWeather', {
  condition:       enumField(EMenuUpsaleCriteriaWeatherCondition, true),
  temperature_min: { type: Number },
  temperature_max: { type: Number },
});

const criteriaSchema = generateObjectSchema<IMenuUpsale>('MenuUpsaleCriteria', {
  demographics: { type: criteriaDemographicsSchema },
  order:        { type: criteriaOrderSchema },
  page:         { type: criteriaPageSchema },
  schedule:     { type: Schedule },
  weather:      { type: criteriaWeatherSchema },
});

export const schema = generateSubDocumentSchema<IMenuUpsale>('MenuUpsale', {
  title:         { type: String, trim: true, required: true, default: '' },
  menu_item:     {
    type: Schema.Types.ObjectId,
    required: true,
    description: 'Target menu item ID.'
  },
  criteria:      { type: criteriaSchema, required: true },
});

export default schema;
