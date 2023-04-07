import { generateSubDocumentSchema, ISubDocument } from "../schema";

export interface IPresentationTransition extends ISubDocument {
  duration:number;
  delay:number;
}

export const schema = generateSubDocumentSchema<IPresentationTransition>('PresentationTransition', {
  duration:  { type: Number, required: true, default: 0.5 },
  delay:  { type: Number, required: true, default: 0 },
});

export default schema;
