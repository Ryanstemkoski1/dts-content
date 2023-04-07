import { validateMime, generateObjectSchema, generateSubDocumentSchema, ISubDocument } from "../schema";
import { IMediaMetadata, fields } from '../media/meta';

export enum EPresentationAnimationTrigger {
  Opened = 'opened',
  Closed = 'closed',
  Clicked = 'clicked',
  Effect = 'effect',
}

export interface IPresentationAsset extends ISubDocument {
  mime:string;
  meta:IMediaMetadata;
}

export const meta = generateObjectSchema<IMediaMetadata>('PresentationAssetMeta', fields);

export const schema = generateSubDocumentSchema<IPresentationAsset>('PresentationAsset', {
  mime: {
    type: String,
    validate: validateMime,
    required: true,
  },
  meta: { type: meta },
}, {
  id: 'uuid',
});

export default schema;
