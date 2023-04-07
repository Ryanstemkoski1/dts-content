import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './theme.fixture';

fixtures.testCrud(EEntityType.Theme, entity);
