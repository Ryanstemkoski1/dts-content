import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './modifier.fixture';

fixtures.testCrud(EEntityType.Modifier, entity);
