import { generateObjectSchema } from "../schema";

import { Schema } from 'mongoose';

export interface IPresentationHref {
  slide:string;
  params?:any;
}

export const schemaFilter = (value:IPresentationHref):boolean => {
  if (!value.slide) {
    return false;
  }

  return true;
};

export const schema = generateObjectSchema('PresentationHref', {
  slide:  {
    type: Schema.Types.ObjectId,
    required: true,
  },
  params:  {
    type: Schema.Types.Mixed,
    get: (value) => {
      if (!value) {
        return null;
      }

      if (typeof value !== 'object') {
        return null;
      }

      return value;
    },
  },
});

export default schema;
