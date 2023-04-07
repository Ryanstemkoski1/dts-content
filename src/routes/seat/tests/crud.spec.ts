import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './seat.fixture';

fixtures.testCrud(EEntityType.Seat, entity);
