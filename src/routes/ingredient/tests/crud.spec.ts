import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './ingredient.fixture';

fixtures.testCrud(EEntityType.Ingredient, entity);
