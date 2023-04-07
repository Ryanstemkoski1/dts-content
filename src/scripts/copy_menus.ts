// Copy menus and modifiers to another location

try {
  require("dotenv").config();
} catch (err) {}

import { AssetEntry } from "@triggerpointmedia/dts-server-client";
import * as moment from "moment";
import * as uuid from "uuid";

import models from "../models";
import { IEntryDigest } from "../models/entry";
import { IEntry } from "../models/mongodb/entry";

async function init() {
  await models.connect();
}

async function run(
  from: string,
  to: string,
  opts: { suffix?: string; menus?: string[] } = {}
) {
  const query: any = {};

  if (opts.menus) {
    query["_id"] = { $in: opts.menus };
  }

  const allergens = await models.db.Allergen.find({ location: from })
    .lean(true)
    .exec();
  const ingredients = await models.db.Ingredient.find({ location: from })
    .lean(true)
    .exec();
  const modifiers = await models.db.Modifier.find({ location: from })
    .lean(true)
    .exec();
  const menus = await models.db.Menu.find({ location: from, ...query })
    .lean(true)
    .exec();

  const allergensMap = {} as { [x: string]: string };
  const ingredientsMap = {} as { [x: string]: string };
  const modifiersMap = {} as { [x: string]: string };

  const digest: IEntryDigest = {
    created: [],
    removed: [],
  };

  allergens.forEach((allergen) => {
    const id = models.mongo.generateObjectId();
    allergensMap[allergen._id.toString()] = id.toString();

    allergen._id = id;
    allergen.location = to;
    allergen.modified = new Date();
  });

  ingredients.forEach((ingredient) => {
    const id = models.mongo.generateObjectId();
    ingredientsMap[ingredient._id.toString()] = id.toString();

    ingredient._id = id;
    ingredient.location = to;
    ingredient.modified = new Date();
  });

  modifiers.forEach((modifier) => {
    const id = models.mongo.generateObjectId();
    modifiersMap[modifier._id.toString()] = id.toString();

    modifier._id = id;
    modifier.location = to;
    modifier.modified = new Date();
  });

  modifiers.forEach((modifier) => {
    modifier.items?.forEach((item) => {
      const entry: AssetEntry = {
        token: uuid.v4(),
        location: to,
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

      item.links = item.links
        ?.map((link) => {
          const id = modifiersMap[link.toString()];

          if (!id) {
            console.error(`Modifier link not found: ${link.toString()}`);
            return null;
          }

          return models.mongo.createObjectId(id) as any;
        })
        .filter((x) => x);
    });
  });

  menus.forEach((menu) => {
    menu._id = models.mongo.generateObjectId();
    menu.location = to;
    menu.modified = new Date();

    if (opts.suffix) {
      menu.title = (menu.title || "") + opts.suffix;
    }

    menu.items?.forEach((item) => {
      const entry: AssetEntry = {
        token: uuid.v4(),
        location: to,
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

      if (item.main_modifier) {
        const id = modifiersMap[item.main_modifier.toString()];

        if (!id) {
          console.error(
            `Main modifier link not found: ${item.main_modifier.toString()}`
          );
        } else {
          item.main_modifier = models.mongo.createObjectId(id) as any;
        }

        if (item.order_main) {
          Object.keys(item.order_main).forEach((x) => {
            const order = item.order_main[x];

            const entry: AssetEntry = {
              token: uuid.v4(),
              location: to,
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
          });
        }
      }

      item.modifiers = item.modifiers
        ?.map((modifier) => {
          const id = modifiersMap[modifier.toString()];

          if (!id) {
            console.error(`Modifier link not found: ${modifier.toString()}`);
            return null;
          }

          return models.mongo.createObjectId(id) as any;
        })
        .filter((x) => x);

      item.modifiers_overrides = item.modifiers_overrides
        ?.map((override) => {
          const res = {
            ...override,
          };

          if (res.modifier) {
            if (!modifiersMap[res.modifier.toString()]) {
              console.error(`Modifier not found: ${res.modifier.toString()}`);
              return null;
            }

            res.modifier = modifiersMap[res.modifier.toString()];
          }

          if (res.links) {
            res.links = res.links
              .map((link) => {
                if (!modifiersMap[link.toString()]) {
                  console.error(`Modifier links not found: ${link.toString()}`);
                  return null;
                }

                return modifiersMap[link.toString()];
              })
              .filter((x) => x);
          }

          return res;
        })
        .filter((x) => x);

      item.allergens = item.allergens
        ?.map((allergen) => {
          const id = allergensMap[allergen.toString()];

          if (!id) {
            console.error(`Allergen not found: ${allergen.toString()}`);
            return null;
          }

          return models.mongo.createObjectId(id) as any;
        })
        .filter((x) => x);

      item.ingredients_list = item.ingredients_list
        ?.map((ingredient) => {
          const id = ingredientsMap[ingredient.ingredient.toString()];

          if (!id) {
            console.error(
              `Ingredient not found: ${ingredient.ingredient.toString()}`
            );
            return null;
          }

          return { ingredient: models.mongo.createObjectId(id), amount: 1 };
        })
        .filter((x) => x) as any;
    });
  });

  await Promise.all([
    models.db.Allergen.insertMany(allergens),
    models.db.Ingredient.insertMany(ingredients),
    models.db.Modifier.insertMany(modifiers),
    models.db.Menu.insertMany(menus),
  ]);

  console.log(`Created ${allergens.length} allergens`);
  console.log(`Created ${ingredients.length} ingredients`);
  console.log(`Created ${modifiers.length} modifiers`);
  console.log(`Created ${menus.length} menus`);
  console.log(`Created ${digest.created.length} entries`);

  await models.entry.processEntries(digest);
}

init()
  .then(() =>
    run(
      "406aff79-f10f-49c2-80bb-aa91b3f57c97",
      "0048f3c0-83a2-495b-84ee-7924afdcb65a",
      {
        suffix: undefined,
        menus: ["623c76d8bc0bfe9d530078b8"],
      }
    )
  )
  .catch(console.error)
  .then(async () => {
    await models.disconnect();

    process.exit(0);
  });
