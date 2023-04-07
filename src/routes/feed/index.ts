import { EEntityOperation, EEntityType } from '../../domain/service';
import model from '../../models';
import {
  schema,
  patchSchema,
  postSchema,
} from '../../models/mongodb/feed';

import * as crud from '../crud';

import * as Boom from '@hapi/boom';
import * as Joi from '@hapi/joi';
import * as Hapi from '@hapi/hapi';

const PATH = `/${EEntityType.Feed}`;

export default (server:Hapi.Server) => {
  crud.createCrud(server, model.db.Feed, { methods: ['create', 'list', 'read', 'delete'] });

  crud.createCrudPatch(server, schema, {
    payload: patchSchema,
    handler: async ({ payload, query }) => {
      return await model.db.Feed
        .findOneAndUpdate(query, payload, { runValidators: true, new: true })
        .exec();
    },
  });

  crud.createCrudCreate(server, postSchema, {
    path: `${PATH}/{id}/post`,
    route: crud.generateCreateOptions(postSchema, {
      params: {
        'id': Joi.string()
          .description(`ID of Feed`)
          .required(),
      },
    }),
    handler: async ({ query, payload, request, user }) => {
      const token = query['_id'] = request.params.id;

      const entity = await model.db.Feed
      .findOneAndUpdate(
        query,
        {
          $push: { posts: payload },
          $set: { modified: new Date() },
        },
        { new: true },
      )
      .select({
        location: true,
        posts: true,
      })
      .exec();

      if (!entity || !entity.posts) {
        throw Boom.notFound();
      }

      model.entity.entityEvent(EEntityType.Feed, EEntityOperation.Update, {
        token,
        location: entity.location,
      });

      return entity.posts[entity.posts.length - 1];
    },
  });

  crud.createCrudRemove(server, postSchema, {
    path: `${PATH}/{id}/post/{post}`,
    route: crud.generateDeleteOptions(postSchema, {
      params: {
        'id': Joi.string()
          .description(`ID of Feed`)
          .required(),
        'post': Joi.string()
          .description(`ID of Post`)
          .required(),
      },
    }),
    handler: async ({ query, request, user }) => {
      const token = query['_id'];
      const postId = query['posts.id'] = request.params.post;

      const entity = await model.db.Feed
      .findOneAndUpdate(
        query,
        {
          $pull: { posts: { id: postId } },
          $set: { modified: new Date() },
        },
        {
          new: false,
          projection: {
            location: true,
            posts: { '$elemMatch': { 'id' : postId } },
          },
        },
      )
      .exec();

      if (!entity) {
        throw Boom.notFound();
      }

      model.entity.entityEvent(EEntityType.Feed, EEntityOperation.Update, {
        token,
        location: entity.location,
      });

      return entity.posts[0];
    },
  });
};
