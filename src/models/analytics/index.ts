import {
  ContentAllergen,
  ContentIngredient,
  ContentMenu,
  ContentMenuCategory,
  ContentModifier,
} from "@triggerpointmedia/dts-server-client";
import * as crypto from "crypto";
import * as moment from "moment";
import * as stream from "stream";
import * as zlib from "zlib";

import config from "../../config";

import {
  IAnalyticsMenuItem,
  IAnalyticsMenuItemAllergen,
  IAnalyticsMenuItemIngredient,
  IAnalyticsMenuItemModifier,
  IAnalyticsTask,
} from "../../domain/analytics";

import { IMenu } from "../mongodb/menu";
import { EMenuItemType } from "../mongodb/menu/item";

import backend from "../../services/backend";
import logger from "../../services/logger";

import { IModelDatabases } from "../";
import { LocationModel } from "../location";

const LINK_BATCH = 20;

export const exportMenu = async (
  task: IAnalyticsTask,
  db: IModelDatabases,
  locations: LocationModel
): Promise<void> => {
  const modifiers: IAnalyticsMenuItemModifier[] = [];
  const allergens: IAnalyticsMenuItemAllergen[] = [];
  const ingredients: IAnalyticsMenuItemIngredient[] = [];

  const streamMenuItem = new stream.PassThrough();
  const streamModifier = new stream.PassThrough();
  const streamAllergen = new stream.PassThrough();
  const streamIngredient = new stream.PassThrough();

  const taskMenuItem = backend.aws.s3
    .upload({
      Bucket: config.s3.analytics.name,
      Key: `${config.s3.analytics.path_menuitem}${getFilePath(task)}`,
      Body: streamMenuItem.pipe(zlib.createGzip()),
      ContentEncoding: "gzip",
      ContentType: "application/octet-stream",
    })
    .promise();
  const taskModifier = backend.aws.s3
    .upload({
      Bucket: config.s3.analytics.name,
      Key: `${config.s3.analytics.path_modifier}${getFilePath(task)}`,
      Body: streamModifier.pipe(zlib.createGzip()),
      ContentEncoding: "gzip",
      ContentType: "application/octet-stream",
    })
    .promise();
  const taskAllergen = backend.aws.s3
    .upload({
      Bucket: config.s3.analytics.name,
      Key: `${config.s3.analytics.path_allergen}${getFilePath(task)}`,
      Body: streamAllergen.pipe(zlib.createGzip()),
      ContentEncoding: "gzip",
      ContentType: "application/octet-stream",
    })
    .promise();
  const taskIngredient = backend.aws.s3
    .upload({
      Bucket: config.s3.analytics.name,
      Key: `${config.s3.analytics.path_ingredient}${getFilePath(task)}`,
      Body: streamIngredient.pipe(zlib.createGzip()),
      ContentEncoding: "gzip",
      ContentType: "application/octet-stream",
    })
    .promise();

  const exportLinks = async () => {
    if (modifiers.length > 0) {
      const modifiersItems = await db.Modifier.find({
        _id: { $in: modifiers.map((x) => x.modifier) },
      }).exec();

      const modifiersMap: { [x: string]: ContentModifier } =
        modifiersItems.reduce((res, item) => {
          res[item._id.toString()] = item.toJSON({ getters: true }) as any;
          return res;
        }, {});

      modifiers
        .reduce((res, modifier) => {
          const data = modifiersMap[modifier.modifier];

          if (!data) {
            return res;
          }

          (data.items || []).forEach((dataitem) => {
            const hash = crypto.createHash("md5");
            hash.update(`${modifier.menuitem}${modifier.modifier}`);

            const newitem: IAnalyticsMenuItemModifier = {
              id: hash.digest("hex"),
              menuitem: modifier.menuitem,
              modifier: modifier.modifier,
              modifieritem: dataitem.token,
              order: dataitem.order?.token,
              price: dataitem.order?.price || 0,
              modifier_title: data.title,
              modifieritem_title: dataitem.title,
            };

            res.push(newitem);

            dataitem.ingredients_list?.forEach((ingredient) => {
              const hash = crypto.createHash("md5");
              hash.update(`${modifier.menuitem}${ingredient}`);

              ingredients.push({
                id: hash.digest("hex"),
                menuitem: modifier.menuitem,
                modifieritem: newitem.id,
                ingredient: ingredient,
                amount: 1,
              } as IAnalyticsMenuItemIngredient);
            });
          });

          return res;
        }, [] as IAnalyticsMenuItemModifier[])
        .forEach((item) => {
          streamModifier.write(JSON.stringify(item) + "\n");
        });

      modifiers.splice(0, modifiers.length);
    }

    if (allergens.length > 0) {
      const allergensItems = await db.Allergen.find({
        _id: { $in: allergens.map((x) => x.allergen) },
      }).exec();

      const allergensMap = allergensItems.reduce((res, item) => {
        res[item._id.toString()] = item.toJSON({ getters: true }) as any;
        return res;
      }, {} as { [x: string]: ContentAllergen });

      allergens
        .map((allergen) => {
          const data = allergensMap[allergen.allergen];

          if (!data) {
            return null;
          }

          allergen.title = data.title;

          return allergen;
        })
        .filter((x) => x)
        .forEach((item) => {
          streamAllergen.write(JSON.stringify(item) + "\n");
        });

      allergens.splice(0, allergens.length);
    }

    if (ingredients.length > 0) {
      const ingredientsItems = await db.Ingredient.find({
        _id: { $in: ingredients.map((x) => x.ingredient) },
      }).exec();

      const ingredientsMap = ingredientsItems.reduce((res, item) => {
        res[item._id.toString()] = item.toJSON({ getters: true }) as any;
        return res;
      }, {} as { [x: string]: ContentIngredient });

      ingredients
        .map((ingredient) => {
          const data = ingredientsMap[ingredient.ingredient];

          if (!data) {
            return null;
          }

          ingredient.title = data.title;

          return ingredient;
        })
        .filter((x) => x)
        .forEach((item) => {
          streamIngredient.write(JSON.stringify(item) + "\n");
        });

      ingredients.splice(0, ingredients.length);
    }
  };

  const menuCursor = db.Menu.find({ parent: { $exists: false } }).cursor();

  try {
    for await (const menuDoc of menuCursor) {
      const menu: ContentMenu = (menuDoc as IMenu).toJSON({
        getters: true,
      }) as any;

      const parent = await locations.getParent(menu.location);

      if (!parent) {
        continue;
      }

      const business = parent === config.realm ? menu.location : parent;

      const categoriesMap = (menu.categories || []).reduce((res, category) => {
        res[category.token] = category;
        return res;
      }, {} as { [x: string]: ContentMenuCategory });

      const items = (menu.items || [])
        .filter((item) => item.type === EMenuItemType.Orderable)
        .map((item) => {
          const hash = crypto.createHash("md5");
          hash.update(`${menu.location}${menu.token}${item.token}`);

          const menuitem: IAnalyticsMenuItem = {
            id: hash.digest("hex"),
            business: business,
            location: menu.location,
            menu: menu.token,
            category: item.parent,
            menuitem: item.token,
            created: moment(item.modified).unix(),
            order: item.order?.token,
            price: item.order?.price || 0,
            title: item.title,
            description: item.description,
            category_title: categoriesMap[item.parent]?.title,
            category_subtitle: categoriesMap[item.parent]?.subtitle,
            menu_title: menu.title,
            source_menu: item.source_menu,
            source_item: item.source_item,
          };

          item.modifiers?.forEach((modifier) => {
            modifiers.push({
              menuitem: menuitem.id,
              modifier: modifier,
            } as IAnalyticsMenuItemModifier);
          });

          item.allergens?.forEach((allergen) => {
            const hash = crypto.createHash("md5");
            hash.update(`${menuitem.id}${allergen}`);

            allergens.push({
              id: hash.digest("hex"),
              menuitem: menuitem.id,
              allergen: allergen,
            } as IAnalyticsMenuItemAllergen);
          });

          item.ingredients_list?.forEach((ingredient) => {
            const hash = crypto.createHash("md5");
            hash.update(`${menuitem.id}${ingredient}`);

            ingredients.push({
              id: hash.digest("hex"),
              menuitem: menuitem.id,
              ingredient: ingredient.ingredient,
              amount: ingredient.amount || 1,
            } as IAnalyticsMenuItemIngredient);
          });

          return menuitem;
        });

      items.forEach((item) => {
        streamMenuItem.write(JSON.stringify(item) + "\n");
      });

      if (
        modifiers.length >= LINK_BATCH ||
        allergens.length >= LINK_BATCH ||
        ingredients.length >= LINK_BATCH
      ) {
        await exportLinks();
      }
    }
  } finally {
    try {
      await menuCursor.close();
    } catch (error) {
      logger.warn({ error }, "Cursor close error.");
    }
  }

  if (modifiers.length > 0 || allergens.length > 0 || ingredients.length > 0) {
    await exportLinks();
  }

  streamMenuItem.end();
  streamModifier.end();
  streamAllergen.end();
  streamIngredient.end();

  await Promise.all([taskMenuItem, taskModifier, taskAllergen, taskIngredient]);
};

const getFilePath = (task: IAnalyticsTask): string => {
  const time = moment(task.time);

  return (
    `year=${time.format("YYYY")}/month=${time.format("MM")}/day=${time.format(
      "DD"
    )}/` + `hour=${time.format("HH")}/output.gz`
  );
};
