import { IGraphResolver } from '../../domain/graphql';
import { EEntityType } from '../../domain/service';

import * as isMd5 from 'is-md5';
import * as mime from 'mime';
import {
  Document,
  ToObjectOptions,
  Model,
  Schema,
  SchemaDefinition,
  SchemaTypeOptions,
  Types,
} from 'mongoose';
import * as isuuid from 'uuid-validate';
import * as uuid from 'uuid';

export enum EDocumentStatics {
  ModelType = 'modelType',
  ModelName = 'modelName',
  MinimalFields = 'minimalFields',
  ReadonlyFields = 'readonlyFields',
  GraphResolvers = 'graphResolvers',
}

export enum EModelType {
  Document = 'document',
  Subdocument = 'subdocument',
  Object = 'object',
}

export interface IDocument extends ISubDocument {
  location:string;
  position:number;
  created:Date;
}

export interface ISubDocument extends Document {
  token:string;
  modified:Date;
}

export const toJSON:ToObjectOptions = {
  getters: true,
  virtuals: true,
  versionKey: false,
  transform: (doc, ret, options):any => {
    if (!ret['token']) {
      ret['token'] = ret._id?.toString() || ret.id?.toString();
    }

    delete ret._id;
    delete ret.id;

    return ret;
  },
};

export const toJSON2:ToObjectOptions = {
  getters: false,
  virtuals: false,
  versionKey: false,
  transform: (doc, ret, options):any => {
    if (!ret['token']) {
      ret['token'] = ret._id?.toString() || ret.id?.toString();
    }

    delete ret._id;
    // delete ret.id;

    return ret;
  },
};

export const validateMd5 = {
  validator: v => v && isMd5(v),
  message: '{VALUE} is not a valid MD5!',
};

export const validateToken = {
  validator: v => isuuid(v),
  message: '{VALUE} is not a valid token!',
};

export const validateTokens = {
  validator: v => !v || v.filter(x => isuuid(x)).length === v.length,
  message: '{VALUE} is not a valid token!',
};

export const validateUuid = (nullable?:boolean) => ({
  validator: v => isuuid(v) || (nullable && (v === null || v === undefined)),
  message: '{VALUE} is not a valid token!',
});

export const validateTags = {
  validator: v => !v || v.filter(x => x && x.length > 0).length === v.length,
  message: '{VALUE} is not a valid tag!',
};

export const validateEnum = (e, nullable?:boolean) => ({
  validator: v => {
    Object.values(e)
      .indexOf(v) !== -1 || (nullable && (v === null || v === undefined));
  },
  message: '{VALUE} is not a valid value!',
});

export const validateColor = (nullable?:boolean) => ({
  validator: v => (/^\#[A-Fa-f0-9]{6}$/.test(v) || /^\#[A-Fa-f0-9]{3}$/.test(v)) ||
    (nullable && (v === null || v === undefined)),
  message: '{VALUE} is not a valid color!',
});

export const  validateTime = {
  validator: v => v === null || v === undefined || /^[0-2][0-9]\:[0-5][0-9]$/.test(v),
  message: '{VALUE} is not a valid time!',
};

export const validateInteger = (nullable?:boolean) => ({
  validator: v => (nullable && (v === null || v === undefined)) || v % 1 === 0,
  message: '{VALUE} is not a valid integer!',
});

const MIMES = [
  'application/font-woff',
  'application/font-woff2',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/psd',
  'font/opentype',
];

export const validateMime = {
  validator: v => !v || MIMES.includes(v) || mime.getExtension(v) !== null,
  message: '{VALUE} is not a valid MIME type!',
};

export const enumField = (
  type:any,
  nullable:boolean = false,
  defaultValue?:any,
  valueType?:any,
):SchemaTypeOptions<any> => {
  const def:SchemaTypeOptions<any> = {
    type: valueType || String,
    enum: Object.values(type)
      .concat(nullable ? [null, undefined] : []) as any[],
    validate: validateEnum(type, nullable),
    required: !nullable,
    default: defaultValue,
  };

  return def;
};

export const enumNumberField = (
  type:any,
  nullable:boolean = false,
  defaultValue?:any,
  valueType?:any,
):SchemaTypeOptions<any> => {
  const def:SchemaTypeOptions<any> = {
    type: valueType || String,
    enum: Object.values(type)
      .filter(x => typeof x === 'number')
      .concat(nullable ? [null, undefined] : []) as any[],
    validate: validateEnum(type, nullable),
    required: !nullable,
    default: defaultValue,
  };

  return def;
};

export const generateObjectId = ():string => {
  return (new Types.ObjectId()).toString();
};

export const documentSchemaBase:SchemaDefinition<any> = {
  created: {
    type: Date,
    required: true,
    default: Date.now,
    description: 'Creation date.',
  },
  modified: {
    type: Date,
    required: true,
    default: Date.now,
    description: 'Modification date.',
  },
  location: {
    type: String,
    required: true,
    index: true,
    validate: validateToken,
    description: 'Location ID.',
  },
  position: {
    type: Number,
    description: 'Sort position.',
  },
};

export const subdocumentSchemaBase:SchemaDefinition<any> = {
  modified: {
    type: Date,
    // required: true,
    default: Date.now,
    description: 'Modification date.',
  },
};

export const generateDocumentSchema = <T extends IDocument>(
  name:EEntityType|string,
  definition:SchemaDefinition<any>,
  options:{
    id?:'uuid';
    minimal?:string[];
    readonly?:string[];
  } = {},
  resolvers:IGraphResolver<T>[] = [],
):Schema<T> => {
  const additional:any = {};

  switch (options.id) {
    case 'uuid':
      additional['_id'] = {
        type: String,
        default: () => uuid.v4(),
        validate: validateToken,
      };
      break;
  }

  const schema = new Schema<T>({
    ...documentSchemaBase,
    ...definition,
    ...additional,
  }, {
    toJSON,
  });

  schema.virtual('token')
  .get(function () {
    const entity:IDocument = this as any;
    return entity._id?.toString();
  })
  .set(function (value:string) {
    const entity:IDocument = this as any;
    entity.set({ _id: value });
  });

  schema.static(EDocumentStatics.ModelName, () => name.toString());
  schema.static(EDocumentStatics.ModelType, () => EModelType.Document);
  schema.static(EDocumentStatics.GraphResolvers, () => resolvers || []);

  const dependencies = (resolvers || []).reduce((res, x) => {
    if (x.dependencies) {
      res.push(...x.dependencies);
    }

    return res;
  }, [] as string[]);

  const fields = dependencies
    .filter(x => !options.minimal || !options.minimal.includes(x))
    .concat(options.minimal || []);

  if (fields.length > 0) {
    schema.static(EDocumentStatics.MinimalFields, () => ([
      ...fields,
      '_id',
      'location',
      'created',
      'modified',
      'position',
    ]));
  }

  const readonly = (resolvers || [])
    .map(x => x.field)
    .filter(x => !options.readonly || !options.readonly.includes(x))
    .concat(options.readonly || []);

  schema.static(EDocumentStatics.ReadonlyFields, () => ([
    ...readonly,
    '_id',
    'location',
    'created',
  ]));

  schema.pre('save', function () {
    const entity:IDocument = this as any;

    if (entity.token) {
      entity._id = entity.token;
    }

    if (!entity.isNew) {
      const readonlyFields:string[] = schema.statics[EDocumentStatics.ReadonlyFields] ?
        (schema.statics[EDocumentStatics.ReadonlyFields] as any)() :
        [];

      readonlyFields.forEach((x) => {
        if (entity.isModified(x)) {
          throw new Error(`Property ${x} is read-only.`);
        }
      });
    }

    if (entity.isNew && !entity._id) {
      entity.created = entity.modified = new Date();
    } else {
      entity.modified = new Date();
    }
  });

  return schema;
};

export const generateSubDocumentSchema = <T extends ISubDocument>(
  name:string,
  definition:SchemaDefinition<any>,
  options:{
    id?:'uuid'|'md5'|'string';
  } = {},
  resolvers:IGraphResolver[] = [],
):Schema<T> => {
  const additional:any = {};

  switch (options.id) {
    case 'uuid':
      additional['_id'] = {
        type: String,
        default: () => uuid.v4(),
        validate: validateToken,
      };
      break;
    case 'md5':
      additional['_id'] = {
        type: String,
        required: true,
        validate: validateMd5,
      };
      break;
    case 'string':
      additional['_id'] = {
        type: String,
        required: true,
      };
      break;
  }

  const schema = new Schema<T, Model<T, any, any>, any>({
    ...subdocumentSchemaBase,
    ...definition,
    ...additional,
  }, {
    toJSON,
  });

  schema.virtual('token')
  .get(function () {
    const entity:ISubDocument = this as any;
    return entity._id?.toString();
  })
  .set(function (value:string) {
    const entity:ISubDocument = this as any;
    entity.set({ _id: value });
  });

  schema.static(EDocumentStatics.ModelName, () => name);
  schema.static(EDocumentStatics.ModelType, () => EModelType.Subdocument);
  schema.static(EDocumentStatics.GraphResolvers, () => resolvers || []);

  schema.pre('save', function () {
    const entity:ISubDocument = this as any;
    entity.modified = new Date();
  });

  return schema;
};

export const generateObjectSchema = <T extends Document = Document>(
  name:string,
  definition:SchemaDefinition<any>,
):Schema<T> => {
  const schema = new Schema<T>({
    ...definition,
  }, {
    toJSON: toJSON2,
  });

  schema.static(EDocumentStatics.ModelName, () => name);
  schema.static(EDocumentStatics.ModelType, () => EModelType.Object);
  schema.static(EDocumentStatics.GraphResolvers, () => []);

  return schema;
};
