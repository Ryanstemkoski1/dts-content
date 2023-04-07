import * as uuid_validate from 'uuid-validate';

import { EUserRole } from '../../../domain/user';
import { ERequestMethod, EEntityType } from '../../../domain/service';

import model from '../../../models';
import { IEntry } from '../../../models/mongodb/entry';
import { IMenu } from '../../../models/mongodb/menu';
import { IMenuCategory } from '../../../models/mongodb/menu/category';
import { IMenuItem } from '../../../models/mongodb/menu/item';

import { testRequest, location, testFunc } from '../../../tests';

import { menu, menuitem, menucategory } from './menu.fixture';

import * as uuid from 'uuid';

testFunc(EEntityType.Menu)(`Generates order IDs for menu (POST).`, async (t) => {
  const mainorder = uuid.v4();
  const mainmodifier = model.mongo.generateObjectId().toHexString();

  const payload = {
    title: 'test',
    items: [
      {
        title: 'item',
        order: {
          price: 1,
        } as IEntry,
        order_main: {
          [mainmodifier]: {
            token: mainorder,
            price: 2,
            tax: 0.5,
          } as IEntry,
        } as IMenuItem['order_main'],
      } as IMenuItem,
    ],
  } as IMenu;

  const response = await testRequest<IMenu>({
    payload,
    method: ERequestMethod.Post,
    role: EUserRole.Manager,
    url: `/${EEntityType.Menu}`,
  });

  t.is(response.statusCode, 200, 'statusCode');

  const result = response.result as IMenu;
  const [item] = result.items;
  const order = item.order_main[mainmodifier];

  await model.db.Menu.findByIdAndRemove(result.token);

  t.truthy(result.token, 'token');

  t.truthy(item.order!.token, 'item.order.token');
  t.is(item.order!.price, payload.items[0].order.price, 'item.order.price');
  t.is(item.order!.tax, 0, 'item.order.price');

  t.truthy(order, 'item.order_main');
  t.truthy(order.token, 'item.order_main.token');
  t.not(order.token, mainorder, 'item.order_main.token');
  t.truthy(uuid_validate(order.token), 'item.order_main.token');
  t.is(order.price, payload.items[0].order_main[mainmodifier].price, 'item.order_main.price');
  t.is(order.tax, payload.items[0].order_main[mainmodifier].tax, 'item.order_main.tax');
});

testFunc(EEntityType.Menu)(`Generates order IDs for menu (PUT).`, async (t) => {
  const entity = new model.db.Menu({
    ...menu,
    location,
  });
  await entity.save();

  try {
    const mainorder = uuid.v4();
    const mainmodifier = model.mongo.generateObjectId().toHexString();

    const payload = entity.toJSON() as IMenu;
    payload.items[0].order.price = Math.round(Math.random() * 100) / 100;
    payload.items.push({
      title: 'item',
      order: {
        price: 1,
      } as IEntry,
      order_main: {
        [mainmodifier]: {
          token: mainorder,
          price: 2,
          tax: 0.5,
        } as IEntry,
      } as IMenuItem['order_main'],
    } as IMenuItem);
    const i = payload.items.length - 1;

    const response = await testRequest<IMenu>({
      payload,
      method: ERequestMethod.Put,
      role: EUserRole.Manager,
      url: `/${EEntityType.Menu}/${payload.token}`,
    });

    t.is(response.statusCode, 200, 'statusCode');

    const result = response.result as IMenu;
    const item0 = result.items[0];
    const item1 = result.items[1];
    const itemI = result.items[i];
    const orderI = itemI.order_main[mainmodifier];

    t.truthy(result.token, 'token');

    t.truthy(itemI.order!.token, 'item.order.token');
    t.truthy(uuid_validate(itemI.order!.token), 'item.order.token');
    t.is(itemI.order!.price, payload.items[i].order.price, 'item.order.price');
    t.is(itemI.order!.tax, 0, 'item.order.price');

    t.truthy(orderI, 'item[i].order_main');
    t.truthy(orderI.token, 'item[i].order_main.token');
    t.truthy(uuid_validate(orderI.token), 'item[i].order_main.token');
    t.not(orderI.token, mainorder, 'item[i].order_main.token');
    t.is(orderI.price, payload.items[i].order_main[mainmodifier].price, 'item[i].order_main.price');
    t.is(orderI.tax, payload.items[i].order_main[mainmodifier].tax, 'item[i].order_main.tax');

    t.not(item0.order.token, payload.items[0].order.token, 'item[0].order.token');
    t.truthy(uuid_validate(item0.order.token), 'item[0].order.token');
    t.is(item0.order.price, payload.items[0].order.price, 'item[0].order.price');
    t.is(item1.order.token, payload.items[1].order.token, 'item[1].order.token');
    t.is(item1.order.price, payload.items[1].order.price, 'item[1].order.price');
  } finally {
    await entity.remove();
  }
});

[
  ERequestMethod.Put,
  // ERequestMethod.Patch,
].forEach((method) => {
  testFunc(EEntityType.Menu)(`Maintains list IDs for menu (${method}).`, async (t) => {
    const entity = new model.db.Menu({
      ...menu,
      location,
    });
    await entity.save();

    try {
      const payload = entity.toJSON() as IMenu;

      const {
        categories: [category1],
        items: [item1],
      } = entity;

      const category2 = { ...menucategory } as IMenuCategory;
      delete category2.token;
      payload.categories.push(category2);

      const item2 = { ...menuitem } as IMenuItem;
      delete item2.token;
      payload.items.push(item2);

      payload.schedule = null;

      const response = await testRequest<IMenu>({
        payload,
        method,
        role: EUserRole.Manager,
        url: `/${EEntityType.Menu}/${payload.token}`,
      });

      if (method === ERequestMethod.Patch) {
        t.is(response.statusCode, 204, 'statusCode');
      } else {
        t.is(response.statusCode, 200, 'statusCode');
      }

      let result = response.result as IMenu;

      if (method === ERequestMethod.Patch) {
        result = await model.db.Menu.findById(payload.token).then(x => x.toJSON() as any);
      }

      const {
        categories: [
          newcategory1,
          newcategory2,
        ],
        items: [
          newitem1,
          newitem2,
        ],
      } = result;

      t.is(newitem1.token, item1.token, 'items[0].token');
      t.truthy(newitem2.token, 'items[1].token');
      t.is(newcategory1.token, category1.token, 'categories[0].token');
      t.truthy(newcategory2.token, 'categories[1].token');
      t.is(result.schedule, undefined, 'schedule');
    } finally {
      await entity.remove();
    }
  });
});
