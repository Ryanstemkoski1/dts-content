import Animation from "../animation";
import Style, { IPresentationElementStyle } from "./style";
import { generateObjectSchema, enumField } from "../../schema";

import { Document } from 'mongoose';

export interface ISocialElement extends Document {
  header?:IPresentationElementStyle;
  body?:IPresentationElementStyle;
}

export enum EPresentationSocialMode {
  Pan = 'pan',
  Single = 'single',
}

export const schema = generateObjectSchema('PresentationElementSocial', {
  animations:   [Animation],
  feed:         [String],
  mode:         enumField(EPresentationSocialMode, true),
  header:       Style,
  body:         Style,
  delay:        { type: Number, required: false },
});

export default schema;
