import { Document } from 'mongoose';

import { validateUuid, generateObjectSchema, validateInteger } from './schema';
import Schedule, { ISchedule } from './schedule';

export interface IFile extends Document {
  token:string;
  mime:string;
  width?:number;
  height?:number;
  duration?:number;
  pages?:number;
  original?:boolean;
  schedules:ISchedule[];
}

export const schema = generateObjectSchema<IFile>('File', {
  token: {
    type: String,
    required: true,
    validate: validateUuid(),
    description: 'Media ID.',
  },
  mime: {
    type: String,
    required: true,
    description: 'Original mime type',
  },
  width:  { type: Number, description: 'Image/video width' },
  height: { type: Number, description: 'Image/video height' },
  duration: {
    type: Number,
    min: 1,
    validate: validateInteger(true),
    description: 'Video duration in seconds (if applicable)',
  },
  pages: {
    type: Number,
    min: 1,
    validate: validateInteger(true),
    description: 'Total number of pages (if applicable)',
  },
  original: { type: Boolean, description: 'Is original media version' },
  schedules:      { type: [Schedule], description: 'Media schedules' },
});

export default schema;
