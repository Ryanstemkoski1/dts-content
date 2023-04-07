import Background from './background';
import Elements from './elements';
import Options from './options';
import { IDocument, generateDocumentSchema, enumField } from '../schema';
import { EEntityType } from '../../../domain/service';

import { Schema } from 'mongoose';

export interface ITheme extends IDocument {
  parent?:string;
  title:string;
  type?:EThemeType;
}

export enum EThemeType {
  Galaxies = 'galaxies',
  Drivethrough = 'drivethrough',
  Freosk = 'freosk',
}

export const schema = generateDocumentSchema<ITheme>(EEntityType.Theme, {
  parent:           { type: Schema.Types.ObjectId, ref: 'Theme', index: true },
  title:            { type: String, trim: true, required: true },
  type:             enumField(EThemeType, true),
  backgrounds:      { type: [Background] },
  screensavers:     { type: [Background] },
  elements:         { type: Elements },
  options:          { type: Options },
}, {}, [
  {
    field: 'parent_theme',
    description: 'Parent theme',
    dependencies: ['parent'],
    type: EEntityType.Theme,
    method: async ({ db, select, parent }) => {
      return parent.parent ?
        await db.Theme.findById(parent.parent).select(select).exec() :
        undefined;
    },
  },
]);

export default schema;
