import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './survey.fixture';

fixtures.testCrud(EEntityType.Survey, entity);
