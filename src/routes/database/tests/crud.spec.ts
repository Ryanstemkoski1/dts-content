import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './database.fixture';

fixtures.testCrud(EEntityType.Database, entity);
