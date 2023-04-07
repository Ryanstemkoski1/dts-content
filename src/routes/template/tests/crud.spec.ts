import config from '../../../config';

import {
  testCrudCreate,
  testCrudDelete,
  testCrudPatch,
  testCrudRead,
  testCrudUpdate,
  testFunc,
  location,
  testRequest,
} from '../../../tests';
import { EEntityType, ERequestMethod } from '../../../domain/service';
import { EUserRole } from '../../../domain/user';

import model from '../../../models';
import { ITemplate } from '../../../models/mongodb/template';

import { template1, template1Patch } from './template.fixture';
import { IPresentationUse, IPresentation } from '../../../models/mongodb/presentation';

testCrudCreate(EEntityType.Template, template1);
testCrudRead(EEntityType.Template, template1);
testCrudDelete(EEntityType.Template, template1);
testCrudUpdate(EEntityType.Template, template1);
testCrudPatch(EEntityType.Template, template1, template1Patch);

testFunc(EEntityType.Template)(`Lists templates.`, async (t) => {
  const entity = new model.db.Template({
    ...template1,
    location,
  } as ITemplate);
  await entity.save();

  try {
    const response = await testRequest<ITemplate[]>({
      method: ERequestMethod.Get,
      role: EUserRole.Manager,
      url: `/${EEntityType.Template}`,
    });

    const results = response.result;

    t.is(response.statusCode, 200, 'statusCode');

    t.truthy(results.length > 0, 'length');
    t.is(results.filter(x => x.slides || x.template_data).length, 0, 'data');
    t.is(results.filter(x => x.location === config.realm && !x.published).length, 0, 'published');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Template)(`Can't read realm templates.`, async (t) => {
  const entity = new model.db.Template({
    ...template1,
    location: config.realm,
    published: false,
  } as ITemplate);
  await entity.save();

  try {
    const response = await testRequest<ITemplate[]>({
      method: ERequestMethod.Get,
      role: EUserRole.Manager,
      url: `/${EEntityType.Template}/${entity.token}`,
    });

    t.is(response.statusCode, 403, 'statusCode');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Template)(`Uses template.`, async (t) => {
  const entity = new model.db.Template({
    ...template1,
    location,
  } as ITemplate);
  await entity.save();

  try {
    const payload = {
    } as IPresentationUse;

    const response = await testRequest<IPresentation>({
      payload,
      method: ERequestMethod.Post,
      role: EUserRole.Manager,
      url: `/${EEntityType.Template}/${entity.token}/use`,
    });

    const result = response.result;

    t.is(response.statusCode, 200, 'statusCode');

    t.truthy(result.token, 'token');
    t.is(result.title, entity.title, 'title');
    t.is(result.slides.length, 1, 'slides');
    t.is(result.template_data.sources.length, 1, 'template_data.sources');
    t.is(result.template_data.sources[0].slide, result.slides[0].token, 'template_data.slide');
  } finally {
    await entity.remove();
  }
});
