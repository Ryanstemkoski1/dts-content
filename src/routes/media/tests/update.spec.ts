import { testFunc, location, testRequest } from '../../../tests';
import { EEntityType, ERequestMethod } from '../../../domain/service';
import { EUserRole } from '../../../domain/user';

import model from '../../../models';
import { IMedia, EMediaStatus } from '../../../models/mongodb/media';
import { IMediaWorker, EMediaWorkerStatus } from '../../../models/mongodb/media/worker';

import media from './media.fixture';

import * as uuid from 'uuid';

testFunc(EEntityType.Media)(`Creates media worker.`, async (t) => {
  const entity = new model.db.Media({
    ...media,
    location,
    token: uuid.v4(),
    status: EMediaStatus.Processing,
  } as IMedia);
  await entity.save();

  const payload = {
    token: uuid.v4(),
    status: EMediaWorkerStatus.Processing,
  } as IMediaWorker;

  try {
    const response = await testRequest<IMediaWorker>({
      payload,
      method: ERequestMethod.Post,
      role: EUserRole.Backend,
      url: `/${EEntityType.Media}/${entity.token}/worker`,
    });

    const result = response.result;

    t.is(response.statusCode, 200, 'statusCode');

    t.is(result.token, payload.token, 'token');
    t.truthy(result.started, 'started');
    t.is(result.status, payload.status, 'status');

    const {
      workers,
    } = await model.db.Media.findById(entity.token);

    t.is(workers.length, 1, 'workers.length');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Media)(`Updates media worker.`, async (t) => {
  const entity = new model.db.Media({
    ...media,
    location,
    status: EMediaStatus.Processing,
    workers: [
      {
        token: uuid.v4(),
        status: EMediaWorkerStatus.Processing,
      }, {
        token: uuid.v4(),
        status: EMediaWorkerStatus.Processing,
      },
    ],
  } as IMedia);
  await entity.save();

  const { workers: [worker1, worker2] } = entity.toJSON();

  const payload = {
    ...worker1,
    status: EMediaWorkerStatus.Error,
    ended: new Date(),
    error: 'error',
  } as IMediaWorker;

  try {
    const response = await testRequest<IMediaWorker>({
      payload,
      method: ERequestMethod.Patch,
      role: EUserRole.Backend,
      url: `/${EEntityType.Media}/${entity.token}/worker/${worker1.token}`,
    });

    const {
      modified,
      workers,
    } = await model.db.Media.findById(entity.token);

    const [newworker1, newworker2] = workers;

    t.is(response.statusCode, 204, 'statusCode');

    t.is(workers.length, 2, 'workers.length');
    t.truthy(modified.valueOf() > entity.modified.valueOf(), 'modified');
    t.is(payload.status, newworker1.status, 'workers[0].status');
    t.is(payload.error, newworker1.error, 'workers[0].error');
    t.is(payload.ended.valueOf(), newworker1.ended.valueOf(), 'workers[0].ended');
    t.is(worker2.status, newworker2.status, 'workers[1].status');
  } finally {
    await entity.remove();
  }
});
