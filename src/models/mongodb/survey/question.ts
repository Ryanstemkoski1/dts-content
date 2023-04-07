import { ISubDocument, generateSubDocumentSchema, enumField, validateInteger } from '../schema';

export enum ESurveyQuestionType {
  Textfield = 'textfield',
  Textarea = 'textarea',
  Number = 'number',
  Checkbox = 'checkbox',
  Select = 'select',
  Radio = 'radio',
  Email = 'email',
  Phone = 'phone',
  Signature = 'signature',
  Popup = 'popup',
}

export interface ISurveyQuestion extends ISubDocument {
  position?:number;
  type:ESurveyQuestionType;
  title:string;
  text?:string;
  required?:boolean;
  min?:number;
  max?:number;
  required_values?:number[];
  step?:number;
  values?:string[];
}

export const schema = generateSubDocumentSchema<ISurveyQuestion>('SurveyQuestion', {
  position:   { type: Number, default: 0 },
  type:       enumField(ESurveyQuestionType),
  title:      { type: String, trim: true, required: true },
  text:       { type: String },
  required:   { type: Boolean },
  min:        { type: Number },
  max:        { type: Number },
  required_values:   { type: [Number] },
  step:       { type: Number },
  values:     { type: [String] },
});

export default schema;
