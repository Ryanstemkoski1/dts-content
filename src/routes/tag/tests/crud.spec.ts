import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './tag.fixture';

fixtures.testCrud(EEntityType.Tag, entity);
