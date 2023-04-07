import { generateObjectSchema, enumField } from "../../schema";

export enum EPresentationStyleStrokeType {
  Solid = 'solid',
  Dashed = 'dashed',
  Dotted = 'dotted',
}

export enum EPresentationStyleFontWeight {
  Bold = 'bold',
  Normal = 'normal',
}

export enum EPresentationStyleFontStyle {
  Italic = 'italic',
  Normal = 'normal',
}

export enum EPresentationStyleTextAlign {
  Left = 'left',
  Center = 'center',
  Right = 'right',
}

export enum EPresentationStyleWhiteSpace {
  Normal = 'normal',
  Nowrap = 'nowrap',
}

export interface IPresentationElementStyle {
  'background-color'?:string;
  'border-color'?:string;
  'border-radius'?:number;
  'border-width'?:number;
  'stroke-style'?:EPresentationStyleStrokeType;
  'stroke-width'?:number;
  'stroke-color'?:string;
  'color'?:string;
  'font-family'?:string;
  'font-size'?:number;
  'font-weight'?:EPresentationStyleFontWeight;
  'font-style'?:EPresentationStyleFontStyle;
  'text-align'?:EPresentationStyleTextAlign;
  'opacity'?:number;
  'padding'?:number;
  'white-space'?:EPresentationStyleWhiteSpace;
}

export const schema = generateObjectSchema('PresentationElementStyle', {
  'background-color':  { type: String },
  'border-color':      { type: String },
  'border-radius':     { type: Number },
  'border-width':      { type: Number },
  'stroke-style':      enumField(EPresentationStyleStrokeType, true),
  'stroke-width':      { type: Number },
  'stroke-color':      { type: String },
  'color':             { type: String },
  'font-family':       { type: String },
  'font-size':         { type: Number },
  'font-weight':       enumField(EPresentationStyleFontWeight, true),
  'font-style':        enumField(EPresentationStyleFontStyle, true),
  'text-align':        enumField(EPresentationStyleTextAlign, true),
  'opacity':           { type: Number },
  'padding':           { type: Number },
  'white-space':        enumField(EPresentationStyleWhiteSpace, true),
});

export default schema;
