import config from "../../config";

import models from "../../models";

import { QueueWatcher } from "../../services/queue";

import { IProcess } from "../base";

import { entityEventSchema } from "@triggerpointmedia/dts-microservice/domain/api";
import {
  EEntityOperation,
  EEntityType,
  IEntityEvent,
} from "@triggerpointmedia/dts-microservice/domain";

export class EntityProcess implements IProcess {
  private watcher: QueueWatcher<IEntityEvent>;

  async start() {
    this.watcher = new QueueWatcher<IEntityEvent>(config.sqs.entity_event);
    this.watcher.handle(async (event) => {
      const validated = entityEventSchema.validate(event);

      if (validated.error) {
        throw validated.error;
      }

      if (event.type !== EEntityType.Location) {
        throw new Error(`Invalid entity type: ${event.type}`);
      }

      switch (event.operation) {
        case EEntityOperation.Create:
          await models.location.locationCreated(event.token);
          break;
        case EEntityOperation.Update:
          await models.location.locationUpdated(event.token);
          break;
        case EEntityOperation.Delete:
          await models.location.locationDeleted(event.token);
          break;
        default:
          throw new Error(`Unsupported operation: ${event.operation}`);
      }
    });
  }

  async end() {
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = undefined;
    }
  }
}
