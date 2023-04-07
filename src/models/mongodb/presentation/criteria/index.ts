import { generateObjectSchema, enumField } from '../../schema';

import CriteriaTrigger, { ICriteriaTrigger } from './trigger';

import { Document } from 'mongoose';

export interface ICriteria extends Document {
  triggers:ICriteriaTrigger[];
  transition:ECriteriaTransition;
}

export enum ECriteriaTransition {
  Regular = 'regular',
  Instant = 'instant',
}

export const schema = generateObjectSchema<ICriteria>('PresentationCriteria', {
  triggers:     { type: [CriteriaTrigger], required: true },
  transition:   enumField(ECriteriaTransition),
});

export default schema;
