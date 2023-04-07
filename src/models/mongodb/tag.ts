import { IDocument, generateDocumentSchema } from './schema';
import { EEntityType } from '../../domain/service';

export interface ITag extends IDocument {
  name:string;
}

export const schema = generateDocumentSchema<ITag>(EEntityType.Tag, {
  name: { type: String, trim: true, required: true, description: 'Name' },
}, {
  id: 'uuid',
});

export default schema;
