// Generate missing entries for the assets DB

try {
  require("dotenv").config();
} catch (err) {}

import {
  AssetEntry,
  ContentEntry,
  ContentMenu,
  ContentModifier,
} from "@triggerpointmedia/dts-server-client";
import { Client } from "pg";
import * as uuid_validate from "uuid-validate";

import model from "../models";
import { IEntryDigest, processEntries } from "../models/entry";

const conn = process.env["POSTGRESQL"];

if (!conn) {
  throw new Error("POSTGRESQL env is not set.");
}

const client = new Client({
  connectionString: conn,
});

const run = async () => {
  await model.connect();
  await client.connect();

  const res = await client.query("SELECT * FROM entry");

  console.log(`Loaded ${res.rows.length} entries.`);

  const entries = res.rows.reduce((res, row) => {
    res[row.id] = row;

    return res;
  }, {} as { [x: string]: AssetEntry });

  const menuEntities = await model.db.Menu.find({}).exec();

  const menus: ContentMenu[] = menuEntities.map(
    (x) => x.toJSON({ getters: true }) as any
  );

  console.log(`Loaded ${menus.length} menus.`);

  const modifierEntities = await model.db.Modifier.find({}).exec();

  const modifiers: ContentModifier[] = modifierEntities.map(
    (x) => x.toJSON({ getters: true }) as any
  );

  console.log(`Loaded ${modifiers.length} modifiers.`);

  let invalidMenuEntries = 0;

  const newMenuEntries = menus.reduce((res, menu) => {
    return (menu.items || []).reduce((res, item) => {
      const pushItem = (order: ContentEntry) => {
        const isValid =
          uuid_validate(order.token) &&
          uuid_validate(menu.location) &&
          item.title?.length > 0;

        if (!isValid) {
          invalidMenuEntries++;
        }

        if (isValid) {
          res.push({
            token: order.token,
            location: menu.location,
            name: item.title,
            price: order.price > 0 ? order.price : 0,
            tax: order.tax > 0 ? order.tax : 0,
            pos_id: order.pos_id || undefined,
            menu: menu.token || undefined,
            menu_item: item.token || undefined,
            created: new Date().toISOString(),
          });
        }
      };

      if (item.order?.token && !entries[item.order.token]) {
        pushItem(item.order);
      }

      if (item.order_refill?.token && !entries[item.order_refill.token]) {
        pushItem(item.order_refill);
      }

      if (item.order_main) {
        Object.values(item.order_main)
          .filter((x: ContentEntry) => !entries[x.token])
          .forEach((order: ContentEntry) => pushItem(order));
      }

      return res;
    }, res);
  }, [] as AssetEntry[]);

  console.log(`Generated ${newMenuEntries.length} new menu entries.`);

  const updatedMenuEntries = menus.reduce((res, menu) => {
    return (menu.items || []).reduce((res, item) => {
      const pushItem = (order: ContentEntry) => {
        const source = entries[order.token];

        if (parseFloat(source.price) >= 0) {
          res.push({
            token: source.id,
            location: source.location_id,
            name: source.name,
            price: parseFloat(source.price),
            tax: parseFloat(source.tax) > 0 ? parseFloat(source.tax) : 0,
            pos_id: source.pos_id || undefined,
            menu: menu.token,
            menu_item: item.token,
            created: source.created.toISOString(),
          });
        } else {
          invalidMenuEntries++;
        }
      };

      if (
        item.order?.token &&
        entries[item.order.token] &&
        !entries[item.order.token].menu_id
      ) {
        pushItem(item.order);
      }

      if (
        item.order_refill?.token &&
        entries[item.order_refill.token] &&
        !entries[item.order_refill.token].menu_id
      ) {
        pushItem(item.order_refill);
      }

      if (item.order_main) {
        Object.values(item.order_main)
          .filter(
            (x: ContentEntry) => entries[x.token] && !entries[x.token].menu_id
          )
          .forEach((order: ContentEntry) => pushItem(order));
      }

      return res;
    }, res);
  }, [] as AssetEntry[]);

  console.log(`Generated ${updatedMenuEntries.length} updated menu entries.`);

  if (invalidMenuEntries > 0) {
    console.log(`Found ${invalidMenuEntries} invalid menu entries.`);
  }

  let invalidModifierEntries = 0;

  const newModifierEntries = modifiers.reduce((res, modifier) => {
    return (modifier.items || []).reduce((res, item) => {
      const pushItem = (order: ContentEntry) => {
        const isValid =
          uuid_validate(order.token) &&
          uuid_validate(modifier.location) &&
          item.title?.length > 0;

        if (!isValid) {
          invalidModifierEntries++;
        }

        if (isValid) {
          res.push({
            token: order.token,
            location: modifier.location,
            name: item.title,
            price: order.price > 0 ? order.price : 0,
            tax: order.tax > 0 ? order.tax : 0,
            pos_id: order.pos_id || undefined,
            modifier: modifier.token || undefined,
            modifier_item: item.token || undefined,
            created: new Date().toISOString(),
          });
        }
      };

      if (item.order?.token && !entries[item.order.token]) {
        pushItem(item.order);
      }

      return res;
    }, res);
  }, [] as AssetEntry[]);

  console.log(`Generated ${newModifierEntries.length} new modifier entries.`);

  if (invalidModifierEntries > 0) {
    console.log(`Found ${invalidModifierEntries} invalid modifier entries.`);
  }

  const updatedModifierEntries = modifiers.reduce((res, modifier) => {
    return (modifier.items || []).reduce((res, item) => {
      const pushItem = (order: ContentEntry) => {
        const source = entries[order.token];

        if (parseFloat(source.price) >= 0) {
          res.push({
            token: source.id,
            location: source.location_id,
            name: source.name,
            price: parseFloat(source.price),
            tax: parseFloat(source.tax) > 0 ? parseFloat(source.tax) : 0,
            pos_id: source.pos_id || undefined,
            modifier: modifier.token,
            modifier_item: item.token,
            created: source.created.toISOString(),
          });
        } else {
          invalidModifierEntries++;
        }
      };

      if (
        item.order?.token &&
        entries[item.order.token] &&
        !entries[item.order.token].modifier_id
      ) {
        pushItem(item.order);
      }

      return res;
    }, res);
  }, [] as AssetEntry[]);

  console.log(
    `Generated ${updatedModifierEntries.length} updated modifier entries.`
  );

  const newEntries = newMenuEntries
    .concat(updatedMenuEntries)
    .concat(newModifierEntries)
    .concat(updatedModifierEntries);

  if (newEntries.length > 0) {
    console.log(`Creating ${newEntries.length} requests...`);

    const digest: IEntryDigest = {
      created: newEntries,
      removed: [],
    };

    await processEntries(digest);
  }
};

run()
  .then(() => console.log("DONE"))
  .then(() => client.end())
  .then(() => process.exit())
  .catch(async (err) => {
    console.error(err);

    await client.end();

    process.exit(1);
  });
