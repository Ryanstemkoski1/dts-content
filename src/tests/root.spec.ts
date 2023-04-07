import test from 'ava';

import { testRequest } from './';
import { ERequestMethod } from '../domain/service';

test(`health check: responds with status code 200`, async (t) => {
  const response = await testRequest({
    method: ERequestMethod.Get,
    url: '/',
  });

  t.is(response.statusCode, 200, 'statusCode');
});
