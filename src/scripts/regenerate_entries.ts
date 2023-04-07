// Regenerate all menu entries for a selected location

try {
  require("dotenv").config();
} catch (err) {}

import { AssetEntry } from "@triggerpointmedia/dts-server-client";
import * as moment from "moment";
import { Client } from "pg";
import * as uuid from "uuid";

import models from "../models";
import { IEntryDigest } from "../models/entry";
import { IEntry } from "../models/mongodb/entry";

const conn = process.env["POSTGRESQL"];

if (!conn) {
  throw new Error("POSTGRESQL env is not set.");
}

const client = new Client({
  connectionString: conn,
});

async function init() {
  await models.connect();
  await client.connect();
}

async function run(location: string) {
  const res = await client.query(
    `SELECT * FROM entry WHERE location_id = '${location}'`
  );

  console.log(`Loaded ${res.rows.length} entries.`);

  const entries = res.rows.reduce((res, row) => {
    res[row.id] = row;

    return res;
  }, {} as { [x: string]: AssetEntry });

  const menusMap = {} as { [x: string]: any };
  const modifiersMap = {} as { [x: string]: any };

  const modifiers = await models.db.Modifier.find({ location })
    .lean(true)
    .exec();
  const menus = await models.db.Menu.find({ location }).lean(true).exec();

  const digest: IEntryDigest = {
    created: [],
    removed: [],
  };

  modifiers.forEach((modifier) => {
    modifier.items?.forEach((item) => {
      if (!entries[item.order?.token]) {
        const entry: AssetEntry = {
          token: uuid.v4(),
          location: location,
          created: moment().format(),
          name: item.title || "",
          price: item.order?.price || 0,
          tax: item.order?.tax || 0,
          pos_id: item.order?.pos_id,
          modifier: modifier._id.toString(),
          modifier_item: item._id.toString(),
        };
        digest.created.push(entry);

        item.order = {
          token: entry.token,
          price: entry.price,
          tax: entry.tax,
          name: entry.name,
          pos_id: entry.pos_id,
          stream: item.order?.stream,
        };

        modifiersMap[modifier._id.toString()] = modifier;
      }
    });
  });

  menus.forEach((menu) => {
    menu.items?.forEach((item) => {
      if (!entries[item.order?.token]) {
        const entry: AssetEntry = {
          token: uuid.v4(),
          location: location,
          created: moment().format(),
          name: item.title || "",
          price: item.order?.price || 0,
          tax: item.order?.tax || 0,
          pos_id: item.order?.pos_id,
          menu: menu._id.toString(),
          menu_item: item._id.toString(),
        };
        digest.created.push(entry);

        item.order = {
          token: entry.token,
          price: entry.price,
          tax: entry.tax,
          name: entry.name,
          pos_id: entry.pos_id,
          stream: item.order?.stream,
        };

        menusMap[menu._id.toString()] = menu;
      }

      if (item.order_main) {
        Object.keys(item.order_main).forEach((x) => {
          const order = item.order_main[x];

          if (!entries[order.token]) {
            const entry: AssetEntry = {
              token: uuid.v4(),
              location: location,
              created: moment().format(),
              name: item.title || "",
              price: order.price || 0,
              tax: order.tax || 0,
              pos_id: order.pos_id,
              menu: menu._id.toString(),
              menu_item: item._id.toString(),
            };
            digest.created.push(entry);

            item.order_main[x] = {
              token: entry.token,
              price: entry.price,
              tax: entry.tax,
              name: entry.name,
              pos_id: entry.pos_id,
              stream: order.stream,
            } as IEntry;

            menusMap[menu._id.toString()] = menu;
          }
        });
      }
    });
  });

  // await Promise.all([
  //   models.db.Modifier.insertMany(modifiers),
  //   models.db.Menu.insertMany(menus),
  // ]);

  const affectedModifiers = Object.values(modifiersMap);
  const affectedMenus = Object.values(menusMap);

  console.log(`Updated ${affectedModifiers.length}/${menus.length} modifiers`);
  console.log(`Updated ${affectedMenus.length}/${modifiers.length} menus`);
  console.log(`Created ${digest.created.length} entries`);

  // await models.entry.processEntries(digest);
}

init()
  .then(() => run("d34f5246-7a60-4d20-b361-280fbbb9b735"))
  .catch(console.error)
  .then(async () => {
    await models.disconnect();

    process.exit(0);
  });
