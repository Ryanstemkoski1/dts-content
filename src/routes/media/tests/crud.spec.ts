import { testCrudRead, testCrudDelete, testFunc, location, testRequest } from '../../../tests';
import { EEntityType, ERequestMethod } from '../../../domain/service';

import model from '../../../models';
import { IMedia, EMediaStatus, IMediaCreate } from '../../../models/mongodb/media';

import media from './media.fixture';
import { EUserRole } from '../../../domain/user';

import * as uuid from 'uuid';

testCrudRead(EEntityType.Media, media);
testCrudDelete(EEntityType.Media, media);

testFunc(EEntityType.Media)(`Lists media for user.`, async (t) => {
  const entities = [
    new model.db.Media({
      ...media,
      location,
      status: EMediaStatus.Ready,
    } as IMedia),
    new model.db.Media({
      ...media,
      location,
      status: EMediaStatus.Error,
    } as IMedia),
    new model.db.Media({
      ...media,
      location,
      status: EMediaStatus.Pending,
    } as IMedia),
    new model.db.Media({
      ...media,
      location,
      status: EMediaStatus.Processing,
    } as IMedia),
  ];

  await Promise.all(entities.map(e => e.save()));

  try {
    const response = await testRequest<IMedia[]>({
      method: ERequestMethod.Get,
      role: EUserRole.Manager,
      url: `/${EEntityType.Media}`,
    });

    const result = response.result;

    t.is(response.statusCode, 200, 'statusCode');

    t.truthy(result.length > 0, 'length');
    t.is(result.filter(x => x.error).length, 0, 'errors');
    t.is(result.filter(x => x.status).length, 0, 'status');
  } finally {
    await Promise.all(entities.map(e => e.remove()));
  }
});

testFunc(EEntityType.Media)(`Lists media for backend.`, async (t) => {
  const entities = [
    new model.db.Media({
      ...media,
      location,
      status: EMediaStatus.Ready,
    } as IMedia),
    new model.db.Media({
      ...media,
      location,
      status: EMediaStatus.Error,
      error: 'error',
    } as IMedia),
    new model.db.Media({
      ...media,
      location,
      status: EMediaStatus.Pending,
    } as IMedia),
    new model.db.Media({
      ...media,
      location,
      status: EMediaStatus.Processing,
    } as IMedia),
  ];

  await Promise.all(entities.map(e => e.save()));

  try {
    const response = await testRequest<IMedia[]>({
      method: ERequestMethod.Get,
      role: EUserRole.Backend,
      url: `/${EEntityType.Media}?locations[]=${location}`,
    });

    const result = response.result;

    t.is(response.statusCode, 200, 'statusCode');

    t.truthy(result.length >= entities.length, 'length');
    t.not(result.filter(x => x.error).length, 0, 'errors');
    t.not(result.filter(x => x.status).length, 0, 'status');
  } finally {
    await Promise.all(entities.map(e => e.remove()));
  }
});

testFunc(EEntityType.Media)(`Creates media for backend.`, async (t) => {
  const payload = {
    location,
    token: uuid.v4(),
    name: '1.jpg',
    upload: uuid.v4(),
  } as IMediaCreate;

  try {
    const response = await testRequest<IMedia>({
      payload,
      method: ERequestMethod.Post,
      role: EUserRole.Backend,
      url: `/${EEntityType.Media}`,
    });

    const result = response.result;

    t.is(response.statusCode, 200, 'statusCode');

    t.is(result.token, payload.token, 'token');
    t.is(result.location, payload.location, 'location');
    t.is(result.mime, 'image/jpeg', 'mime');
    t.is(result.status, EMediaStatus.Pending, 'status');
  } finally {
    await model.db.Media.findByIdAndRemove(payload.token);
  }
});

testFunc(EEntityType.Media)(`Fails for backend with no location.`, async (t) => {
  const payload = {
    location: undefined,
    token: uuid.v4(),
    name: '1.jpg',
    upload: uuid.v4(),
  } as IMediaCreate;

  try {
    const response = await testRequest<IMedia>({
      payload,
      method: ERequestMethod.Post,
      role: EUserRole.Backend,
      url: `/${EEntityType.Media}`,
    });

    t.is(response.statusCode, 400, 'statusCode');
  } finally {
    await model.db.Media.findByIdAndRemove(payload.token);
  }
});

testFunc(EEntityType.Media)(`Ignores media location for user.`, async (t) => {
  const payload = {
    location: uuid.v4(),
    token: uuid.v4(),
    name: '1.jpg',
    mime: 'image/png',
    upload: uuid.v4(),
  } as IMediaCreate;

  const response = await testRequest<IMedia>({
    payload,
    method: ERequestMethod.Post,
    role: EUserRole.Manager,
    url: `/${EEntityType.Media}`,
  });

  const result = response.result;

  t.is(response.statusCode, 200, 'statusCode');

  await model.db.Media.findByIdAndRemove(result.token);

  t.not(result.location, payload.location, 'location');
});

testFunc(EEntityType.Media)(`Creates media for user.`, async (t) => {
  const payload = {
    location: uuid.v4(),
    token: uuid.v4(),
    name: '1.jpg',
    mime: 'image/png',
    upload: uuid.v4(),
  } as IMediaCreate;

  const response = await testRequest<IMedia>({
    payload,
    method: ERequestMethod.Post,
    role: EUserRole.Manager,
    url: `/${EEntityType.Media}`,
  });

  const result = response.result;

  t.is(response.statusCode, 200, 'statusCode');

  await model.db.Media.findByIdAndRemove(result.token);

  t.not(result.token, payload.token, 'token');
  t.not(result.location, payload.location, 'location');
  t.is(result.mime, payload.mime, 'mime');
  t.is(result.status, EMediaStatus.Pending, 'status');
});

testFunc(EEntityType.Media)(`Generates mime.`, async (t) => {
  const payload = {
    name: '1.png',
    upload: uuid.v4(),
  } as IMediaCreate;

  const response = await testRequest<IMedia>({
    payload,
    method: ERequestMethod.Post,
    role: EUserRole.Manager,
    url: `/${EEntityType.Media}`,
  });

  const result = response.result;

  t.is(response.statusCode, 200, 'statusCode');

  await model.db.Media.findByIdAndRemove(result.token);

  t.is(result.mime, 'image/png', 'mime');
  t.is(result.status, EMediaStatus.Pending, 'status');
});

testFunc(EEntityType.Media)(`Validates mime.`, async (t) => {
  const payload = {
    name: '1.png',
    mime: '12345',
    upload: uuid.v4(),
  } as IMediaCreate;

  const response = await testRequest<IMedia>({
    payload,
    method: ERequestMethod.Post,
    role: EUserRole.Manager,
    url: `/${EEntityType.Media}`,
  });

  const result = response.result;

  t.is(response.statusCode, 400, 'statusCode');

  await model.db.Media.findByIdAndRemove(result.token);
});

testFunc(EEntityType.Media)(`Validates parent media.`, async (t) => {
  const entity = new model.db.Media({
    ...media,
    location,
    token: uuid.v4(),
    status: EMediaStatus.Ready,
  } as IMedia);
  await entity.save();

  const payload = {
    upload: uuid.v4(),
    parent: entity.token,
  } as IMediaCreate;

  try {
    const response = await testRequest<IMedia>({
      payload,
      method: ERequestMethod.Post,
      role: EUserRole.Manager,
      url: `/${EEntityType.Media}`,
    });

    t.is(response.statusCode, 200, 'statusCode');
    t.is(response.result.parent, entity.token, 'parent');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Media)(`Validates parent media location.`, async (t) => {
  const entity = new model.db.Media({
    ...media,
    location: uuid.v4(),
    token: uuid.v4(),
    status: EMediaStatus.Ready,
  } as IMedia);
  await entity.save();

  const payload = {
    upload: uuid.v4(),
    parent: entity.token,
  } as IMediaCreate;

  try {
    const response = await testRequest<IMedia>({
      payload,
      method: ERequestMethod.Post,
      role: EUserRole.Manager,
      url: `/${EEntityType.Media}`,
    });

    t.is(response.statusCode, 400, 'statusCode');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Media)(`Validates parent media token.`, async (t) => {
  const payload = {
    upload: uuid.v4(),
    parent: uuid.v4(),
  } as IMediaCreate;

  const response = await testRequest<IMedia>({
    payload,
    method: ERequestMethod.Post,
    role: EUserRole.Manager,
    url: `/${EEntityType.Media}`,
  });

  t.is(response.statusCode, 400, 'statusCode');
});

[
  ERequestMethod.Put,
  // ERequestMethod.Patch,
].forEach((method) => {
  testFunc(EEntityType.Media)(`Updates media for user (${method}).`, async (t) => {
    const entity = new model.db.Media({
      ...media,
      location,
      category: '1',
      hidden: false,
      status: EMediaStatus.Ready,
      meta: {
        width: 100,
        height: 100,
        'font-family': '1',
      },
    } as IMedia);
    await entity.save();

    try {
      const payload = {
        ...entity.toJSON(),
        category: '2',
        hidden: true,
        upload: uuid.v4(),
        url: 'http://',
        status: EMediaStatus.Error,
        parent: uuid.v4(),
        meta: {
          width: 200,
          height: 200,
          'font-family': '2',
        },
      } as IMedia;

      const response = await testRequest<IMedia>({
        payload,
        method,
        role: EUserRole.Manager,
        url: `/${EEntityType.Media}/${entity.token}`,
      });

      const result = response.result;

      if (method === ERequestMethod.Patch) {
        t.is(response.statusCode, 204, 'statusCode');
      } else {
        t.is(response.statusCode, 200, 'statusCode');

        t.is(result.category, payload.category, 'category');
        t.not(result.upload, payload.upload, 'upload');
        t.is(result.hidden, payload.hidden, 'hidden');
        t.not(result.status, payload.status, 'upload');
        t.not(result.url, payload.url, 'url');
        t.not(result.parent, payload.parent, 'parent');
        t.not(result.meta.width, payload.meta.width, 'meta.width');
        t.not(result.meta.height, payload.meta.height, 'meta.height');
        t.is(result.meta['font-family'], payload.meta['font-family'], 'meta.font-family');
      }
    } finally {
      await entity.remove();
    }
  });
});
