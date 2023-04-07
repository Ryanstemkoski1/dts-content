import { ISubDocument, generateSubDocumentSchema } from '../schema';
import Animation from '../presentation/animation';
import Element, { IPresentationElement } from '../presentation/element';

export interface ITemplateSlide extends ISubDocument {
  delay?:number;
  loop?:boolean;
  rewind?:boolean;
  hidden?:boolean;
  name?:string;
  elements:IPresentationElement[];
  animations:any[];
}

export const schema = generateSubDocumentSchema<ITemplateSlide>('TemplateSlide', {
  delay:          { type: Number, min: 3 },
  loop:           { type: Boolean },
  rewind:         { type: Boolean },
  hidden:         { type: Boolean },
  name:           { type: String, trim: true },
  elements:       { type: [Element] },
  animations:     { type: [Animation] },
});

export default schema;
