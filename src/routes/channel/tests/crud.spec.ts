import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './channel.fixture';

fixtures.testCrud(EEntityType.Channel, entity);
