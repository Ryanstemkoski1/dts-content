import { Document } from 'mongoose';

import { generateObjectSchema, enumField } from '../../schema';

export interface ICriteriaTrigger extends Document {
  source:ECriteriaSource;
  attribute:ECriteriaAttribute;
  value_text?:string;
  value_number_min?:string;
  value_number_max?:string;
}

export enum ECriteriaSource {
  Recognition = 'recognition',
  Weather = 'weather',
}

export enum ECriteriaAttribute {
  RecognitionAge = 'recognition_age',
  RecognitionSex = 'recognition_sex',
  WeatherTemperature = 'weather_temperature',
  WeatherCondition = 'weather_condition',
}

export const schema = generateObjectSchema<ICriteriaTrigger>('PresentationCriteriaTrigger', {
  source:       enumField(ECriteriaSource),
  attribute:    enumField(ECriteriaAttribute),
  value_text:         { type: String },
  value_number_min:   { type: Number },
  value_number_max:   { type: Number },
});

export default schema;
