import config from '../config';

import { IGraphContext, IGraphArgs } from '../domain/graphql';
import {
  error400Schema,
  error401Schema,
  error403Schema,
  error404Schema,
  stringArray,
  ApiMetaField,
  IApiMeta,
  IRequest,
  EApiGroup,
  EEntityOperation,
  EEntityType,
  queryMeta,
} from '../domain/service';
import { hasRole, hasPermission, EUserRole, IUser, EUserPermission } from '../domain/user';

import { IDocument, EDocumentStatics, EModelType } from '../models/mongodb/schema';
import { entityEvent } from '../models/entity';

import logger from '../services/logger';

import * as utils from './utils';

import * as Boom from 'boom';
import * as Hapi from '@hapi/hapi';
import * as Joi from '@hapi/joi';
import { schemaComposer, ResolverResolveParams } from 'graphql-compose';
import { Document, DocumentDefinition, Model, Schema } from 'mongoose';
import * as uuid_validate from 'uuid-validate';

interface ICrudOptions {
  id?:string;
  description?:string;
  params?:{ [x:string]:Joi.StringSchema; };
  payload?:Joi.ObjectSchema | Joi.ArraySchema;
  response?:Joi.ObjectSchema | Joi.ArraySchema;
  roles?:EUserRole[];
  meta?:IApiMeta;
}

const defaultSecurity = [{ jwt: [] }];

export const generateListOptions = (schema:Schema<any>, opts:ICrudOptions = {})
:Hapi.RouteOptions => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)();
  const validate = {
    query: {
      page: Joi.number().integer().min(0).max(100).description('Page number'),
      location: Joi.string().guid().description('Location ID'),
      locations: stringArray.description('Location IDs')
        .meta(queryMeta({ apis: [EApiGroup.S2S] })),
    },
    params: opts.params,
  };

  return {
    validate: {
      ...validate,
      query: null,
    },
    description: opts.description || `List ${utils.capitalize(name)}`,
    tags: ['api', name.toLowerCase()],
    plugins: {
      'hapi-swagger': {
        validate,
        id: `list${utils.capitalize(name)}`,
        security: defaultSecurity,
        [ApiMetaField]: opts.meta || { apis: [EApiGroup.Backend, EApiGroup.S2S] } as IApiMeta,
        responses: {
          '200': {
            description: 'Success',
            schema: utils.documentModel(schema, {
              operation: 'list',
            }),
          },
          '400': {
            description: Boom.badRequest().message,
            schema: error400Schema,
          },
          '401': {
            description: Boom.unauthorized().message,
            schema: error401Schema,
          },
          '403': {
            description: Boom.forbidden().message,
            schema: error403Schema,
          },
        },
      },
    },
  };
};

export const generateReadOptions = (schema:Schema<any>, opts:ICrudOptions = {})
:Hapi.RouteOptions => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)();
  const validate = {
    params: {
      id: Joi.string()
        .description(`ID of ${utils.capitalize(name)} to read`)
        .required(),
      ...opts.params,
    },
  };

  return {
    validate,
    description: opts.description || `Read ${utils.capitalize(name)}`,
    tags: ['api', name.toLowerCase()],
    plugins: {
      'hapi-swagger': {
        validate,
        id: `read${utils.capitalize(name)}`,
        security: defaultSecurity,
        [ApiMetaField]: opts.meta || { apis: [EApiGroup.Backend, EApiGroup.S2S] } as IApiMeta,
        responses: {
          '200': {
            description: 'Success',
            schema: utils.documentModel(schema, {
              operation: 'read',
            }),
          },
          '400': {
            description: Boom.badRequest().message,
            schema: error400Schema,
          },
          '403': {
            description: Boom.forbidden().message,
            schema: error403Schema,
          },
          '404': {
            description: Boom.notFound().message,
            schema: error404Schema,
          },
        },
      },
    },
  };
};

export const generateCreateOptions = (schema:Schema<any>, opts:ICrudOptions = {})
:Hapi.RouteOptions => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)();
  const validate = {
    payload: opts.payload
      ? opts.payload.required().options({ stripUnknown: true })
      : utils.documentModel(schema, {
        operation: 'write',
      }).required().options({ stripUnknown: true }),
    params: opts.params,
  };

  return {
    validate,
    description: opts.description || `Create ${utils.capitalize(name)}`,
    tags: ['api', name.toLowerCase()],
    plugins: {
      'hapi-swagger': {
        validate,
        id: `create${utils.capitalize(name)}`,
        security: defaultSecurity,
        [ApiMetaField]: opts.meta || { apis: [EApiGroup.Backend, EApiGroup.S2S] } as IApiMeta,
        responses: {
          '200': {
            description: 'Success',
            schema: utils.documentModel(schema, {
              operation: 'read',
            }),
          },
          '400': {
            description: Boom.badRequest().message,
            schema: error400Schema,
          },
          '401': {
            description: Boom.unauthorized().message,
            schema: error401Schema,
          },
          '403': {
            description: Boom.forbidden().message,
            schema: error403Schema,
          },
        },
      },
    },
  };
};

export const generateUpdateOptions = (schema:Schema<any>, opts:ICrudOptions = {})
:Hapi.RouteOptions => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)();
  const validate = {
    params: {
      id: Joi.string()
        .description(`ID of ${utils.capitalize(name)} to update`)
        .required(),
      ...opts.params,
    },
    payload: opts.payload
      ? opts.payload.required().options({ stripUnknown: true })
      : utils.documentModel(schema, {
        operation: 'write',
      }).required().options({ stripUnknown: true }),
  };

  return {
    validate,
    description: opts.description || `Update ${utils.capitalize(name)}`,
    tags: ['api', name.toLowerCase()],
    plugins: {
      'hapi-swagger': {
        validate,
        id: `update${utils.capitalize(name)}`,
        security: defaultSecurity,
        [ApiMetaField]: opts.meta || { apis: [EApiGroup.Backend, EApiGroup.S2S] } as IApiMeta,
        responses: {
          '200': {
            description: 'Success',
            schema: utils.documentModel(schema, {
              operation: 'read',
            }),
          },
          '400': {
            description: Boom.badRequest().message,
            schema: error400Schema,
          },
          '401': {
            description: Boom.unauthorized().message,
            schema: error401Schema,
          },
          '403': {
            description: Boom.forbidden().message,
            schema: error403Schema,
          },
          '404': {
            description: Boom.notFound().message,
            schema: error404Schema,
          },
        },
      },
    },
  };
};

export const generatePatchOptions = (schema:Schema<any>, opts:ICrudOptions = {})
:Hapi.RouteOptions => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)();
  const validate = {
    params: {
      id: Joi.string()
        .description(`ID of ${utils.capitalize(name)} to patch`)
        .required(),
      ...opts.params,
    },
    payload: opts.payload
      ? opts.payload.required().options({ stripUnknown: true })
      : utils.documentModel(schema, {
        operation: 'patch',
      }).required().options({ stripUnknown: true }),
  };

  return {
    validate,
    description: opts.description || `Patch ${utils.capitalize(name)}`,
    tags: ['api', name.toLowerCase()],
    plugins: {
      'hapi-swagger': {
        validate,
        id: `patch${utils.capitalize(name)}`,
        security: defaultSecurity,
        [ApiMetaField]: opts.meta || { apis: [EApiGroup.Backend, EApiGroup.S2S] } as IApiMeta,
        responses: {
          '204': {
            description: 'Success',
          },
          '400': {
            description: Boom.badRequest().message,
            schema: error400Schema,
          },
          '401': {
            description: Boom.unauthorized().message,
            schema: error401Schema,
          },
          '403': {
            description: Boom.forbidden().message,
            schema: error403Schema,
          },
          '404': {
            description: Boom.notFound().message,
            schema: error404Schema,
          },
        },
      },
    },
  };
};

export const generateDeleteOptions = (schema:Schema<any>, opts:ICrudOptions = {})
:Hapi.RouteOptions => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)();
  const validate = {
    params: {
      id: Joi.string()
        .description(`ID of ${utils.capitalize(name)} to delete`)
        .required(),
      ...opts.params,
    },
  };

  return {
    validate,
    description: opts.description || `Delete ${utils.capitalize(name)}`,
    tags: ['api', name.toLowerCase()],
    plugins: {
      'hapi-swagger': {
        validate,
        id: `remove${utils.capitalize(name)}`,
        security: defaultSecurity,
        [ApiMetaField]: opts.meta || { apis: [EApiGroup.Backend, EApiGroup.S2S] } as IApiMeta,
        responses: {
          '204': {
            description: 'Success',
          },
          '401': {
            description: Boom.unauthorized().message,
            schema: error401Schema,
          },
          '403': {
            description: Boom.forbidden().message,
            schema: error403Schema,
          },
          '404': {
            description: Boom.notFound().message,
            schema: error404Schema,
          },
        },
      },
    },
  };
};

export const generateInvokeOptions = (name:string, opts:ICrudOptions = {})
:Hapi.RouteOptions => {
  const validate = {
    payload: opts.payload,
    params: opts.params,
  };

  return {
    validate,
    description: opts.description,
    tags: ['api', name.toLowerCase()],
    plugins: {
      'hapi-swagger': {
        validate,
        id: opts.id,
        security: defaultSecurity,
        [ApiMetaField]: opts.meta || { apis: [EApiGroup.Backend, EApiGroup.S2S] } as IApiMeta,
        responses: {
          '200': {
            description: 'Success',
            schema: opts.response,
          },
          '400': {
            description: Boom.badRequest().message,
            schema: error400Schema,
          },
          '401': {
            description: Boom.unauthorized().message,
            schema: error401Schema,
          },
          '403': {
            description: Boom.forbidden().message,
            schema: error403Schema,
          },
          '404': {
            description: Boom.notFound().message,
            schema: error404Schema,
          },
        },
      },
    },
  };
};

export const createCrud = <T extends IDocument>(
  server:Hapi.Server,
  entity:Model<T, {}>,
  options:{
    methods?:('list'|'read'|'delete'|'create'|'update'|'patch')[];
    permissions?:{
      read?:EUserPermission;
      write?:EUserPermission;
    };
  } = {},
):void => {
  if (!options.methods || options.methods.includes('list')) {
    createCrudList<any>(server, entity.schema, {
      handler: async ({ query, user, select, position }) => {
        if (options.permissions?.read && !hasPermission(user, options.permissions?.read)) {
          throw Boom.forbidden();
        }

        return await entity
          .find(query, select, position)
          // .lean()
          .exec();
      },
    });
  }

  if (!options.methods || options.methods.includes('read')) {
    createCrudRead<any>(server, entity.schema, {
      handler: async ({ query, select, user }) => {
        if (options.permissions?.read && !hasPermission(user, options.permissions?.read)) {
          throw Boom.forbidden();
        }

        return await entity
          .findOne(query)
          .select(select)
          .exec();
      },
    });
  }

  if (!options.methods || options.methods.includes('delete')) {
    createCrudRemove<any>(server, entity.schema, {
      handler: async ({ query, select, user }) => {
        if (options.permissions?.write && !hasPermission(user, options.permissions?.write)) {
          throw Boom.forbidden();
        }

        return await entity
          .findOneAndRemove(query)
          .select(select)
          .exec();
      },
    });
  }

  if (!options.methods || options.methods.includes('create')) {
    createCrudCreate<any>(server, entity.schema, { handler: async ({ payload, user }) => {
      if (options.permissions?.write && !hasPermission(user, options.permissions?.write)) {
        throw Boom.forbidden();
      }

      return new entity(payload);
    } });
  }

  if (!options.methods || options.methods.includes('update')) {
    createCrudUpdate<any>(server, entity.schema, {
      handler: async ({ query, payload, user }) => {
        if (options.permissions?.write && !hasPermission(user, options.permissions?.write)) {
          throw Boom.forbidden();
        }

        return await entity
          .findOneAndUpdate(
            query,
            payload, {
              runValidators: true,
              new: true,
            },
          )
          .exec();
      },
    });
  }

  if (options.methods && options.methods.includes('patch')) {
    createCrudPatch<any>(server, entity.schema, {
      handler: async ({ query, select, payload, user }) => {
        if (options.permissions?.write && !hasPermission(user, options.permissions?.write)) {
          throw Boom.forbidden();
        }

        return await entity
          .findOneAndUpdate(
            query,
            payload, {
              projection: select,              
              runValidators: true,
              new: true,
            },
          )
          .exec();
      },
    });
  }
};

export const createCrudList = <T extends Document>(
  server:Hapi.Server,
  schema:Schema<T>,
  options:{
    path?:string;
    find?:boolean;
    route?:Hapi.RouteOptions;
    handler:GetAllHandler<T>,
    postHandler?:GetAllPostHandler<T>,
    preHandler?:GetAllPreHandler<T>,
  },
):void => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)();
  const route = options.route || generateListOptions(schema);

  server.route({
    method: 'GET',
    path: `/${name.toLowerCase()}`,
    options: route,
    handler: getAll<T>(
      schema,
      options.handler,
      options.postHandler,
      options.preHandler,
    ),
  });

  const type = utils.graphModel(schema);


  const listOperationName = `list${utils.capitalize(name)}`;
  const findOperationName = `find${utils.capitalize(name)}`;

  const resolver = utils.graphListHandler(async (request, user) => {
    return await getAllHandler(
      request,
      user,
      schema,
      options.handler,
      options.postHandler,
      options.preHandler,
    );
  });

  type.addResolver({
    kind: 'query',
    name: listOperationName,
    args: {},
    type: type.getTypeNonNull().List.getTypeNonNull(),
    resolve: async (res:ResolverResolveParams<any, IGraphContext, IGraphArgs>) => {
      return resolver(res.context, res.args, res.projection);
    },
  });

  schemaComposer.Query.addFields({
    [listOperationName]: type.getResolver(listOperationName),
  });

  if (options.find) {
    type.addResolver({
      kind: 'query',
      name: findOperationName,
      args: {
        page: 'Int',
      },
      type: type.getTypeNonNull().List.getTypeNonNull(),
      resolve: async (res:ResolverResolveParams<any, IGraphContext, IGraphArgs>) => {
        return resolver(res.context, res.args, res.projection);
      },
    });

    schemaComposer.Query.addFields({
      [findOperationName]: type.getResolver(findOperationName),
    });
  }
};

export type GetAllPreHandler<T extends Document> = (data:{
  query?:any,
  select?:{ [x:string]:boolean },
  user?:IUser,
  request?:IRequest<any>,
  state?:any,
  position?:{
    skip?:number;
    limit?:number;
  },
}) => Promise<void>;

export type GetAllHandler<T extends Document> = (data:{
  query?:any,
  select?:{ [x:string]:boolean },
  user?:IUser,
  request?:IRequest<any>,
  state?:any,
  position?:{
    skip?:number;
    limit?:number;
  },
}) => Promise<DocumentDefinition<T>[]>;

export type GetAllPostHandler<T extends Document> = (data:{
  results?:DocumentDefinition<T>[],
  user?:IUser,
  state?:any,
}) => Promise<DocumentDefinition<T>[]>;

const getAllHandler = async <T extends Document>(
  request:IRequest<void>,
  user:IUser,
  schema:Schema<T>,
  handler:GetAllHandler<T>,
  postHandler?:GetAllPostHandler<T>,
  preHandler?:GetAllPreHandler<T>,
)
:Promise<DocumentDefinition<T>[]> => {
  if (!user || (!hasRole(user, EUserRole.Backend) && !hasRole(user, EUserRole.Manager))) {
    throw Boom.forbidden('Invalid user role.');
  }

  const page = request.query.page !== undefined
    ? parseInt(request.query.page, 10)
    : undefined;
  const location = hasRole(user, EUserRole.Backend) ? request.query.location : null;
  const locations = hasRole(user, EUserRole.Backend) ?
    request.query.locations as any as string[] || [] :
    await utils.getUserLocations(user);

  if (hasRole(user, EUserRole.Backend) && locations.length === 0 && location) {
    locations.push(location);
  }

  if (!locations || locations.length === 0) {
    throw Boom.badRequest('Missing locations.');
  }

  const fields = utils.getMinimalFields(schema);
  const select = utils.handleIncludes(request, fields);
  const query = { location: { $in: locations } };
  const position = { limit: undefined, skip: undefined };
  const state = {};

  if (page !== undefined) {
    position.limit = 1000;
    position.skip = page * 1000;
  }

  if (preHandler) {
    try {
      await preHandler({ query, select, user, request, position, state });
    } catch (error) {
      throw utils.handleError(error);
    }
  }

  let results:DocumentDefinition<T>[];

  try {
    results = await handler({ query, select, user, request, position, state });
  } catch (error) {
    throw utils.handleError(error);
  }

  if (!results) {
    throw Boom.notFound();
  }

  if (Boom.isBoom(results as any)) {
    throw utils.handleError(results as any);
  }

  const includes = utils.explodeIncludes(select);

  results = results.map((x:any) => x.toJSON({ getters: true }));
  results.forEach(x => utils.prepareOutput(schema, x, includes));
  results = results.sort(utils.sort);

  if (postHandler) {
    try {
      results = await postHandler({ results, user, state });
    } catch (error) {
      throw utils.handleError(error);
    }
  }

  return results;
};

export const getAll = <T extends Document>(
  schema:Schema<T>,
  handler:GetAllHandler<T>,
  postHandler?:GetAllPostHandler<T>,
  preHandler?:GetAllPreHandler<T>,
) => {
  return utils.handler(async (request, user) => {
    return await getAllHandler(request, user, schema, handler, postHandler, preHandler);
  });
};

export const createCrudRead = <T extends Document>(
  server:Hapi.Server,
  schema:Schema<T>,
  options:{
    path?:string;
    route?:Hapi.RouteOptions;
    handler:GetHandler<T>,
  },
):void => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)().toLowerCase();
  const route = generateReadOptions(schema);

  server.route({
    method: 'GET',
    path: `/${name}/{id}`,
    options: route,
    handler: get<T>(schema, options.handler),
  });

  const model = utils.documentModel(schema, {
    operation: 'read',
  });

  const type = utils.graphModel(schema);
  const operationName = `read${utils.capitalize(name)}`;
  const resolver = utils.graphReadHandler(route, async (request, user) => {
    return await getHandler<T>(request, user, schema, model, options.handler);
  });

  const args:{ [x:string]:any } = {
    id: {
      type: 'ID!',
      description: 'Entity ID.',
    },
  };

  const params = route.plugins?.['hapi-swagger']?.validate?.params as {
    [x: string]: Joi.StringSchema;
  };

  if (params) {
    Object.keys(params).forEach((x) => {
      const param = params[x].describe();

      args[x] = {
        type: 'ID!',
        description: param.description,
      };
    });
  }

  type.addResolver({
    args,
    type: type.getTypeNonNull(),
    kind: 'query',
    name: operationName,
    resolve: async (res:ResolverResolveParams<any, IGraphContext, IGraphArgs>) => {
      return resolver(res.context, res.args, res.projection);
    },
  });

  schemaComposer.Query.addFields({
    [operationName]: type.getResolver(operationName),
  });
};

export type GetHandler<T extends Document> = (data:{
  query?:any,
  select?:{ [x:string]:boolean },
  user?:IUser,
  request?:IRequest<any>,
}) => Promise<T>;

const getHandler = async <T extends Document>(
  request:IRequest<void>,
  user:IUser,
  schema:Schema<T>,
  model:Joi.ObjectSchema<any> | Joi.ArraySchema,
  handler:GetHandler<T>,
)
:Promise<T> => {
  if (!user) {
    throw Boom.unauthorized();
  }

  if (!hasRole(user, EUserRole.Backend) && !hasRole(user, EUserRole.Manager)) {
    throw Boom.forbidden();
  }

  const isBackend = hasRole(user, EUserRole.Backend);
  const { id } = request.params;
  const locations = hasRole(user, EUserRole.Backend) ?
    null :
    await utils.getUserLocations(user);

  if (!isBackend && locations.length === 0) {
    throw Boom.badRequest('Missing location.');
  }

  if (!utils.isValidID(id)) {
    throw Boom.badRequest('Invalid ID.');
  }

  const select = utils.handleIncludes(request);
  const query:any = { _id: id };

  if (!isBackend) {
    query.location = { $in: locations };
  }

  let entity:T;

  try {
    entity = await handler({ query, select, user, request });
  } catch (error) {
    throw utils.handleError(error);
  }

  if (!entity) {
    throw Boom.notFound();
  }

  if (Boom.isBoom(entity as any)) {
    throw utils.handleError(entity as any);
  }

  const includes = utils.explodeIncludes(select);

  const output = entity.toJSON({ getters: true }) as any;

  utils.prepareOutput(schema, output, includes);

  return output;

  // const json = JSON.parse(JSON.stringify(result));
  // const validation = model.validate(json, { stripUnknown: true });

  // if (validation.errors || validation.error) {
  //   logger.warn({
  //     request,
  //     query,
  //     error: validation.error,
  //     errors: validation.errors,
  //   }, 'Reply validation error.');
  // }

  // return validation.value;
};

export const get = <T extends Document>(
  schema:Schema<T>,
  handler:GetHandler<T>,
) => {
  const model = utils.documentModel(schema, {
    operation: 'read',
  });

  return utils.handler(async (request, user) => {
    return await getHandler(request, user, schema, model, handler);
  });
};

export const createCrudRemove = <T extends Document>(
  server:Hapi.Server,
  schema:Schema<T>,
  options:{
    path?:string;
    meta?:IApiMeta;
    route?:Hapi.RouteOptions;
    handler:RemoveHandler<T>,
    postHandler?:RemovePostHandler<T>,
  },
):void => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)().toLowerCase();
  const route = options.route || generateDeleteOptions(schema);

  server.route({
    method: 'DELETE',
    path: options.path || `/${name}/{id}`,
    options: route,
    handler: remove<T>(schema, options.handler, options.postHandler),
  });

  if (options.meta?.apis && !options.meta?.apis?.includes(EApiGroup.Backend)) {
    return;
  }

  const type = utils.graphModel(schema);
  const operationName = `remove${utils.capitalize(name)}`;
  const resolver = utils.graphRemoveHandler(route, async (request, user) => {
    return await removeHandler(request, user, schema, options.handler, options.postHandler);
  });

  const args:{ [x:string]:any } = {
    id: {
      type: 'ID!',
      description: 'Entity ID.',
    },
  };

  const params = route.plugins?.['hapi-swagger']?.validate?.params as {
    [x: string]: Joi.StringSchema;
  };

  if (params) {
    Object.keys(params).forEach((x) => {
      const param = params[x].describe();

      args[x] = {
        type: 'ID!',
        description: param.description,
      };
    });
  }

  type.addResolver({
    args,
    type: utils.GRAPH_VOID_TYPE,
    kind: 'mutation',
    name: operationName,
    resolve: async (res:ResolverResolveParams<any, IGraphContext, IGraphArgs>) => {
      return resolver(res.context, res.args, res.projection);
    },
  });

  schemaComposer.Mutation.addFields({
    [operationName]: type.getResolver(operationName),
  });
};

export type RemoveHandler<T extends Document> = (data:{
  query?:any,
  select?:{ [x:string]:boolean },
  user?:IUser,
  request?:IRequest<any>,
  state?:any,
}) => Promise<T>;

export type RemovePostHandler<T extends Document> = (data:{
  result?:T,
  user?:IUser,
  state?:any,
}) => Promise<T>;

const removeHandler = async <T extends Document>(
  request:IRequest<void>,
  user:IUser,
  schema:Schema<T>,
  handler:RemoveHandler<T>,
  postHandler?:RemovePostHandler<T>,
)
:Promise<any> => {
  if (!user) {
    throw Boom.unauthorized();
  }

  if (!hasRole(user, EUserRole.Backend) && !hasRole(user, EUserRole.Manager)) {
    throw Boom.forbidden();
  }

  const isBackend = hasRole(user, EUserRole.Backend);
  const { id } = request.params;
  const location = isBackend ? undefined : user.location;

  if (!isBackend && (!location || !uuid_validate(location))) {
    throw Boom.badRequest('Invalid location.');
  }

  if (!utils.isValidID(id)) {
    throw Boom.badRequest('Invalid ID.');
  }

  const select = utils.handleIncludes(request);
  select['location'] = true;

  const query:any = { _id: id };
  const state = {};

  if (location) {
    query.location = location;
  }

  let result:T;

  try {
    result = await handler({ query, select, user, request, state });
  } catch (error) {
    throw utils.handleError(error);
  }

  if (!result) {
    throw Boom.notFound();
  }

  if (Boom.isBoom(result as any)) {
    throw utils.handleError(result as any);
  }

  if (postHandler) {
    try {
      result = await postHandler({ result, user, state });
    } catch (error) {
      throw utils.handleError(error);
    }
  }

  const output = result.toJSON({ getters: true }) as any;

  utils.prepareOutput(schema, output);

  const name = utils.getModelName(schema);

  if (name && Object.values(EEntityType).includes(name as any)) {
    const userId = hasRole(user, EUserRole.Manager) ? user.user : undefined;
    entityEvent(name as EEntityType, EEntityOperation.Delete, {
      location: output.location,
      token: id,
    }, userId);
  }

  return '';
};

export const remove = <T extends Document>(
  schema:Schema<T>,
  handler:RemoveHandler<T>,
  postHandler?:RemovePostHandler<T>,
) => {
  return utils.handler(async (request, user) => {
    return await removeHandler(request, user, schema, handler, postHandler);
  });
};

export const createCrudCreate = <T extends Document, P = T>(
  server:Hapi.Server,
  schema:Schema<T>,
  options:{
    path?:string;
    meta?:IApiMeta;
    payload?:Schema<P>,
    route?:Hapi.RouteOptions;
    handler:CreateHandler<T, P>,
    postHandler?:CreatePostHandler<T>,
  },
):void => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)().toLowerCase();
  const route = options.route || generateCreateOptions(schema, {
    payload: options.payload
      ? utils.documentModel(options.payload)
      : undefined,
    meta: options.meta,
  });

  server.route({
    method: 'POST',
    path: options.path || `/${name}`,
    options: route,
    handler: create<T, P>(schema, options.handler, options.postHandler),
  });

  if (options.meta?.apis && !options.meta?.apis?.includes(EApiGroup.Backend)) {
    return;
  }

  const type = utils.graphModel(schema);
  const inputType = utils.graphInputModel(options.payload || schema, 'write');
  const operationName = `create${utils.capitalize(name)}`;
  const resolver = utils.graphCreateHandler(route, async (request:IRequest<any>, user:IUser) => {
    return await createHandler<T, P>(request, user, schema, options.handler, options.postHandler);
  });

  const args:{ [x:string]:any } = {};

  const params = route.plugins?.['hapi-swagger']?.validate?.params as {
    [x: string]: Joi.StringSchema;
  };

  if (params) {
    Object.keys(params).forEach((x) => {
      const param = params[x].describe();

      args[x] = {
        type: 'ID!',
        description: param.description,
      };
    });
  }

  args.body = {
    type: inputType,
    description: 'Create request.',
  };

  type.addResolver({
    args,
    type: type.getTypeNonNull(),
    kind: 'mutation',
    name: operationName,
    resolve: async (res:ResolverResolveParams<any, IGraphContext, IGraphArgs>) => {
      return resolver(res.context, res.args, res.projection);
    },
  });

  schemaComposer.Mutation.addFields({
    [operationName]: type.getResolver(operationName),
  });
};

export type CreateHandler<T extends Document, P = T> = (data:{
  query?:any,
  payload?:P,
  user?:IUser,
  request?:IRequest<any>,
  state?:any,
}) => Promise<T>;

export type CreatePostHandler<T extends Document> = (data:{
  result?:T,
  user?:IUser,
  state?:any,
}) => Promise<T>;

const createHandler = async <T extends Document, P = T>(
  request:IRequest<P>,
  user:IUser,
  schema:Schema<T>,
  handler:CreateHandler<T, P>,
  postHandler?:CreatePostHandler<T>,
)
:Promise<T> => {
  if (!user) {
    throw Boom.unauthorized();
  }

  if (!hasRole(user, EUserRole.Backend) && !hasRole(user, EUserRole.Manager)) {
    throw Boom.forbidden();
  }

  const modelType = utils.getModelType(schema);

  const payload = request.payload;

  if (!payload) {
    throw Boom.badRequest('No payload.');
  }

  if (hasRole(user, EUserRole.Backend)) {
    if (schema.paths['location']) {
      const location = payload['location'];

      if (!location || !uuid_validate(location)) {
        throw Boom.badRequest('Invalid location.');
      }
    }
  } else {
    if (schema.paths['location']) {
      const location = user.location;

      if (!location || !uuid_validate(location)) {
        throw Boom.badRequest('Invalid location.');
      }

      payload['location'] = location;
    }

    if (modelType === EModelType.Document) {
      delete payload['token'];
    }
  }

  const location:string = payload['location'];

  utils.prepareCreatePayload(payload);

  const query:any = {};
  const state = {};

  let result:T;

  try {
    result = await handler({ query, payload, user, request, state });
  } catch (error) {
    throw utils.handleError(error);
  }

  if (!result) {
    throw Boom.badImplementation();
  }

  if (Boom.isBoom(result as any)) {
    throw utils.handleError(result as any);
  }

  if (modelType === EModelType.Document) {
    try {
      await result.save();
    } catch (error) {
      throw utils.handleError(error);
    }
  }

  if (postHandler) {
    try {
      result = await postHandler({ result, user, state });
    } catch (error) {
      throw utils.handleError(error);
    }
  }

  const output = result.toJSON({ getters: true }) as any;

  utils.prepareOutput(schema, output);

  const name = utils.getModelName(schema);

  if (name && Object.values(EEntityType).includes(name as any) && output.token) {
    const userId = hasRole(user, EUserRole.Manager) ? user.user : undefined;
    entityEvent(name as EEntityType, EEntityOperation.Create, {
      location,
      token: output.token,
    }, userId);
  }

  return output;
};

export const create = <T extends Document, P = T>(
  schema:Schema<T>,
  handler:CreateHandler<T, P>,
  postHandler?:CreatePostHandler<T>,
) => {
  return utils.handler(async (request:IRequest<any>, user:IUser) => {
    return await createHandler(request, user, schema, handler, postHandler);
  });
};

export const createCrudUpdate = <T extends Document, P = T>(
  server:Hapi.Server,
  schema:Schema<T>,
  options:{
    path?:string;
    meta?:IApiMeta;
    payload?:Schema<P>,
    route?:Hapi.RouteOptions;
    handler:UpdateHandler<T, P>,
    postHandler?:UpdatePostHandler<T>,
  },
):void => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)().toLowerCase();
  const route = options.route || generateUpdateOptions(schema, {
    payload: options.payload
      ? utils.documentModel(options.payload)
      : undefined,
  });

  server.route({
    method: 'PUT',
    path: options.path || `/${name}/{id}`,
    options: route,
    handler: update<T, P>(schema, options.handler, options.postHandler),
  });

  if (options.meta?.apis && !options.meta?.apis?.includes(EApiGroup.Backend)) {
    return;
  }

  const type = utils.graphModel(schema);
  const inputType = utils.graphInputModel(options.payload || schema, 'write');
  const operationName = `update${utils.capitalize(name)}`;
  const resolver = utils.graphUpdateHandler(route, async (request:IRequest<any>, user:IUser) => {
    return await updateHandler<T, P>(request, user, schema, options.handler, options.postHandler);
  });

  const args:{ [x:string]:any } = {
    id: {
      type: 'ID!',
      description: 'Entity ID.',
    },
    body: {
      type: inputType,
      description: 'Update request.',
    },
  };

  const params = route.plugins?.['hapi-swagger']?.validate?.params as {
    [x: string]: Joi.StringSchema;
  };

  if (params) {
    Object.keys(params).forEach((x) => {
      const param = params[x].describe();

      args[x] = {
        type: 'ID!',
        description: param.description,
      };
    });
  }

  type.addResolver({
    args,
    type: type.getTypeNonNull(),
    kind: 'mutation',
    name: operationName,
    resolve: async (res:ResolverResolveParams<any, IGraphContext, IGraphArgs>) => {
      return resolver(res.context, res.args, res.projection);
    },
  });

  schemaComposer.Mutation.addFields({
    [operationName]: type.getResolver(operationName),
  });
};

export type UpdateHandler<T extends Document, P = T> = (data:{
  query?:any,
  payload?:P,
  user?:IUser,
  request?:IRequest<P>,
  state?:any,
}) => Promise<T>;

export type UpdatePostHandler<T extends Document> = (data:{
  result?:T,
  user?:IUser,
  state?:any,
}) => Promise<T>;

export const updateHandler = async <T extends Document, P = T>(
  request:IRequest<P>,
  user:IUser,
  schema:Schema<T>,
  handler:UpdateHandler<T, P>,
  postHandler?:UpdatePostHandler<T>,
  options?:{
    noContent?:boolean;
  },
):Promise<T|string> => {
  if (!user) {
    throw Boom.unauthorized();
  }

  if (!hasRole(user, EUserRole.Backend) && !hasRole(user, EUserRole.Manager)) {
    throw Boom.forbidden();
  }

  const isBackend = hasRole(user, EUserRole.Backend);
  const payload = request.payload;

  if (!payload) {
    throw Boom.badRequest('No payload.');
  }

  if (!utils.isValidID(request.params.id)) {
    throw Boom.notFound('Missing ID.');
  }

  const query:any = { '_id': request.params.id };

  const location = isBackend ?
    payload['location'] :
    user.location;

  if (!isBackend && (!location || !uuid_validate(location))) {
    throw Boom.badRequest('Invalid location.');
  }

  utils.prepareUpdatePayload(payload);

  const state = {};

  if (location) {
    query.location = location;
  }

  let result:T;

  try {
    result = await handler({ query, payload, user, request, state });
  } catch (err) {
    throw utils.handleError(err);
  }

  if (!result) {
    throw Boom.notFound();
  }

  if (Boom.isBoom(result as any)) {
    throw utils.handleError(result as any);
  }

  if (postHandler) {
    try {
      result = await postHandler({ result, user, state });
    } catch (error) {
      throw utils.handleError(error);
    }
  }

  const output = result.toJSON({ getters: true }) as any;

  utils.prepareOutput(schema, output);

  const name = utils.getModelName(schema);

  if (name && Object.values(EEntityType).includes(name as any)) {
    if (!output.location) {
      throw Boom.badImplementation('Missing location.');
    }

    if (!request.params.id) {
      throw Boom.badImplementation('Missing token.');
    }

    const userId = hasRole(user, EUserRole.Manager) ? user.user : undefined;
    entityEvent(name as EEntityType, EEntityOperation.Update, {
      location: output.location,
      token: request.params.id,
    }, userId);
  }

  if (options?.noContent) {
    return '';
  }

  return output;
};

export const update = <T extends Document, P = T>(
  schema:Schema<T>,
  handler:UpdateHandler<T, P>,
  postHandler?:UpdatePostHandler<T>,
) => {
  return utils.handler(async (request:IRequest<any>, user:IUser) => {
    return await updateHandler(request, user, schema, handler, postHandler);
  });
};

export const createCrudPatch = <T extends Document, P = T>(
  server:Hapi.Server,
  schema:Schema<T>,
  options:{
    path?:string;
    meta?:IApiMeta;
    payload?:Schema<P>;
    route?:Hapi.RouteOptions;
    handler:PatchHandler<T, P>,
    postHandler?:PatchPostHandler<T>,
  },
):void => {
  const name = (schema.statics[EDocumentStatics.ModelName] as any)().toLowerCase();
  const route = options.route || generatePatchOptions(schema, {
    payload: options.payload
      ? utils.documentModel(options.payload)
      : undefined,
    meta: options.meta,
  });

  server.route({
    method: 'PATCH',
    path: options.path || `/${name}/{id}`,
    options: route,
    handler: patch<T, P>(schema, options.handler, options.postHandler),
  });

  if (options.meta?.apis && !options.meta?.apis?.includes(EApiGroup.Backend)) {
    return;
  }

  const type = utils.graphModel(schema);
  const inputType = utils.graphInputModel(options.payload || schema, 'patch');
  const operationName = `patch${utils.capitalize(name)}`;
  const resolver = utils.graphPatchHandler(route, async (request:IRequest<any>, user:IUser) => {
    return await patchHandler<T, P>(request, user, schema, options.handler, options.postHandler);
  });

  const args:{ [x:string]:any } = {
    id: {
      type: 'ID!',
      description: 'Entity ID.',
    },
    body: {
      type: inputType,
      description: 'Patch request.',
    },
  };

  const params = route.plugins?.['hapi-swagger']?.validate?.params as {
    [x: string]: Joi.StringSchema;
  };

  if (params) {
    Object.keys(params).forEach((x) => {
      const param = params[x].describe();

      args[x] = {
        type: 'ID!',
        description: param.description,
      };
    });
  }

  type.addResolver({
    args,
    type: utils.GRAPH_VOID_TYPE,
    kind: 'mutation',
    name: operationName,
    resolve: async (res:ResolverResolveParams<any, IGraphContext, IGraphArgs>) => {
      return resolver(res.context, res.args, res.projection);
    },
  });

  schemaComposer.Mutation.addFields({
    [operationName]: type.getResolver(operationName),
  });
};

export type PatchHandler<T extends Document, P = T> = (data:{
  query?:any,
  select?:{ [x:string]:boolean },
  payload?:P,
  user?:IUser,
  request?:IRequest<P>,
  state?:any,
}) => Promise<T>;

export type PatchPostHandler<T extends Document> = (data:{
  result?:T,
  user?:IUser,
  state?:any,
}) => Promise<T>;

export const patchHandler = async <T extends Document, P = T>(
  request:IRequest<P>,
  user:IUser,
  schema:Schema<T>,
  handler:PatchHandler<T, P>,
  postHandler?:PatchPostHandler<T>,
):Promise<string> => {
  if (!user) {
    throw Boom.unauthorized();
  }

  if (!hasRole(user, EUserRole.Backend) && !hasRole(user, EUserRole.Manager)) {
    throw Boom.forbidden();
  }

  const isBackend = hasRole(user, EUserRole.Backend);
  const { id } = request.params;
  const payload = request.payload;

  if (!payload) {
    throw Boom.badRequest('No payload.');
  }

  if (!utils.isValidID(id)) {
    throw Boom.badRequest('Invalid ID.');
  }

  const location = isBackend ?
    payload['location'] :
    user.location;

  if (!isBackend && (!location || !uuid_validate(location))) {
    throw Boom.badRequest('Invalid location.');
  }

  utils.preparePatchPayload(payload);

  const select = { _id: true, location: true };
  const query:any = { _id: id };
  const state = {};

  if (location) {
    query.location = location;
  }

  let result:T;

  try {
    result = await handler({ query, select, payload, user, request, state });
  } catch (err) {
    throw utils.handleError(err);
  }

  if (!result) {
    throw Boom.notFound();
  }

  if (Boom.isBoom(result as any)) {
    throw utils.handleError(result as any);
  }

  if (postHandler) {
    try {
      result = await postHandler({ result, user, state });
    } catch (error) {
      throw utils.handleError(error);
    }
  }

  const output = result.toJSON({ getters: true }) as any;

  const name = utils.getModelName(schema);

  if (name && Object.values(EEntityType).includes(name as any)) {
    const userId = hasRole(user, EUserRole.Manager) ? user.user : undefined;
    entityEvent(name as EEntityType, EEntityOperation.Update, {
      location: output.location,
      token: id,
    }, userId);
  }

  return '';
};

export const patch = <T extends Document, P = T>(
  schema:Schema<T>,
  handler:PatchHandler<T, P>,
  postHandler?:PatchPostHandler<T>,
) => {
  return utils.handler(async (request:IRequest<any>, user:IUser) => {
    return await patchHandler(request, user, schema, handler, postHandler);
  });
};

export const createCrudInvoke = <P extends Document, R extends Document>(
  server:Hapi.Server,
  payload:Schema<P>,
  response:Schema<R>,
  options:{
    method:string;
    path:string;
    route:Hapi.RouteOptions;
    handler:InvokeHandler<P, R>,
  },
):void => {
  server.route({
    method: options.method,
    path: options.path,
    options: options.route,
    handler: invoke<P, R>(options.handler),
  });

  const type = utils.graphModel(response);
  const inputType = utils.graphInputModel(payload);
  const operationName = options.route.plugins?.['hapi-swagger']?.id;
  const resolver = utils.graphInvokeHandler(
    options.route,
    async (request:IRequest<any>, user:IUser) => {
      return await invokeHandler<P, R>(request, user, options.handler);
    },
  );

  const args:{ [x:string]:any } = {
    body: {
      type: inputType,
      description: 'Invoke request.',
    },
  };

  const params = options.route.plugins?.['hapi-swagger']?.validate?.params as {
    [x: string]: Joi.StringSchema;
  };

  if (params) {
    Object.keys(params).forEach((x) => {
      const param = params[x].describe();

      args[x] = {
        type: 'ID!',
        description: param.description,
      };
    });
  }

  type.addResolver({
    args,
    type: type.getTypeNonNull(),
    kind: 'mutation',
    name: operationName,
    resolve: async (res:ResolverResolveParams<any, IGraphContext, IGraphArgs>) => {
      return resolver(res.context, res.args, res.projection);
    },
  });

  schemaComposer.Mutation.addFields({
    [operationName]: type.getResolver(operationName),
  });
};

export type InvokeHandler<P extends Document, T extends Document> = (data:{
  payload?:P,
  user?:IUser,
  request?:IRequest<P>,
}) => Promise<T>;

export const invokeHandler = async <P extends Document, R extends Document>(
  request:IRequest<any>,
  user:IUser,
  handler:InvokeHandler<P, R>,
):Promise<R> => {
  if (!user) {
    throw Boom.unauthorized();
  }

  if (!hasRole(user, EUserRole.Backend) && !hasRole(user, EUserRole.Manager)) {
    throw Boom.forbidden();
  }

  const payload = request.payload;

  if (!payload) {
    throw Boom.badRequest('No payload.');
  }

  let result:R;

  try {
    result = await handler({ payload, user, request });
  } catch (error) {
    throw utils.handleError(error);
  }

  if (!result) {
    throw Boom.badImplementation();
  }

  if (Boom.isBoom(result as any)) {
    throw utils.handleError(result as any);
  }

  const output = result.toJSON({ getters: true }) as any;

  return output;
};

export const invoke = <P extends Document, T extends Document>(
  handler:InvokeHandler<P, T>,
) => {
  return utils.handler(async (request:IRequest<P>, user:IUser) => {
    return await invokeHandler(request, user, handler);
  });
};
