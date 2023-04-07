import { generateSubDocumentSchema, ISubDocument, enumField } from "../schema";

import { Schema } from 'mongoose';

export enum EPresentationAnimationTrigger {
  Opened = 'opened',
  Closed = 'closed',
  Clicked = 'clicked',
  Effect = 'effect',
}

export interface IPresentationAnimation extends ISubDocument {
  trigger?:EPresentationAnimationTrigger;
  effect:string;
  duration:number;
  delay:number;
  hidden?:boolean;
  options?:any;
}

export const schemaFilter = (value:IPresentationAnimation):boolean => {
  if (!value.effect) {
    return false;
  }

  return true;
};

export const schema = generateSubDocumentSchema<IPresentationAnimation>('PresentationAnimation', {
  trigger: enumField(EPresentationAnimationTrigger, true),
  effect: {
    type: String,
    required: true,
    default: 'fade-in',
    // validate: {
    //   validator: v => ['fade-in', 'fade-out'].indexOf(v) !== -1,
    //   message: '{VALUE} is not a valid trigger name!'
    // }
  },
  duration:   { type: Number, required: true, default: 1, min: 0.5 },
  delay:      { type: Number, required: true, default: 0, min: 0 },
  hidden:     { type: Boolean },
  options:    {
    type: Schema.Types.Mixed,
    get: (value) => {
      if (!value) {
        return null;
      }

      if (Array.isArray(value)) {
        return null;
      }

      return value;
    },
  },
});

export default schema;
