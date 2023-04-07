import { testCrudList, testCrudRead, testCrudDelete, testFunc, location, testRequest } from '../../../tests';
import { EEntityType, ERequestMethod } from '../../../domain/service';
import { EUserRole } from '../../../domain/user';

import model from '../../../models';
import { IPresentation } from '../../../models/mongodb/presentation';

import schedule from '../../../services/schedule';

import { presentation1, presentation2, presentation2_nulls, display1, display2 } from './presentation.fixture';

testCrudList(EEntityType.Presentation, presentation1);
testCrudRead(EEntityType.Presentation, presentation1);
testCrudDelete(EEntityType.Presentation, presentation1);

testFunc(EEntityType.Presentation)(`Creates presentation.`, async (t) => {
  const payload = {
    ...presentation1,
  } as IPresentation;

  const response = await testRequest<IPresentation>({
    payload,
    method: ERequestMethod.Post,
    role: EUserRole.Manager,
    url: `/${EEntityType.Presentation}`,
  });

  const result = response.result;

  t.is(response.statusCode, 200, 'statusCode');

  await model.db.Presentation.findByIdAndRemove(result.token);

  t.truthy(result.token, 'token');
});

testFunc(EEntityType.Presentation)(`Updates presentation.`, async (t) => {
  const data = {
    ...presentation1,
    location,
    displays: [
      display1,
    ],
  } as IPresentation;

  data.slides.forEach((slide) => {
    slide.combinations = schedule.getCombinations(data, slide);
  });

  const entity = new model.db.Presentation(data);
  await entity.save();

  try {
    const payload = {
      ...entity.toJSON(),
      title: 'new title',
      displays: [
        display1,
        display2,
      ],
    } as IPresentation;

    const response = await testRequest<IPresentation>({
      payload,
      method: ERequestMethod.Put,
      role: EUserRole.Manager,
      url: `/${EEntityType.Presentation}/${entity.token}`,
    });

    const result = response.result;
    const [slide1] = result.slides;

    t.is(response.statusCode, 200, 'statusCode');

    t.truthy(result.token, 'token');
    t.is(result.title, payload.title, 'title');
    t.truthy(slide1.combinations.length > data.slides[0].combinations.length, 'slides[0].combinations');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Presentation)(`Patches presentation.`, async (t) => {
  const data = {
    ...presentation1,
    location,
    displays: [
      display1,
    ],
  } as IPresentation;

  data.slides.forEach((slide) => {
    slide.combinations = schedule.getCombinations(data, slide);
  });

  const entity = new model.db.Presentation(data);
  await entity.save();

  try {
    const payload = {
      displays: [
        display1,
        display2,
      ],
    } as IPresentation;

    const response = await testRequest<IPresentation>({
      payload,
      method: ERequestMethod.Patch,
      role: EUserRole.Manager,
      url: `/${EEntityType.Presentation}/${entity.token}`,
    });

    const result = await model.db.Presentation.findById(entity.token);
    const [slide1] = result.slides;

    t.is(response.statusCode, 204, 'statusCode');

    t.is(result.title, entity.title, 'title');
    t.truthy(slide1.combinations.length > data.slides[0].combinations.length, 'slides[0].combinations');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Presentation)(`Unsets combinations.`, async (t) => {
  const data = {
    ...presentation1,
    location,
    displays: [
      display1,
    ],
  } as IPresentation;

  data.slides.forEach((slide) => {
    slide.combinations = schedule.getCombinations(data, slide);
  });

  const entity = new model.db.Presentation(data);
  await entity.save();

  try {
    const payload = {
      ...entity.toJSON(),
      render: false,
    } as IPresentation;

    const response = await testRequest<IPresentation>({
      payload,
      method: ERequestMethod.Put,
      role: EUserRole.Manager,
      url: `/${EEntityType.Presentation}/${entity.token}`,
    });

    const result = response.result;
    const [slide1] = result.slides;

    t.is(response.statusCode, 200, 'statusCode');

    t.truthy(result.token, 'token');
    t.is(result.title, payload.title, 'title');
    t.is(slide1.combinations, null, 'slides[0].combinations');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Presentation)(`Ignores nulls.`, async (t) => {
  const data = {
    ...presentation2,
    location,
  } as IPresentation;

  const entity = new model.db.Presentation(data);
  await entity.save();

  try {
    const payload = {
      ...presentation2_nulls,
      location,
    } as IPresentation;

    const response = await testRequest<IPresentation>({
      payload,
      method: ERequestMethod.Patch,
      role: EUserRole.Manager,
      url: `/${EEntityType.Presentation}/${entity.token}`,
    });

    const result = await model.db.Presentation.findById(entity.token);

    t.is(response.statusCode, 204, 'statusCode');

    t.is(result.title, entity.title, 'title');
    t.is(result.canvas.ratio, undefined, 'canvas.ratio');
  } finally {
    await entity.remove();
  }
});
