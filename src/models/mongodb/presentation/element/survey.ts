import { validateUuid, generateObjectSchema } from "../../schema";

export const schema = generateObjectSchema('PresentationElementSurvey', {
  token: {
    type: String,
    required: true,
    validate: validateUuid(),
  },
});

export default schema;
