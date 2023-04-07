import { ISubDocument, generateSubDocumentSchema } from '../schema';

import { Schema } from 'mongoose';

export interface IPresentationCombination extends ISubDocument {
  display?:string;
  elements?:boolean[];
  combinations?:string[];
}

const schema = generateSubDocumentSchema<IPresentationCombination>('PresentationCombination', {
  display: {
    type: Schema.Types.ObjectId,
    required: false,
    description: 'Display ID',
  },
  elements: {
    type: [Boolean],
    required: false,
    description: 'Slide elements visibility',
  },
  combinations: {
    type: [String],
    required: false,
    description: 'Child combinations',
  },
}, {
  id: 'md5',
});

export default schema;
