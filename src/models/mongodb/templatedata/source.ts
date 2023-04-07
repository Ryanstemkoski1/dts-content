import { ISubDocument, generateSubDocumentSchema } from '../schema';
import TemplateDataItem, { ITemplateDataItem } from './item';
import TemplateDataTheme, { ITemplateDataTheme } from './theme';

import { Schema } from 'mongoose';

export interface ITemplateDataSource extends ISubDocument {
  slide:string;
  current_theme?:string;
  themes?:ITemplateDataTheme[];
  items:ITemplateDataItem[];
}

export const schemaFilter = (value:ITemplateDataSource):boolean => {
  if (!value.slide || !value.items) {
    return false;
  }

  return true;
};

export const schema = generateSubDocumentSchema<ITemplateDataSource>('TemplateDataSource', {
  slide: {
    type: Schema.Types.ObjectId,
    required: true,
    description: 'Related presentation slide ID',
  },
  current_theme: {
    type: Schema.Types.ObjectId,
    required: false,
    description: 'Selected theme ID',
  },
  themes: {
    type: [TemplateDataTheme],
    required: false,
    description: 'Color themes',
  },
  items: {
    type: [TemplateDataItem],
    required: true,
    description: 'Template fields',
  },
});

export default schema;
