import { generateSubDocumentSchema, ISubDocument } from '../schema';
import File, { IFile } from '../file';

export interface IThemeElement extends ISubDocument {
  media?:IFile;
  title?:string;
  text?:string;
}

export const schema = generateSubDocumentSchema<IThemeElement>('ThemeElement', {
  media:      { type: File },
  title:      { type: String, trim: true },
  text:       { type: String, trim: true },
});

export default schema;
