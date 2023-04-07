import { ISubDocument, generateSubDocumentSchema } from '../schema';
import TemplateDataSource, { ITemplateDataSource, schemaFilter } from './source';

export interface ITemplateData extends ISubDocument {
  sources:ITemplateDataSource[];
}

export const schema = generateSubDocumentSchema<ITemplateData>('TemplateData', {
  sources: {
    type: [TemplateDataSource],
    description: 'Template values',
    get: (values:ITemplateDataSource[]) => {
      return (values || []).filter(schemaFilter);
    },
  },
});

export default schema;
