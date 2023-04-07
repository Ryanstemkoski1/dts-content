import * as uuid from "uuid";

import { EEntityType } from "../../../domain/service";

import * as model from "../";

import { testFunc, location } from "../../../tests";

import { ContentEntry } from "@triggerpointmedia/dts-server-client";

testFunc(EEntityType.Entry)(`Entry has not changed.`, async (t) => {
  const token = uuid.v4();

  const entry1 = {
    token,
    price: 1,
    tax: 0,
    pos_id: null,
  } as ContentEntry;

  const entry2 = {
    token,
    price: 1,
    tax: 0,
    pos_id: null,
  } as ContentEntry;

  const result = model.entryHasChanged(location, entry1, entry2);

  t.is(result, null);
});

testFunc(EEntityType.Entry)(`Entry has changed price.`, async (t) => {
  const token = uuid.v4();

  const entry1 = {
    token,
    price: 1,
  } as ContentEntry;

  const entry2 = {
    token,
    price: 2,
  } as ContentEntry;

  const result = model.entryHasChanged(location, entry1, entry2);

  t.truthy(result);
  t.not(result.token, entry1.token);
  t.not(result.token, entry2.token);
});

testFunc(EEntityType.Entry)(`Entry has changed tax.`, async (t) => {
  const token = uuid.v4();

  const entry1 = {
    token,
    price: 1,
    tax: 1,
  } as ContentEntry;

  const entry2 = {
    token,
    price: 1,
  } as ContentEntry;

  const result = model.entryHasChanged(location, entry1, entry2);

  t.truthy(result);
  t.not(result.token, entry1.token);
  t.not(result.token, entry2.token);
  t.is(result.tax, entry1.tax);
});

testFunc(EEntityType.Entry)(`Entry has changed pos_id.`, async (t) => {
  const token = uuid.v4();

  const entry1 = {
    token,
    price: 1,
    pos_id: "1",
  } as ContentEntry;

  const entry2 = {
    token,
    price: 1,
  } as ContentEntry;

  const result = model.entryHasChanged(location, entry1, entry2);

  t.truthy(result);
  t.not(result.token, entry1.token);
  t.not(result.token, entry2.token);
  t.is(result.pos_id, entry1.pos_id);
});

testFunc(EEntityType.Entry)(`Entry has unset pos_id.`, async (t) => {
  const token = uuid.v4();

  const entry1 = {
    token,
    price: 1,
    pos_id: null,
  } as ContentEntry;

  const entry2 = {
    token,
    price: 1,
    pos_id: "1",
  } as ContentEntry;

  const result = model.entryHasChanged(location, entry1, entry2);

  t.truthy(result);
  t.not(result.token, entry1.token);
  t.not(result.token, entry2.token);
  t.is(result.pos_id, undefined);
});

testFunc(EEntityType.Entry)(`Entry has unset tax.`, async (t) => {
  const token = uuid.v4();

  const entry1 = {
    token,
    price: 1,
    tax: null,
  } as ContentEntry;

  const entry2 = {
    token,
    price: 1,
    tax: 1,
  } as ContentEntry;

  const result = model.entryHasChanged(location, entry1, entry2);

  t.truthy(result);
  t.not(result.token, entry1.token);
  t.not(result.token, entry2.token);
  t.is(result.tax, 0);
});

testFunc(EEntityType.Entry)(`Entry has no token.`, async (t) => {
  const token = uuid.v4();

  const entry1 = {
    price: 1,
  } as ContentEntry;

  const entry2 = {
    token,
    price: 1,
  } as ContentEntry;

  const result = model.entryHasChanged(location, entry1, entry2);

  t.truthy(result);
  t.not(result.token, entry1.token);
  t.not(result.token, entry2.token);
  t.is(result.price, entry1.price);
});

testFunc(EEntityType.Entry)(`Entry has gets a token.`, async (t) => {
  const entry1 = {
    price: 1,
  } as ContentEntry;

  const entry2 = {
    price: 1,
  } as ContentEntry;

  const result = model.entryHasChanged(location, entry1, entry2);

  t.truthy(result);
  t.truthy(result.token);
  t.not(result.token, entry1.token);
  t.not(result.token, entry2.token);
});

testFunc(EEntityType.Entry)(`Entry ignores a token.`, async (t) => {
  const token = uuid.v4();

  const entry1 = {
    token,
    price: 2,
  } as ContentEntry;

  const entry2 = {
    price: 1,
  } as ContentEntry;

  const result = model.entryHasChanged(location, entry1, entry2);

  t.truthy(result);
  t.truthy(result.token);
  t.not(result.token, entry1.token);
});

testFunc(EEntityType.Entry)(`Rounds numbers.`, async (t) => {
  const token = uuid.v4();

  const entry1 = {
    token,
    price: 2.1099999999,
    tax: 0.099999999,
  } as ContentEntry;

  const entry2 = {
    price: 1,
  } as ContentEntry;

  const result = model.entryHasChanged(location, entry1, entry2);

  t.truthy(result);
  t.truthy(result.token);
  t.is(result.price.toString(10), "2.11");
  t.is(result.tax.toString(10), "0.1");
});
