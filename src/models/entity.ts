import {
  IEntityRequestInput,
  IEntityRequestParams,
} from "@triggerpointmedia/dts-server-client";
import config from "../config";

import { EEntityType, EEntityOperation } from "../domain/service";

import backend from "../services/backend";
import logger from "../services/logger";

export type EntityItem = {
  location: string;
  token: string;
  [x: string]: any;
};

/* istanbul ignore next */
export const entityEvent = (
  type: EEntityType,
  operation: EEntityOperation,
  entity: EntityItem,
  user?: string
): void => {
  if (config.is_testing) {
    return;
  }

  if (!entity.token || !entity.location) {
    logger.error({ entity }, "Invalid entity received.");
    return;
  }

  const send = async () => {
    switch (operation) {
      case EEntityOperation.Create:
        await backend.entity.created(type, {
          user,
          token: entity.token,
          location: entity.location,
        });
        break;
      case EEntityOperation.Update:
        await backend.entity.updated(type, {
          user,
          token: entity.token,
          location: entity.location,
        });
        break;
      case EEntityOperation.Delete:
        await backend.entity.removed(type, {
          user,
          token: entity.token,
          location: entity.location,
        });
        break;
    }
  };

  send().catch((error) => {
    logger.warn({ error }, "Event send error.");
  });
};

/* istanbul ignore next */
export const entityRequest = async (
  type: EEntityType,
  operation: EEntityOperation,
  entity: EntityItem
): Promise<void> => {
  if (config.is_testing || config.is_debug) {
    return;
  }

  if (!entity.token || !entity.location) {
    logger.error({ entity }, "Invalid entity requested.");
    return;
  }

  await backend.entity.requested(type, operation, {
    entity,
    token: entity.token,
    location: entity.location,
  });
};

/* istanbul ignore next */
export const entityRequests = async (
  type: EEntityType,
  operation: EEntityOperation,
  entities: EntityItem[]
): Promise<void> => {
  if (config.is_testing || config.is_debug) {
    return;
  }

  const inputs = entities
    .map((entity) => {
      if (!entity.token || !entity.location) {
        logger.error({ entity }, "Invalid entity requested.");
        return null;
      }

      const request: IEntityRequestInput = {
        operation,
        type,
        params: {
          entity,
          token: entity.token,
          location: entity.location,
        },
      };

      return request;
    })
    .filter((x) => x);

  await backend.entity.requestedMany(inputs);
};
