import { validateUuid, generateObjectSchema } from "../../schema";

export const schema = generateObjectSchema('PresentationElementTrivia', {
  game_location:   {
    type: String,
    required: true,
    validate: validateUuid(),
  },
});

export default schema;
