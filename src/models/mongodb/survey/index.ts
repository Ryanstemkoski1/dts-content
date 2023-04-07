import Question, { ISurveyQuestion } from './question';
import { IDocument, generateDocumentSchema } from '../schema';
import { EEntityType } from '../../../domain/service';

export interface ISurvey extends IDocument {
  title:string;
  questions:ISurveyQuestion[];
  emails?:string;
}

export const schema = generateDocumentSchema<ISurvey>(EEntityType.Survey, {
  title:      { type: String, trim: true, required: true },
  questions:  { type: [Question] },
  emails:     { type: [String] },
}, {
  id: 'uuid',
});

export default schema;
