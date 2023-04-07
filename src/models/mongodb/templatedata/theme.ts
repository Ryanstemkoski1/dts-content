import { validateColor, ISubDocument, generateSubDocumentSchema } from '../schema';

export interface ITemplateDataTheme extends ISubDocument {
  title?:string;
  color?:string;
  position?:number;
}

export const schema = generateSubDocumentSchema<ITemplateDataTheme>('TemplateDataTheme', {
  title: {
    type: String,
    trim: true,
    required: false,
    description: 'Theme name',
  },
  color: {
    type: String,
    required: true,
    validate: validateColor(false),
    description: 'Theme color',
  },
  position: {
    type: Number,
    required: false,
    default: 0,
    description: 'Sort position',
  },
});

export default schema;
