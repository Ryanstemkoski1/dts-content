import Column, { IDatabaseColumn } from './column';
import { IDocument, generateDocumentSchema } from '../schema';
import { EEntityType } from '../../../domain/service';

import { Schema } from 'mongoose';

export interface IDatabase extends IDocument {
  title:string;
  columns:IDatabaseColumn[];
  rows:any[];
}

export const schema = generateDocumentSchema<IDatabase>(EEntityType.Database, {
  title: { type: String, trim: true, required: true },
  columns: { type: [Column], required: true },
  rows: { type: [Schema.Types.Mixed] },
}, {
  minimal: [
    'title',
  ],
});

export default schema;
