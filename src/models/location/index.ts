import {
  AssetLocation,
  isApiError,
} from "@triggerpointmedia/dts-server-client";

import { ILocation } from "../mongodb/location";

import backend from "../../services/backend";
import logger from "../../services/logger";

import { IModelDatabases } from "..";

export class LocationModel {
  private readonly locationTasks: { [x: string]: Promise<ILocation> } = {};
  private readonly parentCache: { [x: string]: string } = {};
  private readonly parentTasks: { [x: string]: Promise<string> } = {};

  private db: IModelDatabases;

  async init(db: IModelDatabases): Promise<void> {
    this.db = db;
  }

  async locationCreated(token: string): Promise<ILocation | null> {
    return await this.locationUpdated(token);
  }

  async locationUpdated(token: string): Promise<ILocation | null> {
    let data: AssetLocation;

    try {
      data = await backend.api.readLocation({ id: token });
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        return null;
      }

      throw error;
    }

    const update = {
      _id: token,
      name: data.name,
      type: data.type,
      parent: data.parent?.token,
    } as ILocation;

    const entity = await this.db.Location.findOneAndUpdate(
      { _id: token },
      update,
      {
        new: true,
        upsert: true,
      }
    );

    return entity;
  }

  async locationDeleted(token: string): Promise<void> {
    await this.db.Location.findByIdAndDelete(token);
  }

  async read(token: string): Promise<ILocation | null> {
    const location = await this.db.Location.findById(token).exec();

    if (!location) {
      return await this.fetchLocation(token);
    }

    return location;
  }

  async getParent(location: string): Promise<string | null> {
    if (this.parentCache[location] !== undefined) {
      return this.parentCache[location];
    }

    const data = await this.read(location);

    return (this.parentCache[location] = data?.parent || null);
  }

  private async fetchLocation(token: string): Promise<ILocation | null> {
    if (this.locationTasks[token] !== undefined) {
      return await this.locationTasks[token];
    }

    this.locationTasks[token] = this.locationUpdated(token)
      .then((location) => {
        return (this.locationTasks[token] = Promise.resolve(location));
      })
      .catch(async (error) => {
        logger.warn({ error, token }, "Location read error.");

        delete this.locationTasks[token];
        throw error;
      });

    return await this.locationTasks[token];
  }

  private async fetchParent(token: string): Promise<string | null> {
    if (this.parentTasks[token] !== undefined) {
      return await this.parentTasks[token];
    }

    this.parentTasks[token] = this.read(token)
      .then(async (location) => {
        let loc = location;

        if (!loc) {
          loc = await this.locationUpdated(token);
        }

        if (!loc) {
          throw new Error(`Location not found: ${token}`);
        }

        return (this.parentCache[token] = loc.parent || null);
      })
      .catch(async (error) => {
        logger.warn({ error, token }, "Location read error.");

        delete this.parentTasks[token];
        throw error;
      });

    return await this.parentTasks[token];
  }
}
