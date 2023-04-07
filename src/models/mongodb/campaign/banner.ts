import { ISubDocument, generateSubDocumentSchema, enumField } from '../schema';

import Destination, { IDestination } from '../destination';
import File, { IFile } from '../file';

export enum ECampaignBannerSlot {
  Main = 'main',
  Misc = 'misc',
}

export interface ICampaignBanner extends ISubDocument {
  media:IFile;
  destination?:IDestination;
  url?:string;
  slot:ECampaignBannerSlot;
}

export const schema = generateSubDocumentSchema<ICampaignBanner>('CampaignBanner', {
  media:      { type: File, required: true },
  destination:   { type: Destination },
  url:   { type: String },
  slot:         enumField(ECampaignBannerSlot),
});

export default schema;
