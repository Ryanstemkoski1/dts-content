import config from '../config';

import { IGraphContext, IGraphArgs, IGraphProjection, IGraphResolver } from '../domain/graphql';
import { IUser } from '../domain/user';
import {
  booleanArrayNullable,
  numberArrayNullable,
  stringArrayNullable,
  objectArrayNullable,
  IRequest,
} from '../domain/service';

import models from '../models';
import { EDocumentStatics, EModelType, IDocument, ISubDocument } from '../models/mongodb/schema';
import logger from '../services/logger';

import * as Boom from '@hapi/boom';
import * as Joi from '@hapi/joi';
import * as Hapi from '@hapi/hapi';
import {
  schemaComposer,
  EnumTypeComposer,
  ObjectTypeComposer,
  InputTypeComposer,
  NonNullComposer,
} from 'graphql-compose';
import { GraphQLDateTime } from 'graphql-iso-date';
import { isValidObjectId, Schema } from 'mongoose';
import * as uuid_validate from 'uuid-validate';

const graphqlTypes:{ [x:string]:ObjectTypeComposer } = {};
const graphqlTypesEnums:{ [x:string]:EnumTypeComposer } = {};
const graphqlTypesInputs:{ [x:string]:InputTypeComposer } = {};

const DOCUMENT_FIELDS = ['location'];
const MODIFICATION_FIELDS = ['created', 'modified'];
const TYPE_PREFIX = 'Content';

export const GRAPH_OBJECT_TYPE = schemaComposer.createScalarTC({
  name: `${TYPE_PREFIX}Object`,
  description: 'Arbitrary object',
  parseValue: (value) => {
    return typeof value === 'object' ? value
      : typeof value === 'string' ? JSON.parse(value)
      : null;
  },
  serialize: (value) => {
    return typeof value === 'object' ? value
      : typeof value === 'string' ? JSON.parse(value)
      : null;
  },
  parseLiteral: (ast) => {
    switch (ast.kind) {
      case 'StringValue': return JSON.parse(ast.value);
      case 'ObjectValue': throw new Error(`Not sure what to do with OBJECT for ObjectScalarType`);
      default: return null;
    }
  },
});

export const GRAPH_VOID_TYPE = schemaComposer.createScalarTC({
  name: `${TYPE_PREFIX}Void`,
  description: 'Represents NULL values',
  serialize: () =>  null,
  parseValue: () =>  null,
  parseLiteral: () =>  null,
});

export const handler = (
  handler:(request:IRequest<any>, user:IUser) => Promise<any>,
) => {
  return (req:Hapi.Request):Promise<any> => {
    const user = req.auth && req.auth.isAuthenticated ?
      req.auth.credentials as IUser :
      undefined;

    const request:IRequest<any> = {
      raw: req,
      query: Object.keys(req.query).reduce((res, x) => {
        res[x] = req.query[x];

        return res;
      }, {}),
      headers: {
        'x-amzn-trace-id': undefined,
      },
      params: req.params,
      payload: req.payload,
    };

    return handler(request, user)
      .catch((error) => {
        if (Boom.isBoom(error)) {
          return error;
        }

        if (config.is_testing) {
          throw error;
        }

        logger.error({ error, request }, 'Controller error.');
        throw Boom.badImplementation();
      });
  };
};

export const graphListHandler = (
  handler:(request:IRequest<any>, user:IUser) => Promise<any>,
) => {
  return (context:IGraphContext, args:IGraphArgs, projection:IGraphProjection):Promise<any> => {
    const user = context.auth && context.auth.isAuthenticated ?
      context.auth.credentials as IUser :
      undefined;

    const request:IRequest<any> = {
      raw: context.request,
      query: {},
      params: {},
      headers: {
        'x-amzn-trace-id': undefined,
      },
    };

    const projections = buildIncludes(projection);

    if (projections.length > 0) {
      request.query['include'] = projections.join(',');
    }

    if (args['page'] && args['page'] >= 0) {
      request.query['page'] = args['page'];
    }

    return handler(request, user)
      .catch((error) => {
        if (Boom.isBoom(error)) {
          return error;
        }

        if (config.is_testing) {
          throw error;
        }

        logger.error({ error, request }, 'Controller error.');
        throw Boom.badImplementation();
      });
  };
};

export const graphReadHandler = (
  route:Hapi.RouteOptions,
  handler:(request:IRequest<any>, user:IUser) => Promise<any>,
) => {
  return (context:IGraphContext, args:IGraphArgs, projection:IGraphProjection):Promise<any> => {
    const user = context.auth && context.auth.isAuthenticated ?
      context.auth.credentials as IUser :
      undefined;

    const request:IRequest<any> = {
      raw: context.request,
      query: {},
      headers: {
        'x-amzn-trace-id': undefined,
      },
      params: {
        id: args['id'],
      },
    };

    const params = route.plugins?.['hapi-swagger']?.validate?.params as {
      [x: string]: Joi.StringSchema;
    };

    if (params) {
      request.params = Object.keys(params).reduce((res, x) => {
        res[x] = args[x];
        return res;
      }, request.params);
    }

    const projections = buildIncludes(projection);

    if (projections.length > 0) {
      request.query['include'] = projections.join(',');
    }

    return handler(request, user)
      .catch((error) => {
        if (Boom.isBoom(error)) {
          return error;
        }

        if (config.is_testing) {
          throw error;
        }

        logger.error({ error, request }, 'Controller error.');
        throw Boom.badImplementation();
      });
  };
};

export const graphRemoveHandler = (
  route:Hapi.RouteOptions,
  handler:(request:IRequest<any>, user:IUser) => Promise<any>,
) => {
  return (context:IGraphContext, args:IGraphArgs, projection:IGraphProjection):Promise<any> => {
    const user = context.auth && context.auth.isAuthenticated ?
      context.auth.credentials as IUser :
      undefined;

    const request:IRequest<any> = {
      raw: context.request,
      query: {},
      headers: {
        'x-amzn-trace-id': undefined,
      },
      params: {
        id: args['id'],
      },
    };

    const params = route.plugins?.['hapi-swagger']?.validate?.params as {
      [x: string]: Joi.StringSchema;
    };

    if (params) {
      request.params = Object.keys(params).reduce((res, x) => {
        res[x] = args[x];
        return res;
      }, request.params);
    }

    return handler(request, user)
      .catch((error) => {
        if (Boom.isBoom(error)) {
          return error;
        }

        if (config.is_testing) {
          throw error;
        }

        logger.error({ error, request }, 'Controller error.');
        throw Boom.badImplementation();
      });
  };
};

export const graphCreateHandler = (
  route:Hapi.RouteOptions,
  handler:(request:IRequest<any>, user:IUser) => Promise<any>,
) => {
  return (context:IGraphContext, args:IGraphArgs, projection:IGraphProjection):Promise<any> => {
    const user = context.auth && context.auth.isAuthenticated ?
      context.auth.credentials as IUser :
      undefined;

    const request:IRequest<any> = {
      raw: context.request,
      query: {},
      headers: {
        'x-amzn-trace-id': undefined,
      },
      params: {},
      payload: args['body'],
    };

    const params = route.plugins?.['hapi-swagger']?.validate?.params as {
      [x: string]: Joi.StringSchema;
    };

    if (params) {
      request.params = Object.keys(params).reduce((res, x) => {
        res[x] = args[x];
        return res;
      }, request.params);
    }

    const projections = buildIncludes(projection);

    if (projections.length > 0) {
      request.query['include'] = projections.join(',');
    }

    return handler(request, user)
      .catch((error) => {
        if (Boom.isBoom(error)) {
          return error;
        }

        if (config.is_testing) {
          throw error;
        }

        logger.error({ error, request }, 'Controller error.');
        throw Boom.badImplementation();
      });
  };
};

export const graphUpdateHandler = (
  route:Hapi.RouteOptions,
  handler:(request:IRequest<any>, user:IUser) => Promise<any>,
) => {
  return (context:IGraphContext, args:IGraphArgs, projection:IGraphProjection):Promise<any> => {
    const user = context.auth && context.auth.isAuthenticated ?
      context.auth.credentials as IUser :
      undefined;

    const request:IRequest<any> = {
      raw: context.request,
      query: {},
      headers: {
        'x-amzn-trace-id': undefined,
      },
      params: {
        id: args['id'],
      },
      payload: args['body'],
    };

    const params = route.plugins?.['hapi-swagger']?.validate?.params as {
      [x: string]: Joi.StringSchema;
    };

    if (params) {
      request.params = Object.keys(params).reduce((res, x) => {
        res[x] = args[x];
        return res;
      }, request.params);
    }

    const projections = buildIncludes(projection);

    if (projections.length > 0) {
      request.query['include'] = projections.join(',');
    }

    return handler(request, user)
      .catch((error) => {
        if (Boom.isBoom(error)) {
          return error;
        }

        if (config.is_testing) {
          throw error;
        }

        logger.error({ error, request }, 'Controller error.');
        throw Boom.badImplementation();
      });
  };
};

export const graphPatchHandler = (
  route:Hapi.RouteOptions,
  handler:(request:IRequest<any>, user:IUser) => Promise<any>,
) => {
  return (context:IGraphContext, args:IGraphArgs, projection:IGraphProjection):Promise<any> => {
    const user = context.auth && context.auth.isAuthenticated ?
      context.auth.credentials as IUser :
      undefined;

    const request:IRequest<any> = {
      raw: context.request,
      query: {},
      headers: {
        'x-amzn-trace-id': undefined,
      },
      params: {
        id: args['id'],
      },
      payload: args['body'],
    };

    const params = route.plugins?.['hapi-swagger']?.validate?.params as {
      [x: string]: Joi.StringSchema;
    };

    if (params) {
      request.params = Object.keys(params).reduce((res, x) => {
        res[x] = args[x];
        return res;
      }, request.params);
    }

    return handler(request, user)
      .catch((error) => {
        if (Boom.isBoom(error)) {
          return error;
        }

        if (config.is_testing) {
          throw error;
        }

        logger.error({ error, request }, 'Controller error.');
        throw Boom.badImplementation();
      });
  };
};

export const graphInvokeHandler = (
  route:Hapi.RouteOptions,
  handler:(request:IRequest<any>, user:IUser) => Promise<any>,
) => {
  return (context:IGraphContext, args:IGraphArgs, projection:IGraphProjection):Promise<any> => {
    const user = context.auth && context.auth.isAuthenticated ?
      context.auth.credentials as IUser :
      undefined;

    const request:IRequest<any> = {
      raw: context.request,
      query: {},
      headers: {
        'x-amzn-trace-id': undefined,
      },
      params: {},
      payload: args['body'],
    };

    const params = route.plugins?.['hapi-swagger']?.validate?.params as {
      [x: string]: Joi.StringSchema;
    };

    if (params) {
      request.params = Object.keys(params).reduce((res, x) => {
        res[x] = args[x];
        return res;
      }, request.params);
    }

    return handler(request, user)
      .catch((error) => {
        if (Boom.isBoom(error)) {
          return error;
        }

        if (config.is_testing) {
          throw error;
        }

        logger.error({ error, request }, 'Controller error.');
        throw Boom.badImplementation();
      });
  };
};

export const getModelName = (schema:Schema<any>):string|undefined => {
  return schema.statics[EDocumentStatics.ModelName] ?
    (schema.statics[EDocumentStatics.ModelName] as any)() :
    undefined;
};

export const getModelType = (schema:Schema<any>):EModelType => {
  return schema.statics[EDocumentStatics.ModelType] ?
    (schema.statics[EDocumentStatics.ModelType] as any)() :
    EModelType.Object;
};

export const getMinimalFields = (schema:Schema<any>):Includes => {
  const fields:string[] = schema.statics[EDocumentStatics.MinimalFields] ?
      (schema.statics[EDocumentStatics.MinimalFields] as any)() :
      [];

  return fields.reduce((res, x) => {
    res[x] = true;
    return res;
  }, {});
};

export const prepareOutput = (schema:Schema<any>, obj:any, includes?:IncludesTree):void => {
  const type = getModelType(schema);

  switch (type) {
    case EModelType.Document:
      const document:IDocument = obj;
      document.created = document.created || new Date();
      document.modified = document.modified || new Date();
      break;
    case EModelType.Subdocument:
      const subdocument:ISubDocument = obj;
      subdocument.modified = subdocument.modified || new Date();
      break;
  }

  Object.keys(obj).forEach((x) => {
    if (includes && !includes[x]) {
      return;
    }

    const value = obj[x];

    if (!value) {
      return;
    }

    if (value instanceof Date) {
      obj[x] = (value as Date).toISOString();
    } else if (typeof value === 'object') {
      const mongooseProp:any = schema.paths[x];

      if (!mongooseProp) {
        return;
      }

      if (mongooseProp.instance === 'Array') {
        if (mongooseProp.schema) {
          (value as []).forEach(val => prepareOutput(
            mongooseProp.schema,
            val,
            includes ? includes[x] as IncludesTree : undefined,
          ));
        } else {
          switch (true) {
            case mongooseProp.options?.type[0]?.schemaName === 'ObjectId':
              obj[x] = (value as any[]).map(val => val.toString());
              break;
          }
        }
      } else if (mongooseProp.instance === 'Embedded') {
        prepareOutput(
          mongooseProp.schema,
          value,
          includes ? includes[x] as IncludesTree : undefined,
        );
      } else if (mongooseProp.instance === 'ObjectID') {
        obj[x] = value.toString();
      }
    }
  });

  Object.keys(includes || obj).forEach((x) => {
    const value = obj[x];

    if (value === null || value === undefined) {
      const mongooseProp:any = schema.paths[x];

      if (mongooseProp?.options?.default !== undefined) {
        obj[x] = mongooseProp?.options?.default;
      }
    }
  });
};

export const buildIncludes = (projections:IGraphProjection):string[] => {
  const process = (projections:IGraphProjection, prefix:string = '', depth:number = 0) => {
    return (res:string[], x:string):string[] => {
      const item = projections[x];

      const pref = prefix !== '' ? `${prefix}.` : '';

      if (Object.keys(item).length === 0) {
        if (x === '__typename') {
          return res;
        }

        if (x === 'token') {
          res.push(`${pref}_id`);
        }

        res.push(`${pref}${x}`);

        if (x.includes('_')) {
          const y = x.replace(/_/g, '-');
          res.push(`${pref}${y}`);
        }
      } else {
        if (depth >= 2) {
          res.push(`${pref}${x}`);

          if (x.includes('_')) {
            const y = x.replace(/_/g, '-');
            res.push(`${pref}${y}`);
          }
        } else {
          return Object.keys(item)
            .reduce(process(item, `${pref}${x}`, depth + 1), res);
        }
      }

      return res;
    };
  };

  return Object.keys(projections)
    .reduce(process(projections), [] as string[]);
};

export const handleIncludes = (
  request:IRequest<any>,
  select:Includes = {},
):Includes => {
  if (request.query.include) {
    return request.query.include
      .split(',')
      .reduce((res, x) => {
        res[x] = true;
        return res;
      }, {});
  }

  return { ...select };
};

export type Includes = {
  [x:string]:boolean;
}

export type IncludesTree = {
  [x:string]:boolean | IncludesTree;
}

export const explodeIncludes = (select:Includes):IncludesTree => {
  const result:IncludesTree = {};

  Object.keys(select)
    .forEach((key) => {
      if (key.includes('.')) {
        const subkeys = key.split('.');

        subkeys.reduce((res, x, i, list) => {
          if (!res[x]) {
            res[x] = i !== list.length - 1 ? {} : true;
          }

          return res[x];
        }, result);
      } else {
        result[key] = true;
      }
    });

  return result;
};

export const handleError = (err:Error):Error => {
  if (Boom.isBoom(err)) {
    if (err.data) {
      Object.keys(err.data).forEach(x => err.output.payload[x] = err.data[x]);
    }

    return err;
  }

  if (err.name === 'ValidationError') {
    const errors = Object.keys(err['errors']);

    const response = Boom.badRequest(err.message);

    if (errors.length > 0) {
      const error = err['errors'][errors[0]];

      if (error) {
        response.output.payload['attributes'] = { argument: error.path };
        response.output.payload.message = error.message;
      }
    }

    return response;
  }

  throw err;
};

export const graphModel = (
  schema:Schema<any>,
  operation?:'list',
):ObjectTypeComposer => {
  const name = capitalize((schema.statics[EDocumentStatics.ModelName] as any)());
  let postfix = '';

  switch (operation) {
    case 'list':
      postfix = 'Part';
      break;
  }

  const modelName = TYPE_PREFIX + name + postfix;

  let type = graphqlTypes[modelName];

  if (type) {
    return type;
  }

  const fields = getGraphFields(schema, operation);

  type = graphqlTypes[modelName] = schemaComposer
    .createObjectTC({
      fields,
      name: modelName,
    });
    // .setDirectives([{ name: 'key', args: { fields: 'token' } }]);

  return type;
};

export const graphInputModel = (
  schema:Schema<any>,
  operation?:'write'|'patch',
):NonNullComposer<InputTypeComposer> => {
  const suffix = capitalize(operation || '');
  let modelName = `${TYPE_PREFIX}${capitalize((schema.statics[EDocumentStatics.ModelName] as any)())}`;

  const suffixes = [
    'write',
    'create',
    'update',
    'patch',
  ];

  if (!suffixes.find(s => modelName.toLowerCase().endsWith(s))) {
    modelName += suffix;
  }

  let type = graphqlTypesInputs[modelName];

  if (type) {
    return type.NonNull;
  }

  type = graphqlTypesInputs[modelName] = schemaComposer.createInputTC({
    name: modelName,
    fields: {},
  });

  const fields = getGraphFields(schema, operation || 'write');
  type.addFields(fields);

  return type.NonNull;
};

const getGraphFields = (
  schema:Schema<any>,
  operation?:'list'|'read'|'write'|'patch',
):{ [x:string]:any; } => {
  let suffix = '';

  switch (operation) {
    case 'read':
    case 'list':
      operation = undefined;
      break;
    case 'write':
      suffix = 'Write';
      break;
    case 'patch':
      suffix = 'Patch';
      break;
  }

  const subsuffix = operation === 'write' || operation === 'patch' ?
    suffix :
    '';
  const modelType = getModelType(schema);
  const modelName = capitalize((schema.statics[EDocumentStatics.ModelName] as any)());

  const fields = Object.keys(schema.paths)
  .map(x => schema.paths[x] as any)
  .filter(x => !x.path.includes('$') && !x.path.includes('.'))
  .reduce((result, mongooseProp) => {
    let name:string = mongooseProp.path;

    switch (name) {
      case '_id':
        if (modelType === EModelType.Document) {
          if (operation === 'write') {
            return result;
          }
        }

        name = 'token';
        break;
      case '__v':
        return result;
    }

    const originalName = name;
    name = name.replace(/-/g, '_');

    if (result[name]) {
      return result;
    }

    if (mongooseProp.instance === 'Array') {
      if (mongooseProp.schema) {
        const itemname = TYPE_PREFIX +
          capitalize(mongooseProp.schema.statics[EDocumentStatics.ModelName]()) +
          subsuffix;

        if (!operation) {
          if (!graphqlTypes[itemname]) {
            graphqlTypes[itemname] = schemaComposer.createObjectTC({
              name: itemname,
              fields: getGraphFields(mongooseProp.schema, operation),
            });
          }
        } else {
          if (!graphqlTypesInputs[itemname]) {
            graphqlTypesInputs[itemname] = schemaComposer.createInputTC({
              name: itemname,
              fields: getGraphFields(mongooseProp.schema, operation),
            });
          }
        }

        result[name] = { type: `[${itemname}!]` };
      } else {
        const suffix = mongooseProp.options.required ? '!' : '';

        switch (true) {
          case !mongooseProp.options.type[0]:
          case mongooseProp.options.type[0].schemaName === 'Map':
          case mongooseProp.options.type[0].schemaName === 'Mixed':
            result[name] = { type: `[${GRAPH_OBJECT_TYPE.getTypeName()}${suffix}]` };
            break;
          case mongooseProp.options.type[0] === Boolean || mongooseProp.options.type[0] === 'Boolean':
            result[name] = { type: `[Boolean${suffix}]` };
            break;
          case mongooseProp.options.type[0] === Number || mongooseProp.options.type[0] === 'Number':
            result[name] = { type: `[Float${suffix}]` };
            break;
          case mongooseProp.options.type[0] === String || mongooseProp.options.type[0] === 'String':
            result[name] = { type: `[String${suffix}]` };
            break;
          case mongooseProp.options.type[0].schemaName === 'ObjectId':
            result[name] = { type: `[ID${suffix}]` };
            break;
          default:
            console.log(mongooseProp.options.type)
            throw new Error(`Unsupported array item type: ${name}`);
        }
      }
    } else if (mongooseProp.instance === 'Embedded') {
      const itemname = TYPE_PREFIX +
        capitalize(mongooseProp.schema.statics[EDocumentStatics.ModelName]()) +
        subsuffix;

      if (!operation) {
        if (!graphqlTypes[itemname]) {
          graphqlTypes[itemname] = schemaComposer.createObjectTC({
            name: itemname,
            fields: getGraphFields(mongooseProp.schema, operation),
          });
        }
      } else {
        if (!graphqlTypesInputs[itemname]) {
          graphqlTypesInputs[itemname] = schemaComposer.createInputTC({
            name: itemname,
            fields: getGraphFields(mongooseProp.schema, operation),
          });
        }
      }

      result[name] = { type: itemname };
    } else if (mongooseProp.instance === 'ObjectID') {
      result[name] = { type: 'ID' };
    } else if (mongooseProp.instance === 'Date') {
      result[name] = { type: GraphQLDateTime };
    } else if (mongooseProp.instance === 'String') {
      if (name === 'token') {
        result[name] = { type: 'ID' };
      } else {
        result[name] = { type: 'String' };

        // TODO: enable
        // if (mongooseProp.enumValues && mongooseProp.enumValues.length > 0) {
        //   const enumName = mongooseProp.options.alias ||
        // `E${TYPE_PREFIX}${modelName}${capitalize(name)}`;

        //   if (!graphqlTypesEnums[enumName]) {
        //     graphqlTypesEnums[enumName] = schemaComposer.createEnumTC({
        //       name: enumName,
        //       values: mongooseProp.enumValues
        //       .filter(x => x)
        //       .reduce((res, x, i) => {
        //         const value = x.toLowerCase().replace(/-/g, '_');
        //         res[value] = { value: x };
        //         return res;
        //       }, {}),
        //     });
        //   }

        //   result[name] = { type: enumName };
        // }
      }
    } else if (mongooseProp.instance === 'Number') {
      result[name] = { type: 'Float' };
    } else if (mongooseProp.instance === 'Boolean') {
      result[name] = { type: 'Boolean' };
    } else if (mongooseProp.instance === 'Map') {
      result[name] = { type: GRAPH_OBJECT_TYPE.getTypeName() };
    } else if (mongooseProp.instance === 'Mixed') {
      result[name] = { type: GRAPH_OBJECT_TYPE.getTypeName() };
    } else {
      throw new Error(`Unsupported item type: ${name} - ${mongooseProp.instance}`);
    }

    if (!operation && name !== originalName) {
      result[name].resolve = source => source[originalName];
    }

    if (mongooseProp.options?.description) {
      result[name].description = mongooseProp.options?.description;
    }

    if (operation === 'write' || operation === 'patch') {
      if (mongooseProp.options.required) {
        if (DOCUMENT_FIELDS.includes(name)) {
          delete result[name];
        } else if (MODIFICATION_FIELDS.includes(name)) {
          if (modelType === EModelType.Document) {
            delete result[name];
          }
        } else if (name === 'token') {
          if (modelType === EModelType.Document) {
            delete result[name];
          } else if (modelType === EModelType.Subdocument) {
          } else {
            if (operation !== 'patch') {
              result[name].type += '!';
            }
          }
        } else {
          if (operation !== 'patch') {
            result[name].type += '!';
          }
        }
      } else if (name === 'token') {
        if (modelType === EModelType.Document || modelType === EModelType.Object) {
          if (!mongooseProp.options?.validate) {
            delete result[name];
          }
        }
      }
    } else {
      if (mongooseProp.options?.required) {
        result[name].type += '!';
      } else if (name === 'token') {
        if (modelType === EModelType.Document || modelType === EModelType.Subdocument) {
          result[name].type += '!';
        }
      }
    }

    return result;
  }, {} as { [x:string]:any; });

  if (!operation) {
    const resolvers = (schema.statics[EDocumentStatics.GraphResolvers] as any)() as IGraphResolver[];

    resolvers.forEach((resolver) => {
      if (fields[resolver.field]) {
        throw new Error(`Resolver cannot overwite a field: ${resolver.field}`);
      }

      const typeName = `${TYPE_PREFIX}${capitalize(resolver.type.toString())}`;
      fields[resolver.field] = schemaComposer.createResolver({
        name: fields,
        description: resolver.description,
        type: typeName,
        resolve: async ({ projection, source }) => {
          const select = buildIncludes(projection)
            .reduce((res, x) => {
              res[x] = true;
              return res;
            }, {});

          if (resolver.dependencies) {
            resolver.dependencies.forEach((x) => {
              if (!select[x]) {
                select[x] = true;
              }
            });
          }

          const input = {
            select,
            parent: source,
            db: models.db,
          };
          return await resolver.method(input);
        },
      });
    });
  }

  return fields;
};

export const documentModel = (
  schema:Schema<any>,
  options:{
    operation:'list'|'read'|'write'|'patch'|'invoke',
  } = {
    operation: 'invoke',
  },
):Joi.ObjectSchema | Joi.ArraySchema => {
  let suffix = '';
  let modelSuffix = '';

  switch (options.operation) {
    case 'list':
      modelSuffix = 'Part';
      break;
    case 'write':
      modelSuffix = suffix = 'Write';
      break;
    case 'patch':
      modelSuffix = 'Patch';
      suffix = 'Write';
      break;
  }

  const modelName = capitalize((schema.statics[EDocumentStatics.ModelName] as any)());
  const name = `${TYPE_PREFIX}${modelName}${modelSuffix}`;
  const item = Joi.object({}).label(name).meta({ className: name });

  const result = pathsToSchema(item, schema, { suffix, operation: options.operation });

  if (options.operation === 'list') {
    const listname = `${TYPE_PREFIX}${modelName}List`;
    return Joi.array().label(listname).items(result);
  }

  return result;
};

export const capitalize = (string:string):string => {
  return (string.charAt(0).toUpperCase() + string.slice(1))
    .replace(/_\w/g, x => x.charAt(1).toUpperCase() + x.slice(2));
};

function pathsToSchema(
  parent:Joi.ObjectSchema,
  schema:any,
  options:{
    suffix?:string,
    operation?:'list'|'read'|'write'|'patch'|'invoke',
  } = {},
)
:Joi.ObjectSchema {
  const fields:string[] = options.operation === 'list' &&
    schema.statics[EDocumentStatics.MinimalFields] ?
      schema.statics[EDocumentStatics.MinimalFields]() :
      undefined;
  const modelType = getModelType(schema);

  const suboptions = {
    ...options,
  };

  if (suboptions.operation === 'patch') {
    suboptions.operation = 'write';
  }

  if (options.operation === 'read') {
    const resolvers:IGraphResolver[] = schema.statics[EDocumentStatics.GraphResolvers]
      ? schema.statics[EDocumentStatics.GraphResolvers]()
      : undefined;

    if (resolvers) {
      parent = resolvers.reduce((result:Joi.ObjectSchema, resolver) => {
        if (fields?.length > 0 && resolver.dependencies?.length > 0) {
          if (
            resolver.dependencies.length !==
            resolver.dependencies.filter(x => fields.includes(x)).length
          ) {
            return result;
          }
        }

        const data:{
          [x:string]:Joi.AnySchema | Joi.ObjectSchema | Joi.ArraySchema
            | Joi.StringSchema | Joi.NumberSchema | Joi.BooleanSchema;
        } = {};

        return result.append(data);
      }, parent);
    }
  }

  return Object.keys(schema.paths)
  .filter(x => !fields || fields.includes(x))
  .map(x => schema.paths[x])
  .reduce((result:Joi.ObjectSchema, mongooseProp) => {
    let name = mongooseProp.path;
    const data:{
      [x:string]:Joi.ObjectSchema | Joi.ArraySchema | Joi.StringSchema |
        Joi.NumberSchema | Joi.BooleanSchema;
    } = {};

    switch (name) {
      case '_id':
        name = 'token';
        break;
      case '__v':
        return result;
    }

    let forceRequired = false;

    if (name === 'token') {
      if (
        modelType === EModelType.Object &&
        !mongooseProp.options?.required &&
        !mongooseProp.options?.validate
      ) {
        return result;
      }

      switch (options.operation) {
        case 'write':
          if (!mongooseProp.options?.required) {
            // return result;
          }
          break;
        case 'list':
        case 'read':
          forceRequired = true;
          break;
        case 'invoke':
          break;
        case 'patch':
          if (!mongooseProp.options?.required) {
            return result;
          }
          break;
        default:
          break;
      }
    }

    if (mongooseProp.instance === 'Array') {
      if (mongooseProp.schema) {
        const itemname = capitalize(mongooseProp.schema.statics[EDocumentStatics.ModelName]());

        const schemaname = `${TYPE_PREFIX}${itemname}${options.suffix || ''}`;
        const schemasname = `${schemaname}List`;

        const item = Joi.object().label(schemaname).meta({ className: schemaname });
        const result = pathsToSchema(item, mongooseProp.schema, suboptions);

        data[name] = Joi.array()
          .items(result)
          .label(schemasname);

        if (options.operation === 'write' || options.operation === 'patch') {
          data[name] = data[name].allow(null);
        } else {
          data[name] = data[name].empty(null);
        }
      } else {
        switch (true) {
          case !mongooseProp.options.type[0]:
          case mongooseProp.options.type[0].schemaName === 'Mixed':
            data[name] = objectArrayNullable;

            if (options.operation === 'write' || options.operation === 'patch') {
              data[name] = data[name].allow(null);
            } else {
              data[name] = data[name].empty(null);
            }
            break;
          case mongooseProp.options.type[0] === Boolean || mongooseProp.options.type[0] === 'Boolean':
            data[name] = booleanArrayNullable;

            if (options.operation === 'write' || options.operation === 'patch') {
              data[name] = data[name].allow(null);
            } else {
              data[name] = data[name].empty(null);
            }
            break;
          case mongooseProp.options.type[0] === Number || mongooseProp.options.type[0] === 'Number':
            data[name] = numberArrayNullable;

            if (options.operation === 'write' || options.operation === 'patch') {
              data[name] = data[name].allow(null);
            } else {
              data[name] = data[name].empty(null);
            }
            break;
          case mongooseProp.options.type[0] === String || mongooseProp.options.type[0] === 'String':
          case mongooseProp.options.type[0].schemaName === 'ObjectId':
            data[name] = stringArrayNullable;

            if (options.operation === 'write' || options.operation === 'patch') {
              data[name] = data[name].allow(null);
            } else {
              data[name] = data[name].empty(null);
            }
            break;
          default:
            throw new Error(`Unsupported array item type: ${name}`);
        }
      }
    } else if (mongooseProp.instance === 'Embedded') {
      const itemname:string = capitalize(mongooseProp.schema.statics[EDocumentStatics.ModelName]());
      const schemaname = `${TYPE_PREFIX}${itemname}${options.suffix || ''}`;

      const item = Joi.object().label(schemaname).meta({ className: schemaname });
      data[name] = pathsToSchema(item, mongooseProp.schema, suboptions);

      if (options.operation === 'write' || options.operation === 'patch') {
        data[name] = data[name].allow(null);
      } else {
        data[name] = data[name].empty(null);
      }
    } else if (mongooseProp.instance === 'ObjectID') {
      data[name] = Joi.string();

      if (options.operation === 'write' || options.operation === 'patch') {
        data[name] = data[name].allow(null);
      } else {
        data[name] = data[name].empty(null);
      }
    } else if (mongooseProp.instance === 'Date') {
      data[name] = Joi.string().isoDate();

      if (options.operation === 'write' || options.operation === 'patch') {
        data[name] = data[name].allow(null);
      } else {
        data[name] = data[name].empty(null);
      }
    } else if (mongooseProp.instance === 'String') {
      data[name] = Joi.string();

      if (options.operation === 'write' || options.operation === 'patch') {
        data[name] = data[name].allow(null, '');
      } else {
        data[name] = data[name].empty([null, '']);
      }

      // if (mongooseProp.options?.default) {
      //   data[name] = data[name].default(mongooseProp.options?.default);
      // }

      if (mongooseProp.enumValues && mongooseProp.enumValues.length > 0) {
        data[name] = data[name].valid(...mongooseProp.enumValues);

        if (mongooseProp.options?.default) {
          data[name] = data[name].default(mongooseProp.options?.default);
        }
      }
    } else if (mongooseProp.instance === 'Number') {
      data[name] = Joi.number();

      if (options.operation === 'write' || options.operation === 'patch') {
        data[name] = data[name].allow(null);
      } else {
        data[name] = data[name].empty(null);
      }

      // if (mongooseProp.options?.default) {
      //   data[name] = data[name].default(mongooseProp.options?.default);
      // }
    } else if (mongooseProp.instance === 'Boolean') {
      data[name] = Joi.boolean();

      if (options.operation === 'write' || options.operation === 'patch') {
        data[name] = data[name].allow(null);
      } else {
        data[name] = data[name].empty(null);
      }

      // if (mongooseProp.options?.default) {
      //   data[name] = data[name].default(mongooseProp.options?.default);
      // }
    } else if (mongooseProp.instance === 'Map') {
      data[name] = Joi.object().label('Object');

      if (options.operation === 'write' || options.operation === 'patch') {
        data[name] = data[name].allow(null);
      } else {
        data[name] = data[name].empty(null);
      }
    } else if (mongooseProp.instance === 'Mixed') {
      data[name] = Joi.object().label('Object');

      if (options.operation === 'write' || options.operation === 'patch') {
        data[name] = data[name].allow(null);
      } else {
        data[name] = data[name].empty(null);
      }
    } else {
      throw new Error(`Unsupported item type: ${name} - ${mongooseProp.instance}`);
    }

    if (data[name]) {
      if (forceRequired) {
        data[name] = data[name].required();
      }

      if (mongooseProp.options) {
        // TODO: fix
        if (mongooseProp.options.description &&
            mongooseProp.instance !== 'Array' &&
            mongooseProp.instance !== 'Embedded'
        ) {
          data[name] = data[name].description(mongooseProp.options.description);
        }

        if (options.operation === 'write') {
          if (mongooseProp.options.required) {
            if (DOCUMENT_FIELDS.includes(name)) {
              // delete data[name];
              // Keep field optional
            } else if (MODIFICATION_FIELDS.includes(name)) {
              // Keep field optional
            } else {
              data[name] = data[name].required();
            }
          } else {
            data[name] = data[name].allow(null);
          }
        } else if (options.operation === 'patch') {
          // Skip required
        } else {
          if (mongooseProp.options.required) {
            data[name] = data[name].required();
          } else {
            data[name] = data[name].empty(null);
          }
        }
      }
    }

    return result.append(data);
  }, parent);
}

export const sort = (a:any, b:any):number => {
  if (a.position < b.position) {
    return -1;
  }

  if (a.position > b.position) {
    return 1;
  }

  return 0;
};

const objectIdExp = new RegExp("^[0-9a-fA-F]{24}$");

export const isValidID = (value:string) => {
  return value && (objectIdExp.test(value) || uuid_validate(value));
};

export const getUserLocations = async (user:IUser):Promise<string[]> => {
  const locations = [];

  if (!user.location) {
    throw new Error('User has no location.');
  }

  locations.push(user.location);

  if (user.business && user.location !== user.business) {
    locations.push(user.business);

    if (user.location !== config.realm) {
      locations.push(config.realm);
    }
  } else if (!user.business) {
    const parent = await models.location.getParent(user.location);

    if (parent) {
      locations.push(parent);

      if (parent !== config.realm) {
        locations.push(config.realm);
      }
    }
  }

  return locations;
};

export const prepareCreatePayload = (payload:any):void => {
  delete payload._id;
  // delete payload.token;
  delete payload.created;
  delete payload.modified;

  for (const k in payload) {
    if (k.startsWith('$') || k.includes('.')) {
      delete payload[k];
    }
  }

  updatePayloadArrays(payload);
  updatePayloadSubdocuments(payload);
};

export const prepareUpdatePayload = (payload:any):void => {
  delete payload._id;
  delete payload.token;
  delete payload.location;
  delete payload.created;
  payload.modified = new Date();

  Object.keys(payload).forEach((k) => {
    if (k.startsWith('$')) {
      delete payload[k];
    }
  });

  payload.$unset = {};

  Object.keys(payload).forEach((k) => {
    if (k === 'token' || k === '$unset') {
      return;
    }

    if (k !== 'position' && (payload[k] === null || payload[k] === undefined)) {
      payload.$unset[k] = true;
    }
  });

  if (Object.keys(payload.$unset).length === 0) {
    delete payload.$unset;
  } else {
    Object.keys(payload.$unset).forEach(k => delete payload[k]);
  }

  updatePayloadArrays(payload);
  updatePayloadSubdocuments(payload);
};

export const preparePatchPayload = (payload:any):void => {
  for (const k in payload) {
    if (payload[k] === null || payload[k] === undefined) {
      delete payload[k];
    }
  }

  prepareUpdatePayload(payload);
};

function updatePayloadArrays(item:any) {
  if (item.token && !item._id && isValidObjectId(item.token)) {
    item._id = item.token;
  }

  Object.keys(item)
  .forEach((x) => {
    const value = item[x];

    if (!value) {
      return;
    }

    if (typeof value === 'object' && value !== null) {
      updatePayloadArrays(value);
    } else if (Array.isArray(value)) {
      value
      .filter(v => typeof v === 'object' && v !== null)
      .forEach(v => updatePayloadArrays(v));
    }
  });
}

function updatePayloadSubdocuments(item:any) {
  const prepare = (data:any) => {
    Object.keys(data)
      .forEach((x) => {
        if (x.startsWith('$') || x.includes('.')) {
          delete data[x];
          return;
        }

        const value = data[x];

        if (value === null) {
          delete data[x];
        } else if (typeof value === 'object') {
          prepare(value);
        }
      });
  };

  Object.keys(item)
    .forEach((x) => {
      if (x.startsWith('$')) {
        return;
      }

      const value = item[x];

      if (value !== null && typeof value === 'object') {
        prepare(value);
      }
    });
}
