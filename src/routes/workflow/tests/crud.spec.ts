import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './workflow.fixture';

fixtures.testCrud(EEntityType.Workflow, entity);
