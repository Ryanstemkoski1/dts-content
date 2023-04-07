import * as uuid_validate from 'uuid-validate';

import { EUserRole } from '../../../domain/user';
import { ERequestMethod, EEntityType } from '../../../domain/service';

import model from '../../../models';
import { IEntry } from '../../../models/mongodb/entry';
import { IModifier } from '../../../models/mongodb/modifier';
import { IModifierItem } from '../../../models/mongodb/modifier/item';

import { testRequest, location, testFunc } from '../../../tests';

import fixture from './modifier.fixture';

import * as uuid from 'uuid';

testFunc(EEntityType.Modifier)(`Generates order IDs for modifier (POST).`, async (t) => {
  const token = model.mongo.generateObjectId().toHexString();
  const ordertoken = uuid.v4();

  const payload = {
    ...fixture,
    token,
  } as IModifier;

  payload.items[0].order.token = ordertoken;

  const response = await testRequest<IModifier>({
    payload,
    method: ERequestMethod.Post,
    role: EUserRole.Manager,
    url: `/${EEntityType.Modifier}`,
  });

  t.is(response.statusCode, 200, 'statusCode');

  const result = response.result as IModifier;
  const [item] = result.items;
  const order = item.order;

  await model.db.Menu.findByIdAndRemove(result.token);

  t.truthy(result.token, 'token');

  t.truthy(item.order!.token, 'item.order.token');
  t.is(item.order!.price, payload.items[0].order.price, 'item.order.price');
  t.is(item.order!.tax, 0, 'item.order.price');

  t.truthy(order, 'item.order_main');
  t.truthy(order.token, 'item.order_main.token');
  t.not(order.token, ordertoken, 'item.order.token');
  t.truthy(uuid_validate(order.token), 'item.order.token');
  t.is(order.price, payload.items[0].order.price, 'item.order.price');
  t.is(order.tax, payload.items[0].order.tax, 'item.order.tax');
});

testFunc(EEntityType.Menu)(`Generates order IDs for modifier (PUT).`, async (t) => {
  const entity = new model.db.Modifier({
    ...fixture,
    location,
  });
  await entity.save();

  try {
    const mainorder = uuid.v4();

    const payload = entity.toJSON() as IModifier;
    payload.items[0].order.price = Math.round(Math.random() * 100) / 100;
    payload.items[0].order.tax = Math.round(Math.random() * 100) / 100;
    payload.items.push({
      title: 'item',
      order: {
        token: mainorder,
        price: 1,
        tax: 0.5,
      } as IEntry,
    } as IModifierItem);
    const i = payload.items.length - 1;

    const response = await testRequest<IModifier>({
      payload,
      method: ERequestMethod.Put,
      role: EUserRole.Manager,
      url: `/${EEntityType.Modifier}/${payload.token}`,
    });

    t.is(response.statusCode, 200, 'statusCode');

    const result = response.result as IModifier;
    const item0 = result.items[0];
    const itemI = result.items[i];
    const orderI = itemI.order;

    t.truthy(result.token, 'token');

    t.truthy(itemI.order!.token, 'item.order.token');
    t.truthy(uuid_validate(itemI.order!.token), 'item.order.token');
    t.is(itemI.order!.price, payload.items[i].order.price, 'item.order.price');
    t.is(itemI.order!.tax, payload.items[i].order.tax, 'item.order.tax');

    t.truthy(orderI, 'item[i].order');
    t.truthy(orderI.token, 'item[i].order.token');
    t.truthy(uuid_validate(orderI.token), 'item[i].order.token');
    t.not(orderI.token, mainorder, 'item[i].order.token');
    t.is(orderI.price, payload.items[i].order.price, 'item[i].order.price');
    t.is(orderI.tax, payload.items[i].order.tax, 'item[i].order.tax');

    t.not(item0.order.token, payload.items[0].order.token, 'item[0].order.token');
    t.truthy(uuid_validate(item0.order.token), 'item[0].order.token');
    t.not(item0.order.token, payload.items[0].order.token, 'item[0].order.token');
    t.is(item0.order.price, payload.items[0].order.price, 'item[0].order.price');
    t.is(item0.order.tax, payload.items[0].order.tax, 'item[0].order.tax');
  } finally {
    await entity.remove();
  }
});
