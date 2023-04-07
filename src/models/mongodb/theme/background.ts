import File, { IFile } from '../file';
import { generateSubDocumentSchema, ISubDocument } from '../schema';

export interface IThemeBackground extends ISubDocument {
  position?:number;
  media?:IFile;
  media_portrait?:IFile;
}

export const schema = generateSubDocumentSchema<IThemeBackground>('ThemeBackground', {
  position:             { type: Number, default: 0 },
  media:                { type: File },
  media_portrait:       { type: File },
});

export default schema;
