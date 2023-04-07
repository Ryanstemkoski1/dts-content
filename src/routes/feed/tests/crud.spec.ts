import * as fixtures from '../../../tests';
import { EEntityType } from '../../../domain/service';

import entity from './feed.fixture';

fixtures.testCrudCreate(EEntityType.Feed, entity);
fixtures.testCrudDelete(EEntityType.Feed, entity);
fixtures.testCrudList(EEntityType.Feed, entity);
fixtures.testCrudRead(EEntityType.Feed, entity);
