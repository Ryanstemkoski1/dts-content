import { IDocument, generateDocumentSchema } from '../schema';
import { Schema } from 'mongoose';

import Banner, { ICampaignBanner } from './banner';
import Schedule, { ISchedule } from '../schedule';
import { EEntityType } from '../../../domain/service';

export interface ICampaign extends IDocument {
  parent?:string;
  title:string;
  banners:ICampaignBanner[];
  schedule?:ISchedule;
}

export const schema = generateDocumentSchema<ICampaign>(EEntityType.Campaign, {
  parent:     { type: Schema.Types.ObjectId, ref: EEntityType.Campaign, index: true },
  title:      { type: String, trim: true, required: true },
  banners:    { type: [Banner], required: true },
  schedule:   { type: Schedule },
});

export default schema;
