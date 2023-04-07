// Export missing entries from a deployment

try {
  require("dotenv").config();
} catch (err) {}

import {
  AssetEntry,
  Client as BackendClient,
  ContentEntry,
  ContentMenu,
  ContentMenuPart,
  EClientStage,
  RuntimeDeploymentPayload,
} from "@triggerpointmedia/dts-server-client";
import axios from "axios";
import * as Bluebird from "bluebird";
import * as moment from "moment";
import { Client } from "pg";

import config from "../config";
import { IEntryDigest, processEntries } from "../models/entry";

const conn = process.env["POSTGRESQL"];

if (!conn) {
  throw new Error("POSTGRESQL env is not set.");
}

const client = new Client({
  connectionString: conn,
});

const run = async (location: string, deployment?: string) => {
  const backend = new BackendClient({
    env:
      config.env === "production"
        ? EClientStage.Production
        : EClientStage.Staging,
    name: config.name,
  });

  await client.connect();

  const locationData = await backend.api.readLocation({ id: location });

  const locations = [
    location,
    locationData.parent!.token,
    locationData.parent!.parent!.token,
  ];

  const res = await client.query(
    `SELECT * FROM entry WHERE location_id IN (${locations
      .map((x) => `'${x}'`)
      .join(",")})`
  );

  console.log(`Loaded ${res.rows.length} entries.`);

  const menuData = await backend.api.listMenu({ locations });

  const existingMenus = menuData.reduce((res, row) => {
    res[row.token] = row;

    return res;
  }, {} as { [x: string]: ContentMenuPart });

  console.log(`Loaded ${menuData.length} menus.`);

  const existingEntries = res.rows.reduce((res, row) => {
    res[row.id] = row;

    return res;
  }, {} as { [x: string]: AssetEntry });

  const deployments = await backend.api.listDeployment({ location });

  const tasks = deployments
    .filter(
      (x) =>
        (!deployment && (x.status === "active" || x.status === "ready")) ||
        (deployment && x.token === deployment)
    )
    .sort((a, b) => (a.created > b.created ? -1 : 1))
    .filter((x, i) => i < 10)
    .map((dep) => {
      return async () => {
        console.log(`Deployment ${dep.token}`);

        const deploymentUrl = backend.cdn.getDeploymentUrl(location, dep.token);

        const { data } = await axios.get(deploymentUrl);
        const deploymentData = data as RuntimeDeploymentPayload;

        const deploymentEntires: { [x: string]: AssetEntry } = {};

        deploymentData.menus?.forEach((menu) => {
          const locationId =
            !existingMenus[menu.token] || existingMenus[menu.token]?.parent
              ? deploymentData.facility.parent.token
              : location;

          const createEntry = (entry: ContentEntry): AssetEntry => {
            return {
              token: entry.token,
              location: locationId,
              created: moment().format(),
              price: entry.price || 0,
              tax: entry.tax || 0,
              pos_id: entry.pos_id || undefined,
              zone: entry.stream || undefined,
            } as AssetEntry;
          };

          menu.items?.forEach((item) => {
            if (item.order?.token && !deploymentEntires[item.order?.token]) {
              deploymentEntires[item.order?.token] = {
                ...createEntry(item.order),
                name: item.title,
                menu: menu.token,
                menu_item: item.token,
              };
            }

            if (item.order_refill?.token) {
              deploymentEntires[item.order_refill?.token] = {
                ...createEntry(item.order_refill),
                name: item.title,
                menu: menu.token,
                menu_item: item.token,
              };
            }

            if (item.order_main) {
              Object.values(item.order_main).forEach((mod: ContentEntry) => {
                deploymentEntires[mod.token] = {
                  ...createEntry(mod),
                  name: item.title,
                  menu: menu.token,
                  menu_item: item.token,
                };
              });
            }

            item.modifiers?.forEach((modifier) => {
              modifier.items?.forEach((mod) => {
                if (mod.order?.token) {
                  deploymentEntires[mod.order?.token] = {
                    ...createEntry(mod.order),
                    name: mod.title,
                    modifier: modifier.token.split("~")[0],
                    modifier_item: mod.token.split("~")[0],
                  };
                }
              });
            });
          });
        });

        const missingEntries = Object.keys(deploymentEntires).reduce(
          (res, token) => {
            if (!existingEntries[token]) {
              res[token] = deploymentEntires[token];
            }

            return res;
          },
          {} as { [x: string]: AssetEntry }
        );

        const newEntries = Object.values(missingEntries);

        console.log(`Found ${newEntries.length} missing entries.`);

        if (newEntries.length > 0) {
          newEntries.forEach((x) => {
            existingEntries[x.token] = x;
          });

          const digest: IEntryDigest = {
            removed: [],
            created: newEntries,
          };

          await processEntries(digest);
        }
      };
    });

  await Bluebird.map(tasks, (t) => t(), { concurrency: 1 });
};

run("8f008484-d3e2-43ea-af08-88dd1456ac6d")
  .then(() => console.log("DONE"))
  .then(() => client.end())
  .then(() => process.exit())
  .catch(async (err) => {
    console.error(err);

    await client.end();

    process.exit(1);
  });
