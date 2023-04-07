import * as crud from '../crud';

import { EEntityOperation, EEntityType } from '../../domain/service';
import { EUserPermission, hasPermission } from '../../domain/user';

import model from '../../models';

import { schema } from '../../models/mongodb/menu';
import menuCategory from '../../models/mongodb/menu/category';
import menuItem from '../../models/mongodb/menu/item';
import menuUpsale from '../../models/mongodb/menu/upsale';

import logger from '../../services/logger';

import * as Boom from 'boom';
import * as Hapi from '@hapi/hapi';
import * as Joi from '@hapi/joi';

const PATH = `/${EEntityType.Menu}`;

export default (server:Hapi.Server) => {
  crud.createCrud(server, model.db.Menu, {
    methods: [
      'list',
      'read',
      'delete',
    ],
    permissions: {
      write: EUserPermission.MenuEdit,
    },
  });

  crud.createCrudCreate(server, schema, { handler: async ({ payload, state, user }) => {
    if (!hasPermission(user, EUserPermission.MenuEdit)) {
      throw Boom.forbidden();
    }

    const menuId = model.mongo.generateObjectId();

    state.entries = model.entry.syncMenuEntries(
      payload.location,
      menuId.toHexString(),
      (payload.items as any[] || []),
    );

    const entity = new model.db.Menu({
      ...payload,
      _id: menuId,
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
      if (!hasPermission(user, EUserPermission.MenuEdit)) {
        throw Boom.forbidden();
      }

      const source = await model.db.Menu
        .findOne(query)
        .select({ _id: true, location: true, items: true })
        .exec();

      if (!source) {
        throw Boom.notFound();
      }

      state.entries = model.entry.syncMenuEntries(
        source.location,
        source._id.toHexString(),
        payload.items as any[] || [],
        source.items.map(x => x.toJSON({ minimize: false }) as any),
      );

      return await model.db.Menu
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

  crud.createCrudCreate(server, menuItem, {
    path: `${PATH}/{id}/item`,
    route: crud.generateCreateOptions(menuItem, {
      params: {
        'id': Joi.string()
          .description(`ID of menu`)
          .required(),
      },
    }),
    handler: async ({ query, payload, request, state, user }) => {
      if (!hasPermission(user, EUserPermission.MenuItem)) {
        throw Boom.forbidden();
      }

      const token = query['_id'] = request.params.id;

      const entity = await model.db.Menu
      .findOneAndUpdate(
        query,
        {
          $push: { items: payload },
          $set: { modified: new Date() },
        },
        { new: true },
      )
      .select({
        _id: true,
        items: true,
        location: true,
      })
      .exec();

      if (!entity) {
        throw Boom.notFound();
      }

      const item = entity.items[entity.items.length - 1];

      state.entries = model.entry.syncMenuEntries(
        entity.location, 
        token, [
          item.toJSON({ minimize: false }) as any,
        ],
      );

      model.entity.entityEvent(
        EEntityType.Menu,
        EEntityOperation.Update, {
          token,
          location: entity.location,
        },
      );

      return item;
    },
    postHandler: async ({ result, state }) => {
      model.entry.processEntries(state.entries)
      .catch((error) => {
        logger.error({ error, entries: state.entries }, 'Unable to process entries.');
      });

      return result;
    },
  });

  crud.createCrudUpdate(server, menuItem, {
    path: `${PATH}/{id}/item/{item}`,
    route: crud.generateUpdateOptions(menuItem, {
      params: {
        'id': Joi.string()
          .description(`ID of menu`)
          .required(),
        'item': Joi.string()
          .description(`ID of item`)
          .required(),
      },
    }),
    handler: async ({ query, payload, request, state, user }) => {
      if (!hasPermission(user, EUserPermission.MenuItem)) {
        throw Boom.forbidden();
      }

      const token = request.params.id;
      const itemId = query['items._id'] = request.params.item;

      const source = await model.db.Menu
        .findOne(query)
        .select({ location: true, items: { '$elemMatch': { '_id' : itemId } } })
        .exec();

      if (!source || source.items.length === 0) {
        throw Boom.notFound();
      }

      payload.token = token;

      state.entries = model.entry.syncMenuEntries(
        source.location,
        token,
        [payload as any],
        source.items.map(x => x.toJSON({ minimize: false }) as any),
      );

      const update = {
        $set: { modified: new Date() },
        $unset: Object.keys(payload['$unset'] || {}).reduce((res, k) => {
          res[`items.$.${k}`] = true;
          return res;
        }, {}),
      };

      for (const k in payload) {
        if (k === 'token' || k === '$unset') {
          continue;
        }

        update.$set[`items.$.${k}`] = payload[k];
      }

      if (Object.keys(update.$unset).length === 0) {
        delete update.$unset;
      }

      const entity = await model.db.Menu.findOneAndUpdate(query, update, {
        runValidators: true,
        new: true,
        projection: {
          _id: true,
          location: true,
          items: { '$elemMatch': { '_id' : itemId } },
        },
      })
      .exec();

      if (!entity) {
        throw Boom.notFound();
      }

      const { items: [item] } = entity;

      if (!item) {
        throw Boom.notFound();
      }

      model.entity.entityEvent(EEntityType.Menu, EEntityOperation.Update, {
        token,
        location: entity.location,
      });

      return item;
    },
    postHandler: async ({ result, state }) => {
      model.entry.processEntries(state.entries)
      .catch((error) => {
        logger.error({ error, entries: state.entries }, 'Unable to process entries.');
      });

      return result;
    },
  });

  crud.createCrudRemove(server, menuItem, {
    path: `${PATH}/{id}/item/{item}`,
    route: crud.generateDeleteOptions(menuItem, {
      params: {
        'id': Joi.string()
          .description(`ID of menu`)
          .required(),
        'item': Joi.string()
          .description(`ID of item`)
          .required(),
      },
    }),
    handler: async ({ query, request, state, user }) => {
      if (!hasPermission(user, EUserPermission.MenuItem)) {
        throw Boom.forbidden();
      }

      const token = request.params.id;
      const itemId = query['items._id'] = request.params.item;

      const entity = await model.db.Menu
      .findOneAndUpdate(
        query,
        {
          $pull: { 'items': { _id: itemId } },
          $set: { modified: new Date() },
        },
        {
          new: false,
          projection: {
            _id: true,
            location: true,
            items: { '$elemMatch': { '_id' : itemId } },
          },
        },
      )
      .exec();

      if (!entity) {
        throw Boom.notFound();
      }

      const { items: [item] } = entity;

      if (!item) {
        throw Boom.notFound();
      }

      state.entries = model.entry.syncMenuEntries(
        query.location,
        token,
        null,
        [item.toJSON() as any],
      );

      model.entity.entityEvent(EEntityType.Menu, EEntityOperation.Update, entity.toJSON());

      return item;
    },
    postHandler: async ({ result, state }) => {
      model.entry.processEntries(state.entries)
      .catch((error) => {
        logger.error({ error, entries: state.entries }, 'Unable to process entries.');
      });

      return result;
    },
  });

  crud.createCrudCreate(server, menuCategory, {
    path: `${PATH}/{id}/category`,
    route: crud.generateCreateOptions(menuCategory, {
      params: {
        'id': Joi.string()
          .description(`ID of menu`)
          .required(),
      },
    }),
    handler: async ({ query, payload, request, user }) => {
      if (!hasPermission(user, EUserPermission.MenuItem)) {
        throw Boom.forbidden();
      }

      query['_id'] = request.params.id;

      const entity = await model.db.Menu
        .findOneAndUpdate(
          query,
          {
            $push: { categories: payload },
            $set: { modified: new Date() },
          },
          { new: true },
        )
        .select({
          _id: true,
          location: true,
          categories: true,
        })
        .exec();

      if (!entity || !entity.categories) {
        throw Boom.notFound();
      }

      model.entity.entityEvent(EEntityType.Menu, EEntityOperation.Update, entity.toJSON());

      return entity.categories.pop();
    },
  });

  crud.createCrudUpdate(server, menuCategory, {
    path: `${PATH}/{id}/category/{category}`,
    route: crud.generateUpdateOptions(menuCategory, {
      params: {
        'id': Joi.string()
          .description(`ID of menu`)
          .required(),
        'category': Joi.string()
          .description(`ID of category`)
          .required(),
      },
    }),
    handler: async ({ query, payload, request, user }) => {
      if (!hasPermission(user, EUserPermission.MenuItem)) {
        throw Boom.forbidden();
      }

      const categoryId = query['categories._id'] = request.params.category;

      const update = {
        $set: { modified: new Date() },
        $unset: Object.keys(payload['$unset'] || {}).reduce((res, k) => {
          res[`categories.$.${k}`] = true;
          return res;
        }, {}),
      };

      for (const k in payload) {
        update.$set[`categories.$.${k}`] = payload[k];
      }

      if (Object.keys(update.$unset).length === 0) {
        delete update.$unset;
      }

      const entity = await model.db.Menu
      .findOneAndUpdate(query, update, {
        runValidators: true,
        new: true,
        projection: {
          _id: true,
          location: true,
          categories: { '$elemMatch': { '_id' : categoryId } },
        },
      })
      .exec();

      if (!entity) {
        throw Boom.notFound();
      }

      const { categories: [category] } = entity;

      if (!category) {
        throw Boom.notFound();
      }

      model.entity.entityEvent(EEntityType.Menu, EEntityOperation.Update, entity.toJSON() as any);

      return category;
    },
  });

  crud.createCrudRemove(server, menuCategory, {
    path: `${PATH}/{id}/category/{category}`,
    route: crud.generateDeleteOptions(menuCategory, {
      params: {
        'id': Joi.string()
          .description(`ID of menu`)
          .required(),
        'category': Joi.string()
          .description(`ID of category`)
          .required(),
      },
    }),
    handler: async ({ query, request, user }) => {
      if (!hasPermission(user, EUserPermission.MenuItem)) {
        throw Boom.forbidden();
      }

      const categoryId = query['categories._id'] = request.params.category;

      const entity = await model.db.Menu
      .findOneAndUpdate(
        query,
        {
          $pull: { categories: { _id: categoryId } },
          $set: { modified: new Date() },
        },
        {
          new: false,
          projection: {
            _id: true,
            location: true,
            categories: { '$elemMatch': { '_id' : categoryId } },
          },
        },
      )
      .exec();

      if (!entity) {
        throw Boom.notFound();
      }

      model.entity.entityEvent(EEntityType.Menu, EEntityOperation.Update, entity.toJSON() as any);

      return entity.categories[0];
    },
  });

  crud.createCrudCreate(server, menuUpsale, {
    path: `${PATH}/{id}/upsale`,
    route: crud.generateCreateOptions(menuUpsale, {
      params: {
        'id': Joi.string()
          .description(`ID of menu`)
          .required(),
      },
    }),
    handler: async ({ query, payload, request, user }) => {
      if (!hasPermission(user, EUserPermission.MenuItem)) {
        throw Boom.forbidden();
      }

      query['_id'] = request.params.id;

      const entity = await model.db.Menu
        .findOneAndUpdate(
          query,
          {
            $push: { upsales: payload },
            $set: { modified: new Date() },
          },
          { new: true },
        )
        .select({
          _id: true,
          location: true,
          upsales: true,
        })
        .exec();

      if (!entity || !entity.upsales) {
        throw Boom.notFound();
      }

      model.entity.entityEvent(EEntityType.Menu, EEntityOperation.Update, entity.toJSON());

      return entity.upsales.pop();
    },
  });

  crud.createCrudUpdate(server, menuUpsale, {
    path: `${PATH}/{id}/upsale/{upsale}`,
    route: crud.generateUpdateOptions(menuUpsale, {
      params: {
        'id': Joi.string()
          .description(`ID of menu`)
          .required(),
        'upsale': Joi.string()
          .description(`ID of upsale`)
          .required(),
      },
    }),
    handler: async ({ query, payload, request, user }) => {
      if (!hasPermission(user, EUserPermission.MenuItem)) {
        throw Boom.forbidden();
      }

      const upsaleId = query['upsales._id'] = request.params.upsale;

      const update = {
        $set: { modified: new Date() },
        $unset: Object.keys(payload['$unset'] || {}).reduce((res, k) => {
          res[`upsales.$.${k}`] = true;
          return res;
        }, {}),
      };

      for (const k in payload) {
        update.$set[`upsales.$.${k}`] = payload[k];
      }

      if (Object.keys(update.$unset).length === 0) {
        delete update.$unset;
      }

      const entity = await model.db.Menu
      .findOneAndUpdate(query, update, {
        runValidators: true,
        new: true,
        projection: {
          _id: true,
          location: true,
          upsales: { '$elemMatch': { '_id' : upsaleId } },
        },
      })
      .exec();

      if (!entity) {
        throw Boom.notFound();
      }

      const { upsales: [upsale] } = entity;

      if (!upsale) {
        throw Boom.notFound();
      }

      model.entity.entityEvent(EEntityType.Menu, EEntityOperation.Update, entity.toJSON() as any);

      return upsale;
    },
  });

  crud.createCrudRemove(server, menuUpsale, {
    path: `${PATH}/{id}/upsale/{upsale}`,
    route: crud.generateDeleteOptions(menuUpsale, {
      params: {
        'id': Joi.string()
          .description(`ID of menu`)
          .required(),
        'upsale': Joi.string()
          .description(`ID of upsale`)
          .required(),
      },
    }),
    handler: async ({ query, request, user }) => {
      if (!hasPermission(user, EUserPermission.MenuItem)) {
        throw Boom.forbidden();
      }

      const upsaleId = query['upsales._id'] = request.params.upsale;

      const entity = await model.db.Menu
      .findOneAndUpdate(
        query,
        {
          $pull: { upsales: { _id: upsaleId } },
          $set: { modified: new Date() },
        },
        {
          new: false,
          projection: {
            _id: true,
            location: true,
            upsales: { '$elemMatch': { '_id' : upsaleId } },
          },
        },
      )
      .exec();

      if (!entity) {
        throw Boom.notFound();
      }

      model.entity.entityEvent(EEntityType.Menu, EEntityOperation.Update, entity.toJSON() as any);

      return entity.upsales[0];
    },
  });
};
