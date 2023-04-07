import * as uuid_validate from 'uuid-validate';

import { EUserRole } from '../../../domain/user';
import { ERequestMethod, EEntityType } from '../../../domain/service';

import model from '../../../models';
import { IMenu } from '../../../models/mongodb/menu';
import { IMenuItem } from '../../../models/mongodb/menu/item';

import { testRequest, location, testFunc } from '../../../tests';

import { menu, menuitem } from './menu.fixture';

testFunc(EEntityType.Menu)(`Maintains list IDs for menu item (POST).`, async (t) => {
  const entity = new model.db.Menu({
    ...menu,
    location,
  });
  await entity.save();

  try {
    const {
      items: [item1],
    } = entity.toJSON() as IMenu;

    const item2 = { ...menuitem } as IMenuItem;

    const response = await testRequest<IMenuItem>({
      payload: item2,
      method: ERequestMethod.Post,
      role: EUserRole.Manager,
      url: `/${EEntityType.Menu}/${entity.token}/item`,
    });

    const newitem2 = response.result;

    const {
      items: [
        newitem1,
      ],
    } = await model.db.Menu.findById(entity.token).then(x => x.toJSON()) as IMenu;

    t.is(response.statusCode, 200, 'statusCode');

    t.truthy(newitem2.token, 'token');
    // t.not(newitem2.token, item2.token, 'token');
    t.is(newitem1.token, item1.token, 'items[0].token');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Menu)(`Maintains list IDs for menu item (PUT).`, async (t) => {
  const entity = new model.db.Menu({
    ...menu,
    location,
  });
  await entity.save();

  try {
    const {
      items: [item1],
    } = entity.toJSON() as IMenu;

    const payload = {
      ...item1,
      order: { ...item1.order },
    } as IMenuItem;
    payload.order.price += 1;

    const response = await testRequest<IMenuItem>({
      payload,
      method: ERequestMethod.Put,
      role: EUserRole.Manager,
      url: `/${EEntityType.Menu}/${entity.token}/item/${item1.token}`,
    });

    const newitem1 = response.result;

    const newentity = await model.db.Menu.findById(entity.token).then(x => x.toJSON()) as IMenu;

    t.is(response.statusCode, 200, 'statusCode');

    t.is(newitem1.token, item1.token, 'token');
    t.is(newentity.items.length, entity.items.length, 'length');
    t.not(newitem1.order.price, item1.order.price, 'order.price');
    t.not(newitem1.order.token, item1.order.token, 'order.token');
    t.truthy(uuid_validate(newitem1.order.token), 'order.token');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Menu)(`Deletes a menu item.`, async (t) => {
  const entity = new model.db.Menu({
    ...menu,
    location,
  });
  await entity.save();

  try {
    const {
      items: [item1, item2],
    } = entity.toJSON() as IMenu;

    const response = await testRequest<IMenuItem>({
      method: ERequestMethod.Delete,
      role: EUserRole.Manager,
      url: `/${EEntityType.Menu}/${entity.token}/item/${item1.token}`,
    });

    const newentity = await model.db.Menu.findById(entity.token).then(x => x.toJSON()) as IMenu;

    t.is(response.statusCode, 204, 'statusCode');

    t.is(newentity.items.length, entity.items.length - 1, 'length');
    t.is(newentity.items[0].token, item2.token, 'token');
  } finally {
    await entity.remove();
  }
});
