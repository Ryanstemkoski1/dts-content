import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './allergen.fixture';

fixtures.testCrud(EEntityType.Allergen, entity);
