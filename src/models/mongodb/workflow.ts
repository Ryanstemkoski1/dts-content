import {
  IDocument,
  generateDocumentSchema,
  generateObjectSchema,
  validateTokens,
  validateUuid,
  validateEnum,
} from './schema';
import { EEntityType } from '../../domain/service';

export enum EWorkflowHidMode {
  Optional = 'optional',
  Mandatory = 'mandatory',
}

export enum EWorkflowMaskMode {
  Optional = 'optional',
  Mandatory = 'mandatory',
}

export enum EWorkflowSurveyMode {
  Code = 'code',
  Screen = 'screen',
  CodeAndScreen = 'code_and_screen',
}

export interface IWorkflow extends IDocument {
  name:string;
  devices:string[];
  questionnaire?:{
    enabled:boolean;
    survey:string;
    mode?:EWorkflowSurveyMode;
  };
  hid?:{
    enabled:boolean;
    mode?:EWorkflowHidMode;
    display_name?:boolean;
  };
  recognition?:{
    enabled:boolean;
    alarm_stranger?:boolean;
  };
  mask?:{
    enabled:boolean;
    mode?:EWorkflowMaskMode;
    alarm_no_mask?:boolean;
  };
  temperature?:{
    enabled:boolean;
    display_result?:boolean;
    speak_result?:boolean;
    low_threshold?:number;
    high_threshold?:number;
    alarm_too_high?:boolean;
  };
  print?:{
    enabled:boolean;
  };
  door?:{
    enabled:boolean;
    duration?:number;
  };
}

export const schema = generateDocumentSchema<IWorkflow>(EEntityType.Workflow, {
  name: { type: String, trim: true, required: true, description: 'Name' },
  devices: {
    type: [String],
    validate: validateTokens,
    description: 'Device IDs',
  },
  questionnaire: generateObjectSchema('WorkflowQuestionnaire', {
    enabled: { type: Boolean, required: true },
    survey: {
      type: String,
      validate: validateUuid(true),
      description: 'SignJet form (survey) ID to display.',
    },
    mode: {
      type: String,
      validate: validateEnum(EWorkflowSurveyMode, true),
    },
  }),
  hid: generateObjectSchema('WorkflowHid', {
    enabled: { type: Boolean, required: true },
    mode: {
      type: String,
      validate: validateEnum(EWorkflowHidMode, true),
    },
    display_name: {
      type: Boolean,
      description: 'Display the employee\'s name.',
    },
  }),
  recognition: generateObjectSchema('WorkflowRecognition', {
    enabled: { type: Boolean, required: true },
    alarm_stranger: {
      type: Boolean,
      description: 'Send an alarm when the visitor is not recognized.',
    },
  }),
  mask: generateObjectSchema('WorkflowMask', {
    enabled: { type: Boolean, required: true },
    mode: {
      type: String,
      validate: validateEnum(EWorkflowMaskMode, true),
    },
    alarm_no_mask: {
      type: Boolean,
      description: 'Send an alarm when no mask detected.',
    },
  }),
  temperature: generateObjectSchema('WorkflowTemperature', {
    enabled: { type: Boolean, required: true },
    display_result: {
      type: Boolean,
      description: 'Display the temperature value.',
    },
    speak_result: {
      type: Boolean,
      description: 'Speak the temperature value.',
    },
    low_threshold: {
      type: Number,
      min: 0,
      max: 36.6,
      description: 'Miminum value that is considered to be not too cold.',
    },
    high_threshold: {
      type: Number,
      min: 36.6,
      max: 50,
      description: 'Miminum value that is considered to be a fever.',
    },
    alarm_too_high: {
      type: Boolean,
      description: 'Send an alarm when the temperature is too high.',
    },
  }),
  print: generateObjectSchema('WorkflowPrint', {
    enabled: { type: Boolean, required: true },
  }),
  door: generateObjectSchema('WorkflowDoor', {
    enabled: { type: Boolean, required: true },
    duration: {
      type: Number,
      min: 1,
      max: 60,
      description: 'Door open duration (seconds).',
    },
  }),
}, {
  id: 'uuid',
});

export default schema;
