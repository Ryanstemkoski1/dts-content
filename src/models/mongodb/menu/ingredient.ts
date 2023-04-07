import { ISubDocument, generateSubDocumentSchema } from '../schema';
import { Schema } from 'mongoose';

export interface IMenuItemIngredient extends ISubDocument {
  ingredient:string;
  amount:number;
}

export const schema = generateSubDocumentSchema<IMenuItemIngredient>('MenuIngredient', {
  ingredient: { type: Schema.Types.ObjectId, required: true },
  amount:     { type: Number, required: true },
});

export default schema;
