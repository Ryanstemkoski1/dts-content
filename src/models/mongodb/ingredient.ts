import { IDocument, generateDocumentSchema } from './schema';
import { EEntityType } from '../../domain/service';

export interface IIngredient extends IDocument {
  title:string;
  unit:string;
  package?:string;
  price?:number;
  quantity?:number;
}

export const schema = generateDocumentSchema<IIngredient>(EEntityType.Ingredient, {
  title:      { type: String, trim: true, required: true },
  unit:       { type: String, trim: true, required: false },
  package:    { type: String, trim: true, required: false },
  price:      { type: Number, required: false },
  quantity:   { type: Number, required: false },
});

export default schema;
