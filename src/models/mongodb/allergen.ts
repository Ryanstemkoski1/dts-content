import { IDocument, generateDocumentSchema } from './schema';
import File, { IFile } from './file';
import { EEntityType } from '../../domain/service';

export interface IAllergen extends IDocument {
  title:string;
  image?:IFile;
}

export const schema = generateDocumentSchema<IAllergen>(EEntityType.Allergen, {
  title:      { type: String, trim: true, required: true },
  image:      { type: File },
});

export default schema;
