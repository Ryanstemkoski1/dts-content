import { generateObjectSchema, enumField, enumNumberField } from "../../schema";

import { Document } from 'mongoose';

import Binding, { IPresentationBinding, schemaFilter as bindingSchemaFilter } from '../binding';

export enum EPresentationHtmlDirection {
  Ltr = 'ltr',
  Rtl = 'rtl',
  Ttb = 'ttb',
  Btt = 'btt',
}

export enum EPresentationHtmlVersion {
  V1 = 1,
  V2 = 2,
}

export enum EPresentationHtmlMarquee {
  Default = 'default',
  Slideshow = 'slideshow',
}

export interface IPresentationHtml extends Document {
  text?:string;
  texts?:string[];
  delay?:number;
  delays?:number[];
  bindings?:IPresentationBinding[];
  direction?:EPresentationHtmlDirection;
  version?:EPresentationHtmlVersion;
  marquee?:EPresentationHtmlMarquee;
}

export const schema = generateObjectSchema<IPresentationHtml>('PresentationElementHtml', {
  text:         { type: String },
  texts:         { type: [String] },
  direction:    enumField(EPresentationHtmlDirection, true),
  delay:        { type: Number },
  delays:        { type: [Number] },
  bindings:     {
    type: [Binding],
    get: (values:IPresentationBinding[]) => {
      return (values || []).filter(bindingSchemaFilter);
    },
  },
  version:      enumNumberField(EPresentationHtmlVersion, true, EPresentationHtmlVersion.V2, Number),
  marquee:      enumField(EPresentationHtmlMarquee, true, EPresentationHtmlMarquee.Default),
});

export default schema;
