import * as Boom from 'boom';

import * as crud from '../crud';

import { EUserPermission, hasPermission } from '../../domain/user';

import model from '../../models';
import { schema } from '../../models/mongodb/modifier';

import logger from '../../services/logger';

export default (server) => {
  crud.createCrud(server, model.db.Modifier, {
    methods: [
      'list',
      'read',
      'delete',
    ],
    permissions: {
      write: EUserPermission.MenuModifier,
    },
  });

  crud.createCrudCreate(server, schema, { handler: async ({ payload, state, user }) => {
    if (!hasPermission(user, EUserPermission.MenuModifier)) {
      throw Boom.forbidden();
    }

    const modifierId = model.mongo.generateObjectId();

    state.entries = model.entry.syncModifierEntries(
      payload.location,
      modifierId.toHexString(),
      (payload.items as any[] || []),
    );

    const entity = new model.db.Modifier({
      ...payload,
      _id: modifierId,
    });

    return entity;
  }, postHandler: async ({ result, state }) => {
    model.entry.processEntries(state.entries)
      .catch((error) => {
        logger.error({ error, entries: state.entries }, 'Unable to process entries.');
      });

    return result;
  } });

  crud.createCrudUpdate(server, schema, {
    handler: async ({ query, payload, state, user }) => {
      if (!hasPermission(user, EUserPermission.MenuModifier)) {
        throw Boom.forbidden();
      }

      const source = await model.db.Modifier
        .findOne(query)
        .select({ _id: true, location: true, items: true })
        .exec();

      if (!source) {
        throw Boom.notFound();
      }

      state.entries = model.entry.syncModifierEntries(
        source.location,
        source._id.toHexString(),
        payload.items as any[] || [],
        source.items.map(x => x.toJSON({ minimize: false }) as any),
      );

      return await model.db.Modifier
        .findOneAndUpdate(query, payload, { runValidators: true, new: true })
        .exec();
    },
    postHandler: async ({ result, state }) => {
      model.entry.processEntries(state.entries)
        .catch((error) => {
          logger.error({ error, entries: state.entries }, 'Unable to process entries.');
        });

      return result;
    },
  });
};
