import { validateTime, generateObjectSchema } from './schema';
import { Document } from 'mongoose';

export interface ISchedule extends Document {
  start_time?:string;
  start?:string;
  end?:string;
  end_time?:string;
  from?:string;
  to?:string;
  lock?:string;
  days?:number[];
}

export const schema = generateObjectSchema<ISchedule>('Schedule', {
  start_time: {
    type: String,
    validate: validateTime,
  },
  start:  String,
  end:    String,
  end_time: {
    type: String,
    validate: validateTime,
  },
  from:   String,
  to:     String,
  days: [Number],
  lock:     String,
});

export default schema;
