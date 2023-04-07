import { generateSubDocumentSchema, ISubDocument, enumField } from '../schema';

export interface IMediaWorker extends ISubDocument {
  status:EMediaWorkerStatus;
  started:Date;
  ended?:Date;
  error?:string;
}

export enum EMediaWorkerStatus {
  Processing = 'processing',
  Ready = 'ready',
  Error = 'error',
}

export const schema = generateSubDocumentSchema<IMediaWorker>('MediaWorker', {
  status: enumField(EMediaWorkerStatus, true, EMediaWorkerStatus.Processing),
  started: {
    type: Date,
    default: Date.now,
  },
  ended: {
    type: Date,
  },
  error: {
    type: String,
  },
}, {
  id: 'string',
});

export default schema;
