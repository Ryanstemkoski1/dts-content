import Animation, { IPresentationAnimation } from '../animation';
import File, { IFile } from '../../file';
import { generateObjectSchema, enumField } from "../../schema";
import Html, { IPresentationHtml } from './html';

import { Document, Schema } from 'mongoose';

export enum EPresentationContainerDirection {
  Ltr = 'ltr',
  Rtl = 'rtl',
  Ttb = 'ttb',
  Btt = 'btt',
}

export enum EPresentationContainerLayout {
  Stretch = 'stretch',
  Fit = 'fit',
}

export interface IPresentationContainer extends Document {
  medias?:IFile[];
  htmls?:IPresentationHtml[];
  animations?:IPresentationAnimation[];
  delay:number;
  delays?:(number|null)[];
  direction?:EPresentationContainerDirection;
  layout?:EPresentationContainerLayout;
}

export const schema = generateObjectSchema<IPresentationContainer>('PresentationContainer', {
  medias:       { type: [File] },
  htmls:         { type: [Html] },
  animations:   { type: [Animation] },
  delay:        { type: Number, required: true, min: 1 },
  delays:       {
    type: Schema.Types.Array,
    validate: {
      validator: (v:any[]) => {
        return !v || v.find(x => !(x >= 0 || x === null) || (x !== null && (typeof x !== 'number' || x % 1 > 0 )));
      },
    },
  },
  manual:       { type: Boolean },
  controls:     { type: Boolean },
  crossfade:    { type: Boolean },
  direction:    enumField(EPresentationContainerDirection, true),
  count:        { type: Number },
  layout:       enumField(EPresentationContainerLayout, true),
});

export default schema;
