import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './menu.fixture';

fixtures.testCrud(EEntityType.Menu, entity);
