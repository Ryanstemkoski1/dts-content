import { generateObjectSchema } from '../schema';
import { Document } from 'mongoose';

export interface IMediaMetadata extends Document {
  etag?:string;
  size?:number;
  width?:number;
  height?:number;
  pages?:number;
  duration?:number;
  layers?:number;
  parsed?:boolean;
  audiocodec?:string;
  videocodec?:string;
  'font-family'?:string;
  'font-weight'?:number;
}

export const fields = {
  etag:           { type: String, description: 'ETag header' },
  size:           { type: Number, description: 'File size' },
  width:          { type: Number, description: 'Original width in pixels' },
  height:         { type: Number, description: 'Original height in pixels' },
  pages:          { type: Number, description: 'Total number of pages' },
  duration:       { type: Number, description: 'Total duration in seconds' },
  layers:         { type: Number, description: 'Total number of layers' },
  parsed:         { type: Boolean, description: 'File has been successfully parsed' },
  'font-family':  { type: String, description: 'Font family' },
  'font-weight':  { type: Number, description: 'Font weight' },
  'audiocodec':   { type: String, description: 'Audio codec used' },
  'videocodec':   { type: String, description: 'Video codec used' },
};

export const schema = generateObjectSchema<IMediaMetadata>('MediaMeta', fields);

export default schema;
