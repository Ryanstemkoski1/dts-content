import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './campaign.fixture';

fixtures.testCrud(EEntityType.Campaign, entity);
