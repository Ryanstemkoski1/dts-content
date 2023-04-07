import { generateObjectSchema } from "../../schema";

export const schema = generateObjectSchema('PresentationElementLayout', {
  left:  { type: Number, required: true, default: 0, get: v => v || 0 },
  right:  { type: Number, required: true, default: 0, get: v => v || 0 },
  top:  { type: Number, required: true, default: 0, get: v => v || 0 },
  bottom:  { type: Number, required: true, default: 0, get: v => v || 0 },
});

export default schema;
