import test, {
  after,
  before,
  TestInterface,
  SkipInterface,
} from 'ava';

import { EUserRole } from '../domain/user';
import { ERequestMethod, EEntityType } from '../domain/service';

import { IDocument, toJSON } from '../models/mongodb/schema';
import models from '../models';

import { getMinimalFields } from '../routes/utils';

import server from '../server';

import admin from './admin.fixture';
import backend from './backend.fixture';
import manager from './manager.fixture';
import customer from './customer.fixture';
import device from './device.fixture';
import staff from './staff.fixture';

import * as moment from 'moment';
import { Schema } from 'mongoose';

before(async () => {
  await server.start();
});

after(async () => {
  await server.stop();
});

const VALID_ROLES = [
  EUserRole.Admin,
  EUserRole.Backend,
  EUserRole.Manager,
];
const UNAUTHORIZED_ROLES = [EUserRole.Customer, EUserRole.Device, EUserRole.Staff];
const DEFAULT_LOCATION = 'e9c5453e-cce8-4df1-9fc9-a5c701030707';

export const users = {
  admin,
  backend,
  manager,
  customer,
  device,
  staff,
};

export const location = DEFAULT_LOCATION;

export interface ITestRequest {
  url:(() => string)|string;
  method:ERequestMethod;
  payload?:any;
  role?:EUserRole;
}

export interface ITestResponse<T = any> {
  statusCode:number;
  result?:T;
}

export const testFunc = (type:EEntityType):TestInterface|SkipInterface => {
  return process.env.TEST && process.env.TEST !== type ?
    test.skip :
    test;
};

export const testRequest = async <T = any>(request:ITestRequest):Promise<ITestResponse<T>> => {
  let credentials:any;

  switch (request.role) {
    case EUserRole.Admin:
      credentials = users.admin;
      break;
    case EUserRole.Backend:
      credentials = users.backend;
      break;
    case EUserRole.Customer:
      credentials = users.customer;
      break;
    case EUserRole.Device:
      credentials = users.device;
      break;
    case EUserRole.Manager:
      credentials = users.manager;
      break;
    case EUserRole.Staff:
      credentials = users.staff;
      break;
  }

  const url = typeof request.url === 'function' ?
      request.url() :
      request.url;

  const res = await server.web.hapi.inject({
    url,
    auth: credentials ? {
      credentials,
      strategy: 'api',
    } : undefined,
    method: request.method,
    payload: request.payload,
  });

  const response:ITestResponse = {
    statusCode: res.statusCode,
    result: res.result ? JSON.parse(JSON.stringify(res.result)) : undefined,
  };

  return response;
};

export const testAuth = (type:EEntityType, method:ERequestMethod, url:string):void => {
  // testFunc(type)(`${method} ${url}: responds with status code 403 for unathorized`, async (t) => {
  //   const tasks = UNAUTHORIZED_ROLES.filter(x => x).map(async (role) => {
  //     const response = await testRequest({
  //       url,
  //       method,
  //       role: role as EUserRole,
  //     });

  //     t.is(response.statusCode, 403, 'statusCode');
  //   });

  //   await Promise.all(tasks);
  // });

  testFunc(type)(`${method} ${url}: responds with status code 401 for guest`, async (t) => {
    const response = await testRequest({
      url,
      method,
    });

    t.is(response.statusCode, 401, 'statusCode');
  });
};

export const testCrudList = (type:EEntityType, fixture:any):void => {
  const baseUrl = `/${type}`;

  VALID_ROLES.forEach((role) => {
    testFunc(type)(`List ${type} for ${role}`, async (t) => {
      const model = models.getEntityModel(type);

      if (!model) {
        t.fail(`Model ${type} not found.`);
        return;
      }

      const entity:IDocument = new model({
        ...fixture,
        location: DEFAULT_LOCATION,
      });

      await entity.save();

      try {
        let url = baseUrl;

        if (role === 'backend') {
          url += `?locations[]=${entity.location}`;
        }

        const response = await testRequest<any[]>({
          role,
          url,
          method: ERequestMethod.Get,
        });

        const list = response.result || [];

        t.is(response.statusCode, 200, 'statusCode');

        const [item] = list;

        t.is(list.length > 0, true, 'count');
        t.truthy(item, 'item');
        t.is(list.filter(x => x.location === DEFAULT_LOCATION).length > 0, true, 'Location');

        const expectedFields = Object.keys(getMinimalFields(model.schema));
        const actualFields = Object.keys(item);

        if (expectedFields.length > 0) {
          t.is(actualFields.length <= expectedFields.length, true, 'fields');
        }
      } finally {
        await entity.remove();
      }
    });
  });
};

export const testCrudRead = (type:EEntityType, fixture:any):void => {
  const baseUrl = `/${type}`;

  VALID_ROLES.forEach((role) => {
    testFunc(type)(`Read ${type} for ${role}`, async (t) => {
      const model = models.getEntityModel(type);

      if (!model) {
        t.fail(`Model ${type} not found.`);
        return;
      }

      const entity:IDocument = new model({
        ...fixture,
        location: DEFAULT_LOCATION,
      });
      await entity.save();

      try {
        const url = `${baseUrl}/${entity.token}`;

        const response = await testRequest<IDocument>({
          role,
          url,
          method: ERequestMethod.Get,
        });

        const item = response.result;

        t.is(response.statusCode, 200, 'statusCode');
        t.is(item.token, entity.token, 'token');
        t.is(item.location, entity.location, 'location');

        const expectedFields = Object.keys(getMinimalFields(model.schema));
        const actualFields = Object.keys(item);

        if (expectedFields.length > 0) {
          t.is(actualFields.length >= expectedFields.length, true, 'fields');
        }
      } finally {
        await entity.remove();
      }
    });
  });
};

export const testCrudCreate = (type:EEntityType, fixture:any):void => {
  const baseUrl = `/${type}`;

  VALID_ROLES.forEach((role) => {
    testFunc(type)(`Create ${type} for ${role}`, async (t) => {
      const model = models.getEntityModel(type);

      if (!model) {
        t.fail(`Model ${type} not found.`);
        return;
      }

      const payload = {
        ...fixture,
      };

      if (role === EUserRole.Backend) {
        payload.location = DEFAULT_LOCATION;
      }

      let url = baseUrl;

      if (role === 'backend') {
        url += `?locations[]=${payload.location}`;
      }

      const now = moment();

      const response = await testRequest<IDocument>({
        role,
        url,
        payload,
        method: ERequestMethod.Post,
      });

      const result = response.result;

      try {
        if (!result) {
          t.fail('Missing response.');
          return;
        }

        t.is(response.statusCode, 200, 'statusCode');
        t.truthy(result.token, 'token');
        t.is(result.location, DEFAULT_LOCATION, 'location');
        t.truthy(moment(result.created).isAfter(now), 'created');
        t.truthy(moment(result.modified).isAfter(now), 'modified');
      } finally {
        if (result.token) {
          await model.findByIdAndRemove(result.token).exec();
        }
      }
    });
  });
};

export const testCrudUpdate = (type:EEntityType, fixture:any):void => {
  const baseUrl = `/${type}`;

  VALID_ROLES.forEach((role) => {
    testFunc(type)(`Update ${type} for ${role}`, async (t) => {
      const model = models.getEntityModel(type);

      if (!model) {
        t.fail(`Model ${type} not found.`);
        return;
      }

      const entity:IDocument = new model({
        ...fixture,
        location: DEFAULT_LOCATION,
      });
      await entity.save();

      const original = entity.toJSON();
      const arrayProperties = getSchemaDocumentArrays(model.schema);

      try {
        const payload = entity.toJSON();
        const url = `${baseUrl}/${entity.token}`;

        const response = await testRequest<IDocument>({
          role,
          url,
          payload,
          method: ERequestMethod.Put,
        });

        const result = response.result;

        if (!result) {
          t.fail('Missing response.');
          return;
        }

        if (response.statusCode !== 200) {
          t.fail(`Error response: ${result['message']}`);
          return;
        }

        t.is(result.token, entity.token, 'token');
        t.is(result.location, entity.location, 'location');
        t.truthy(result.created, 'created');
        t.truthy(result.modified, 'modified');
        t.is(moment(result.created).format(), moment(original.created).format(), 'created');
        t.truthy(moment(result.modified).isAfter(moment(original.created)), 'modified');

        arrayProperties.forEach((x) => {
          const oldItems = original[x];
          const newItems = result[x];

          for (let i = 0; i < oldItems.length && i < newItems.length; i++) {
            const oldItem = oldItems[i];
            const newItem = newItems[i];

            t.truthy(oldItem.token, `${x}[${i}].token`);
            t.truthy(newItem.token, `${x}[${i}].token`);
            t.is(newItem.token, oldItem.token, `${x}[${i}].token`);
          }
        });
      } finally {
        await entity.remove();
      }
    });
  });
};

export const testCrudPatch = (type:EEntityType, fixture:any, payload:any):void => {
  const baseUrl = `/${type}`;

  VALID_ROLES.forEach((role) => {
    testFunc(type)(`Patch ${type} for ${role}`, async (t) => {
      const model = models.getEntityModel(type);

      if (!model) {
        t.fail(`Model ${type} not found.`);
        return;
      }

      const entity:IDocument = new model({
        ...fixture,
        location: DEFAULT_LOCATION,
      });
      await entity.save();

      const original = entity.toJSON();
      const arrayProperties = getSchemaDocumentArrays(model.schema);

      try {
        const url = `${baseUrl}/${entity.token}`;

        const response = await testRequest<IDocument>({
          role,
          url,
          payload,
          method: ERequestMethod.Patch,
        });

        const result = response.result;

        if (result) {
          t.fail('Invalid response.');
          return;
        }

        t.is(response.statusCode, 204, 'statusCode');

        const createdEntity = await model.findById(entity.token);
        const created = createdEntity.toJSON();

        arrayProperties.forEach((x) => {
          const oldItems = original[x];
          const newItems = created[x];

          for (let i = 0; i < oldItems.length && i < newItems.length; i++) {
            const oldItem = oldItems[i];
            const newItem = newItems[i];

            t.truthy(oldItem.token, `${x}[${i}].token`);
            t.truthy(newItem.token, `${x}[${i}].token`);
            t.is(newItem.token, oldItem.token, `${x}[${i}].token`);
          }
        });
      } finally {
        await entity.remove();
      }
    });
  });
};

export const testCrudDelete = (type:EEntityType, fixture:any):void => {
  const baseUrl = `/${type}`;

  VALID_ROLES.forEach((role) => {
    testFunc(type)(`Delete ${type} for ${role}`, async (t) => {
      const model = models.getEntityModel(type);

      if (!model) {
        t.fail(`Model ${type} not found.`);
        return;
      }

      const entity:IDocument = new model({
        ...fixture,
        location: DEFAULT_LOCATION,
      });
      await entity.save();

      try {
        const url = `${baseUrl}/${entity.token}`;

        const response1 = await testRequest<IDocument>({
          role,
          url,
          method: ERequestMethod.Delete,
        });

        if (response1.result) {
          t.fail('Invalid response.');
          return;
        }

        t.is(response1.statusCode, 204, 'statusCode');

        const response2 = await testRequest<IDocument>({
          role,
          url,
          method: ERequestMethod.Delete,
        });

        t.is(response2.statusCode, 404, 'statusCode');
      } finally {
        await entity.remove();
      }
    });
  });
};

export const testCrudAuth = (type:EEntityType):void => {
  testAuth(type, ERequestMethod.Get, `/${type}`);
  testAuth(type, ERequestMethod.Get, `/${type}/id`);
  testAuth(type, ERequestMethod.Post, `/${type}`);
  testAuth(type, ERequestMethod.Put, `/${type}/id`);
  // testAuth(type, ERequestMethod.Patch, `/${type}/id`);
  testAuth(type, ERequestMethod.Delete, `/${type}/id`);
};

export const testCrud = (type:EEntityType, fixture:any):void => {
  testCrudAuth(type);

  testCrudList(type, fixture);
  testCrudRead(type, fixture);
  testCrudCreate(type, fixture);
  testCrudUpdate(type, fixture);
  // testCrudPatch(type, fixture, fixture);
  testCrudDelete(type, fixture);
};

function getSchemaDocumentArrays(schema:Schema):string[] {
  return Object.keys(schema.paths)
    .filter((x) => {
      const prop:any = schema.paths[x];
      return prop.instance === 'Array' &&
        prop.schema?.options?.toJSON === toJSON;
    });
}
