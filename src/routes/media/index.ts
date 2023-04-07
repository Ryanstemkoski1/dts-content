import { EApiGroup, EEntityType, EEntityOperation } from '../../domain/service';
import { EUserRole, hasRole } from '../../domain/user';

import model from '../../models';
import {
  createSchema,
  EMediaStatus,
  updateSchema,
  patchSchema,
  schema,
  IMedia,
  IMediaCreate,
} from '../../models/mongodb/media';
import mediaWorker, { EMediaWorkerStatus } from '../../models/mongodb/media/worker';

import * as crud from '../crud';

import * as Boom from 'boom';
import * as Hapi from '@hapi/hapi';
import * as Joi from '@hapi/joi';
import * as mime from 'mime';
import * as uuid from 'uuid';

const PATH = `/${EEntityType.Media}`;

export default (server:Hapi.Server) => {
  crud.createCrud(server, model.db.Media, { methods: ['read', 'delete'] });

  crud.createCrudList(server, schema, {
    find: true,
    preHandler: async ({ query, select, user }) => {
      if (hasRole(user, EUserRole.Backend)) {
        if (Object.keys(select).length > 0) {
          select['status'] = true;
          select['error'] = true;
        }
      } else {
        query.status = EMediaStatus.Ready;
      }
    },
    handler: async ({ query, select, position }) => {
      return await model.db.Media
        .find(query, select, position)
        .exec();
    },
  });

  crud.createCrudCreate(server, schema, {
    payload: createSchema,
    handler: async ({ payload, user }) => {
      const uploader = user.user;

      if (!payload.mime && payload.name) {
        payload.mime = mime.getType(payload.name) || undefined;
      }

      if (!payload.upload && !payload.url) {
        throw Boom.badRequest('Missing URL or upload.');
      }

      if (payload.parent) {
        const parent = await model.db.Media.findById(payload.parent);

        if (!parent) {
          throw Boom.badRequest('Invalid parent.');
        }

        if (parent.location !== payload.location) {
          throw Boom.badRequest('Invalid location.');
        }
      }

      prepareInputPayload(payload);

      const token = hasRole(user, EUserRole.Backend) ? payload.token : uuid.v4();

      return new model.db.Media({
        ...payload,
        uploader,
        _id: token,
        status: EMediaStatus.Pending,
      });
    },
  });

  crud.createCrudUpdate(server, schema, {
    payload: updateSchema,
    meta: { apis: [EApiGroup.Backend] },
    handler: async ({ payload, query }) => {
      prepareInputPayload(payload);

      return await model.db.Media
        .findOneAndUpdate(query, payload, { runValidators: true, new: true })
        .exec();
    },
  });

  crud.createCrudPatch(server, schema, {
    payload: patchSchema,
    meta: { apis: [EApiGroup.S2S] },
    handler: async ({ query, select, payload }) => {
      prepareInputPayload(payload);

      return await model.db.Media
        .findOneAndUpdate(query, payload, { runValidators: true, new: true })
        .select(select)
        .exec();
    },
  });

  crud.createCrudCreate(server, mediaWorker, {
    path: `${PATH}/{id}/worker`,
    route: crud.generateCreateOptions(mediaWorker, {
      params: {
        'id': Joi.string()
          .description(`ID of Media`)
          .required(),
      },
    }),
    meta: { apis: [EApiGroup.S2S] },
    handler: async ({ query, payload, request, user }) => {
      if (!hasRole(user, EUserRole.Backend)) {
        throw Boom.forbidden();
      }

      query['_id'] = request.params.id;

      const entity = await model.db.Media
      .findOneAndUpdate(
        query,
        {
          $push: { workers: payload },
          $set: { modified: new Date() },
        },
        { new: true },
      )
      .select({
        _id: true,
        location: true,
        workers: true,
      })
      .exec();

      if (!entity) {
        throw Boom.notFound();
      }

      model.entity.entityEvent(EEntityType.Media, EEntityOperation.Update, entity.toJSON());

      return entity.workers[entity.workers.length - 1];
    },
  });

  crud.createCrudPatch(server, mediaWorker, {
    path: `${PATH}/{id}/worker/{worker}`,
    route: crud.generatePatchOptions(mediaWorker, {
      params: {
        'id': Joi.string()
          .description(`ID of Media`)
          .required(),
        'worker': Joi.string()
          .description(`ID of worker`)
          .required(),
      },
    }),
    meta: { apis: [EApiGroup.S2S] },
    handler: async ({ query, payload, user, request }) => {
      if (!hasRole(user, EUserRole.Backend)) {
        throw Boom.forbidden();
      }

      const workerId = query['workers._id'] = request.params.worker;

      const update = {
        $set: { modified: new Date() },
        $unset: Object.keys(payload['$unset'] || {}).reduce((res, k) => {
          res[`workers.$.${k}`] = true;
          return res;
        }, {}),
      };

      for (const k in payload) {
        if (k === 'token' || k === '$unset') {
          continue;
        }

        if (k === 'position' || payload[k]) {
          update.$set[`workers.$.${k}`] = payload[k];
        }
      }

      if (Object.keys(update.$unset).length === 0) {
        delete update.$unset;
      }

      const entity = await model.db.Media.findOneAndUpdate(query, update, {
        runValidators: true,
        new: true,
        projection: {
          _id: true,
          location: true,
          workers: true,
          status: true,
        },
      })
      .exec();

      const worker = entity.workers.find(x => x.token === workerId);

      if (!worker) {
        throw Boom.notFound();
      }

      if (entity.status === EMediaStatus.Processing) {
        if (payload.status === EMediaWorkerStatus.Error) {
          entity.status = EMediaStatus.Error;
          await model.db.Media.findOneAndUpdate(query, {
            status: EMediaStatus.Error,
          } as IMedia, {})
          .exec();
        } else if (payload.status === EMediaWorkerStatus.Ready) {
          const endedWorkers = entity.workers.filter(x => x.status === EMediaWorkerStatus.Ready);

          if (endedWorkers.length === entity.workers.length) {
            entity.status = EMediaStatus.Ready;
            await model.db.Media.findOneAndUpdate(query, {
              status: EMediaStatus.Ready,
            } as IMedia, {})
            .exec();
          }
        }
      }

      model.entity.entityEvent(EEntityType.Media, EEntityOperation.Update, entity.toJSON() as any);

      return worker;
    },
  });
};

export const prepareInputPayload = (entity:IMedia | IMediaCreate):void => {
  const processObj = (obj:any) => {
    Object.keys(obj).forEach((key) => {
      if (key.includes('_')) {
        const newKey = key.replace(/_/g, '-');

        obj[newKey] = obj[key];
        delete obj[key];
      }
    });
  };

  if (entity.meta) {
    processObj(entity.meta);
  }
};
