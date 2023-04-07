import { IDocument, generateDocumentSchema } from './schema';
import { EEntityType } from '../../domain/service';

export interface ISeat extends IDocument {
  name:string;
  pos_id?:string;
}

export const schema = generateDocumentSchema<ISeat>(EEntityType.Seat, {
  name:       { type: String, trim: true, required: true },
  pos_id:     { type: String },
}, {
  id: 'uuid',
});

export default schema;
