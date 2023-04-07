import * as uuid_validate from "uuid-validate";

import { EEntityType, EEntityOperation } from "../../domain/service";

import { entityRequest, entityRequests } from "../entity";

import logger from "../../services/logger";

import {
  AssetEntry,
  ContentEntry,
  ContentMenuItem,
  ContentModifierItem,
} from "@triggerpointmedia/dts-server-client";
import * as Bluebird from "bluebird";
import * as moment from "moment";
import * as uuid from "uuid";

export interface IEntryDigest {
  created: AssetEntry[];
  removed: {
    token: string;
    location: string;
  }[];
}

/**
 * Check modifier items' entries and generate new ones if needed.
 * @description New modifier items objects will be updated with new entries in-place.
 * @param location Location ID.
 * @param modifier Modifier ID.
 * @param newitems New modifier items.
 * @param olditems Existing modifier items.
 * @returns Change digest.
 */
export const syncModifierEntries = (
  location: string,
  modifier: string,
  newitems: ContentModifierItem[],
  olditems: ContentModifierItem[] = []
): IEntryDigest => {
  if (!location) {
    throw new Error("Location not provided.");
  }

  if (!modifier) {
    throw new Error("Modifier not provided.");
  }

  const result: IEntryDigest = {
    created: [],
    removed: [],
  };

  const oldentries: { [x: string]: AssetEntry } = olditems.reduce(
    (res, item) => {
      if (item.order?.token) {
        res[item.order.token] = item.order;
      }

      return res;
    },
    {}
  );

  if (!newitems || newitems.length === 0) {
    return Object.keys(oldentries)
      .map((x) => oldentries[x])
      .reduce((res, entry) => {
        res.removed.push({
          location,
          token: entry.token,
        });

        logger.debug(`Removed modifier ${modifier} entry ${entry.token}`);

        return res;
      }, result);
  }

  return newitems.reduce((res, item) => {
    const newentry1 = entryHasChanged(
      location,
      item.order,
      oldentries[item.order?.token]
    );

    if (newentry1) {
      if (item.order?.token) {
        res.removed.push({
          location,
          token: item.order.token,
        });

        logger.debug(
          `Removed modifier ${modifier} item ${item.token} entry ${item.order.token}`
        );
      }

      item.order = newentry1;
      res.created.push({
        ...newentry1,
        modifier,
        modifier_item: item.token,
        name: item.title,
      });

      logger.debug(
        `Created modifier ${modifier} item ${item.token} entry ${newentry1.token}`
      );
    }

    return res;
  }, result);
};

/**
 * Check menu items' entries and generate new ones if needed.
 * @description New menu items objects will be updated with new entries in-place.
 * @param location Location ID.
 * @param menu Menu ID.
 * @param newitems New menu items.
 * @param olditems Existing menu items.
 * @returns Change digest.
 */
export const syncMenuEntries = (
  location: string,
  menu: string,
  newitems: ContentMenuItem[],
  olditems: ContentMenuItem[] = []
): IEntryDigest => {
  if (!location) {
    throw new Error("Location not provided.");
  }

  if (!menu) {
    throw new Error("Menu not provided.");
  }

  const result: IEntryDigest = {
    created: [],
    removed: [],
  };

  const oldentries: { [x: string]: AssetEntry } = olditems.reduce(
    (res, item) => {
      if (item.order?.token) {
        res[item.order.token] = item.order;
      }

      if (item.order_refill?.token) {
        res[item.order_refill.token] = item.order_refill;
      }

      if (item.order_main) {
        Object.keys(item.order_main).forEach((x) => {
          const entry: ContentEntry = item.order_main[x];

          if (entry.token) {
            res[entry.token] = entry;
          }
        });
      }

      return res;
    },
    {}
  );

  if (!newitems || newitems.length === 0) {
    return Object.keys(oldentries)
      .map((x) => oldentries[x])
      .reduce((res, entry) => {
        res.removed.push({
          location,
          token: entry.token,
        });

        logger.debug(`Removed menu ${menu} entry ${entry.token}`);

        return res;
      }, result);
  }

  return newitems.reduce((res, item) => {
    const newentry1 = entryHasChanged(
      location,
      item.order,
      oldentries[item.order?.token]
    );

    if (newentry1) {
      if (item.order?.token) {
        res.removed.push({
          location,
          token: item.order.token,
        });

        logger.debug(
          `Removed menu ${menu} item ${item.token} entry ${item.order.token}`
        );
      }

      item.order = prepareEntry(newentry1);
      res.created.push({
        ...newentry1,
        menu,
        menu_item: item.token,
        name: item.title,
      });

      logger.debug(
        `Created menu ${menu} item ${item.token} entry ${newentry1.token}`
      );
    }

    const newentry2 = entryHasChanged(
      location,
      item.order_refill,
      oldentries[item.order_refill?.token]
    );

    if (newentry2) {
      if (item.order_refill?.token) {
        res.removed.push({
          location,
          token: item.order_refill.token,
        });

        logger.debug(
          `Removed menu ${menu} item ${item.token} refill entry ${item.order_refill.token}`
        );
      }

      item.order_refill = prepareEntry(newentry2);
      res.created.push({
        ...newentry2,
        menu,
        menu_item: item.token,
        name: item.title,
      });

      logger.debug(
        `Created menu ${menu} item ${item.token} refill entry ${newentry2.token}`
      );
    }

    if (item.order_main) {
      Object.keys(item.order_main).forEach((x) => {
        const entry = item.order_main[x];

        const newentry = entryHasChanged(
          location,
          entry,
          oldentries[entry.token]
        );

        if (newentry) {
          if (entry?.token) {
            res.removed.push({
              location,
              token: entry.token,
            });

            logger.debug(
              `Removed menu ${menu} item ${item.token} refill entry ${entry.token}`
            );
          }

          item.order_main[x] = prepareEntry(newentry);
          res.created.push({
            ...newentry,
            menu,
            menu_item: item.token,
            name: item.title,
          });

          logger.debug(
            `Created menu ${menu} item ${item.token} refill entry ${newentry.token}`
          );
        }
      });
    }

    return res;
  }, result);
};

/**
 * Broadcast entity changes.
 * @param digest Change digest.
 */
export const processEntries = async (digest: IEntryDigest): Promise<void> => {
  const tasks: (() => Promise<void>)[] = [];

  if (digest.created?.length > 0) {
    tasks.push(async () => {
      try {
        await entityRequests(
          EEntityType.Entry,
          EEntityOperation.Create,
          digest.created
        );
      } catch (error) {
        logger.warn({ error }, "Unable to create new entries.");
        throw error;
      }
    });
  }

  const removed = digest.removed?.filter((x) => uuid_validate(x.token));

  if (removed?.length > 0) {
    tasks.push(async () => {
      try {
        await entityRequests(
          EEntityType.Entry,
          EEntityOperation.Delete,
          removed
        );
      } catch (error) {
        logger.warn({ error }, "Unable to delete entries.");
        throw error;
      }
    });
  }

  await Bluebird.map(tasks, (t) => t(), { concurrency: 1 });
};

/**
 * Check if an entry has changes compared to another entry.
 * @param newItem New entry.
 * @param oldItem Existing entry.
 * @returns Return null if there are no changes, otherwise generates a new entry object.
 */
export const entryHasChanged = (
  location: string,
  newItem?: ContentEntry,
  oldItem?: ContentEntry
): AssetEntry | null => {
  if (!newItem) {
    return null;
  }

  let changed = false;

  if (!newItem.token || !oldItem || !oldItem.token) {
    logger.debug(`Creating new entry...`);
    changed = true;
  } else if (!uuid_validate(oldItem.token) || !uuid_validate(newItem.token)) {
    logger.debug(`Generating new entry ID...`);
    changed = true;
  } else if (Math.abs((oldItem.price || 0) - (newItem.price || 0)) >= 0.01) {
    logger.debug(
      `Switching entry ${oldItem.token}: price ${oldItem.price}->${newItem.price}`
    );
    changed = true;
  } else if (Math.abs((oldItem.tax || 0) - (newItem.tax || 0)) >= 0.01) {
    logger.debug(
      `Switching entry ${oldItem.token}: tax ${oldItem.tax}->${newItem.tax}`
    );
    changed = true;
  } else if (
    (newItem.pos_id || oldItem.pos_id) &&
    oldItem.pos_id !== newItem.pos_id
  ) {
    logger.debug(
      `Switching entry for item ${oldItem.token}: pos_id ${oldItem.pos_id}->${newItem.pos_id}`
    );
    changed = true;
  } else if (
    (newItem.stream || oldItem.stream) &&
    oldItem.stream !== newItem.stream
  ) {
    logger.debug(
      `Switching entry for item ${oldItem.token}: stream ${oldItem.stream}->${newItem.stream}`
    );
    changed = true;
  }

  if (!changed) {
    return null;
  }

  const entry: AssetEntry = {
    location,
    token: uuid.v4(),
    price: Math.round((newItem.price || 0) * 100) / 100,
    tax: Math.round((newItem.tax || 0) * 100) / 100,
    pos_id: newItem.pos_id || undefined,
    name: newItem?.name || oldItem?.name,
    created: moment().format(),
    zone: newItem.stream || undefined,
  };

  return entry;
};

function prepareEntry(asset: AssetEntry): ContentEntry {
  const entry: ContentEntry = {
    token: asset.token,
    price: asset.price,
    tax: asset.tax,
    pos_id: asset.pos_id,
    name: asset.name,
    stream: asset.zone,
  };

  return entry;
}
