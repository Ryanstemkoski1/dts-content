import { generateObjectSchema } from '../schema';
import { Document, Schema } from 'mongoose';

export interface IMenuItemModifierOverride extends Document {
  modifier:string;
  item:string;
  parent?:string;
  is_default?:boolean;
  hidden?:boolean;
  links?:string[];
}

export const schema = generateObjectSchema<IMenuItemModifierOverride>('MenuItemModifierOverride', {
  modifier: {
    type: Schema.Types.ObjectId,
    required: true,
    description: 'Modifier group ID.',
  },
  item: {
    type: Schema.Types.ObjectId,
    required: true,
    description: 'Modifier item ID.',
  },
  parent: {
    type: Schema.Types.ObjectId,
    description: 'Parent (linked) modifier item ID.',
  },
  is_default: {
    type: Schema.Types.Boolean,
    description: 'Override modifier item as selected by default.',
  },
  hidden: {
    type: Schema.Types.Boolean,
    description: 'Override modifier item as hidden.',
  },
  links: {
    type: [Schema.Types.ObjectId],
    description: 'Override linked modifier group IDs.',
  },
});

export default schema;
