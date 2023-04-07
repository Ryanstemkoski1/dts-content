import { EEntityType } from "../../../domain/service";

import * as entries from "../";
import model from "../../";

import { testFunc, location } from "../../../tests";

import { ContentMenuItem } from "@triggerpointmedia/dts-server-client";
import * as uuid from "uuid";

testFunc(EEntityType.Entry)(`Entry has not changed.`, async (t) => {
  const menu = model.mongo.generateObjectId().toHexString();
  const menuitem = model.mongo.generateObjectId().toHexString();
  const token = uuid.v4();

  const list1 = [
    {
      token: menuitem,
      title: "item 1",
      order: {
        token,
        price: 1,
      },
    } as ContentMenuItem,
  ];

  const list2 = [
    {
      token: menuitem,
      title: "item 1",
      order: {
        token,
        price: 1,
      },
    } as ContentMenuItem,
  ];

  const result = entries.syncMenuEntries(location, menu, list1, list2);

  t.is(result.created.length, 0, "created");
  t.is(result.removed.length, 0, "removed");
  t.is(list1[0].order.token, token, "token");
  t.is(list2[0].order.token, token, "token");
});

testFunc(EEntityType.Entry)(`Entry has changed.`, async (t) => {
  const menu = model.mongo.generateObjectId().toHexString();
  const menuitem = model.mongo.generateObjectId().toHexString();
  const token = uuid.v4();

  const list1 = [
    {
      token: menuitem,
      title: "item 1",
      order: {
        token,
        price: 2,
      },
    } as ContentMenuItem,
  ];

  const list2 = [
    {
      token: menuitem,
      title: "item 1",
      order: {
        token,
        price: 1,
      },
    } as ContentMenuItem,
  ];

  const result = entries.syncMenuEntries(location, menu, list1, list2);

  t.is(result.created.length, 1, "created");
  t.is(result.removed.length, 1, "removed");
  t.not(list1[0].order.token, token, "token");
  t.is(list2[0].order.token, token, "token");
  t.is(result.created[0].menu, menu, "menu");
  t.is(result.created[0].menu_item, menuitem, "menu_item");
});

testFunc(EEntityType.Entry)(`Entry is maintained.`, async (t) => {
  const menu = model.mongo.generateObjectId().toHexString();
  const menuitem = model.mongo.generateObjectId().toHexString();
  const token = uuid.v4();
  const token2 = uuid.v4();

  const list1 = [
    {
      token: menuitem,
      title: "item 1",
      order: {
        token,
        price: 1,
      },
    } as ContentMenuItem,
  ];

  const list2 = [
    {
      token: menuitem,
      title: "item 1",
      order: {
        token,
        price: 1,
      },
    } as ContentMenuItem,
    {
      token: menuitem,
      title: "item 2",
      order: {
        token: token2,
        price: 2,
      },
    } as ContentMenuItem,
  ];

  const result = entries.syncMenuEntries(location, menu, list1, list2);

  t.is(result.created.length, 0, "created");
  t.is(result.removed.length, 0, "removed");
  t.is(list1[0].order.token, token, "token");
  t.is(list2[0].order.token, token, "token");
  t.is(list2[1].order.token, token2, "token");
});

testFunc(EEntityType.Entry)(`Entry created.`, async (t) => {
  const menu = model.mongo.generateObjectId().toHexString();
  const menuitem = model.mongo.generateObjectId().toHexString();
  const token = uuid.v4();

  const list1 = [
    {
      token: menuitem,
      title: "item 1",
      order: {
        token,
        price: 2,
      },
    } as ContentMenuItem,
  ];

  const result = entries.syncMenuEntries(location, menu, list1);

  t.is(result.created.length, 1, "created");
  t.is(result.removed.length, 1, "removed");
  t.not(list1[0].order.token, token, "token");
  t.is(result.created[0].menu, menu, "menu");
  t.is(result.created[0].menu_item, menuitem, "menu_item");
});

testFunc(EEntityType.Entry)(`Entry removed.`, async (t) => {
  const menu = model.mongo.generateObjectId().toHexString();
  const menuitem = model.mongo.generateObjectId().toHexString();
  const token = uuid.v4();

  const list2 = [
    {
      token: menuitem,
      title: "item 1",
      order: {
        token,
        price: 2,
      },
    } as ContentMenuItem,
  ];

  const result = entries.syncMenuEntries(location, menu, [], list2);

  t.is(result.created.length, 0, "created");
  t.is(result.removed.length, 1, "removed");
  t.is(list2[0].order.token, token, "token");
});
