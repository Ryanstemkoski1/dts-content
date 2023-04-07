import Animation, { IPresentationAnimation, schemaFilter } from './animation';
import Combination, { IPresentationCombination } from './combination';
import Criteria, { ICriteria } from './criteria';
import Element, { IPresentationElement } from './element';
import File, { IFile } from '../file';
import Schedule, { ISchedule } from '../schedule';

import { ISubDocument, validateTokens, generateSubDocumentSchema } from '../schema';

import { Schema } from 'mongoose';

export interface IPresentationSlide extends ISubDocument {
  position?:number;
  delay?:number;
  loop?:boolean;
  rewind?:boolean;
  name?:string;
  elements?:IPresentationElement[];
  animations?:any[];
  source_presentation?:string;
  source_slide?:string;
  combinations?:IPresentationCombination[];
  schedule?:ISchedule;
  hidden?:boolean;
  criteria?:ICriteria;
  media?:IFile;
  size?:number;
}

export const schema = generateSubDocumentSchema<IPresentationSlide>('PresentationSlide', {
  position:     { type: Number, default: 0 },
  schedule:     { type: Schedule },
  delay:        { type: Number, min: 3 },
  loop:         { type: Boolean },
  rewind:       { type: Boolean },
  hidden:       { type: Boolean },
  name:         { type: String, trim: true },
  elements:     { type: [Element] },
  animations:   {
    type: [Animation],
    get: (values:IPresentationAnimation[]) => {
      return (values || []).filter(schemaFilter);
    },
  },
  combinations: { type: [Combination] },
  tags:         { type: [String] },
  device_tags:  {
    type: [String],
    required: false,
    validate: validateTokens,
    description: 'Device tags',
  },
  source_presentation: { type: Schema.Types.ObjectId },
  source_slide:        { type: Schema.Types.ObjectId },
  criteria:            { type: Criteria },
  media:               { type: File },
});

export default schema;
