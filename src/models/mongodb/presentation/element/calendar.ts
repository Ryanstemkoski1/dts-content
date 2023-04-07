import File from '../../file';
import { generateObjectSchema, enumField } from '../../schema';

import { Document } from 'mongoose';

export enum EPresentationElementCalendarTheme {
  Light = 'light',
  Dark = 'dark',
}

export interface IPresentationElementCalendar extends Document {
  calendar?:string;
  readonly:boolean;
  theme:EPresentationElementCalendarTheme;
  background?:any;
}

export const schema = generateObjectSchema<IPresentationElementCalendar>('PresentationCalendar', {
  calendar: { type: String, required: false, description: 'Calendar ID.' },
  readonly: { type: Boolean, required: true, description: 'Calendar is readonly.' },
  theme: enumField(EPresentationElementCalendarTheme, true),
  background: { type: File, required: false, description: 'Background image.' },
});

export default schema;
