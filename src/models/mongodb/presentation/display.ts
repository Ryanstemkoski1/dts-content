import config from '../../../config';
import { ISubDocument, generateSubDocumentSchema } from '../schema';

export interface IPresentationDisplay extends ISubDocument {
  name?:string;
  x:number;
  y:number;
  width:number;
  height:number;
  video_width?:number;
  video_height?:number;
  scale:number;
  rotate:number;
  diagonal?:number;
  bezel_side?:number;
  bezel_top?:number;
  bezel_bottom?:number;
}

export const schema = generateSubDocumentSchema<IPresentationDisplay>('PresentationDisplay', {
  name: {
    type: String,
    required: false,
    description: 'Display name.',
  },
  model: {
    type: String,
    required: false,
    description: 'Display model name.',
  },
  x: {
    type: Number,
    required: true,
    description: 'X position.',
  },
  y: {
    type: Number,
    required: true,
    description: 'Y position.',
  },
  width: {
    type: Number,
    required: true,
    min: config.recording.min_display_width,
    max: config.recording.max_display_width,
    description: 'Width in pixels.',
  },
  height: {
    type: Number,
    required: true,
    min: config.recording.min_display_height,
    max: config.recording.max_display_height,
    description: 'Height in pixels.',
  },
  video_width: {
    type: Number,
    required: false,
    min: config.recording.min_display_width,
    max: config.recording.max_display_width,
    description: 'Recording width in pixels.',
  },
  video_height: {
    type: Number,
    required: false,
    min: config.recording.min_display_height,
    max: config.recording.max_display_height,
    description: 'Recording height in pixels.',
  },
  scale: {
    type: Number,
    required: true,
    default: 1.0,
    min: 0.1,
    max: 2.0,
    description: 'Zoom amount.',
  },
  rotate: {
    type: Number,
    required: true,
    default: 0,
    min: -360,
    max: 360,
    description: 'Rotation in degrees.',
  },
  diagonal: {
    type: Number,
    required: false,
    min: 0,
    max: 300,
    description: 'Diagonal size in inches.',
  },
  bezel_side: {
    type: Number,
    required: false,
    min: 0,
    max: 30,
    description: 'Side bezels size in inches.',
  },
  bezel_top: {
    type: Number,
    required: false,
    min: 0,
    max: 30,
    description: 'Top bezel size in inches.',
  },
  bezel_bottom: {
    type: Number,
    required: false,
    min: 0,
    max: 30,
    description: 'Bottom bezel size in inches.',
  },
});

export default schema;
