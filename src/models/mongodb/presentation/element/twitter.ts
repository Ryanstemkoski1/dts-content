import { generateObjectSchema } from "../../schema";

export const schema = generateObjectSchema('PresentationElementTwitter', {
  username:  { type: String, required: true },
});

export default schema;
