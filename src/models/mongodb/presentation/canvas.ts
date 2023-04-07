import { Document } from 'mongoose';

import config from '../../../config';
import PresentationGuideline, { IPresentationGuideline } from './guideline';
import { generateObjectSchema, enumField } from '../schema';

export interface IPresentationCanvas extends Document {
  wizard?:EPresentationWizard;
  orientation?:EPresentationOrientation;
  width:number;
  height:number;
  fullscreen?:boolean;
  display_width:number;
  display_height:number;
  ratio?:number;
  diagonal?:number;
  'background-color'?:string;
  grid?:IPresentationGuideline[];
  modified:string;
  output_width?:number;
  output_height?:number;
  player_type?:EPresentationPlayerType;
}

export enum EPresentationWizard {
  Quick = 'quick',
  Wall = 'wall',
}

export enum EPresentationOrientation {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

export enum EPresentationPlayerType {
  Internal = 'internal',
  External = 'external',
  Multiple = 'multiple',
}

export const schema = generateObjectSchema<IPresentationCanvas>('PresentationCanvas', {
  wizard: enumField(EPresentationWizard, true),
  orientation: enumField(EPresentationOrientation, true, EPresentationOrientation.Landscape),
  width: {
    type: Number,
    required: true,
    max: config.recording.max_displays,
    description: 'Number of displays by horizontal.',
  },
  height: {
    type: Number,
    required: true,
    max: config.recording.max_displays,
    description: 'Number of displays by vertical.',
  },
  display_width: {
    type: Number,
    required: true,
    default: 1920,
    min: config.recording.min_display_width,
    max: config.recording.max_canvas_width,
    description: 'Each display resolution by horizontal.',
  },
  display_height: {
    type: Number,
    required: true,
    default: 1080,
    min: config.recording.min_display_height,
    max: config.recording.max_canvas_height,
    description: 'Each display resolution by vertical.',
  },
  fullscreen: {
    type: Boolean,
    description: 'Scale the campaign to fullscreen.',
  },
  ratio: {
    type: Number,
    description: 'Deprecated. Display ratio.',
  },
  diagonal: {
    type: Number,
    description: 'Each display diagonal in inches.',
  },
  'background-color': {
    type: String,
    description: 'Background color in a hexademical format.',
  },
  grid: {
    type: [PresentationGuideline],
    description: 'Canvas guidelines.',
  },
  modified: {
    type: Date,
    default: Date.now,
    description: 'Canvas properties modification date.',
  },
  output_width: {
    type: Number,
    min: config.recording.min_display_width,
    max: config.recording.max_output_width,
    description: 'Recording video resolution by horizontal.',
  },
  output_height: {
    type: Number,
    min: config.recording.min_display_height,
    max: config.recording.max_output_height,
    description: 'Recording video resolution by vertical.',
  },
  player_type: enumField(EPresentationPlayerType, true),
});

export default schema;
