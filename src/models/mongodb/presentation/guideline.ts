import { generateObjectSchema, enumField } from '../schema';

import { Document } from 'mongoose';

export interface IPresentationGuideline extends Document {
  type:EPresentationGuidelineType;
  x:number;
  y:number;
}

export enum EPresentationGuidelineType {
  Horizontal = 'h',
  Vertical = 'v',
}

export const schema = generateObjectSchema<IPresentationGuideline>('PresentationGuideline', {
  type: enumField(EPresentationGuidelineType, false, EPresentationGuidelineType.Vertical),
  x: {
    type: Number,
    required: true,
    default: 0,
    get: x => x || 0,
    description: 'X position.',
  },
  y: {
    type: Number,
    required: true,
    default: 0,
    get: x => x || 0,
    description: 'Y position.',
  },
});

export default schema;
