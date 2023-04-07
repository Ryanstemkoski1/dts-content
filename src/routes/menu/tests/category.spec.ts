import { EUserRole } from '../../../domain/user';
import { ERequestMethod, EEntityType } from '../../../domain/service';

import model from '../../../models';
import { IMenu } from '../../../models/mongodb/menu';
import { IMenuItem } from '../../../models/mongodb/menu/item';

import { testRequest, location, testFunc } from '../../../tests';

import { menu, menucategory } from './menu.fixture';
import { IMenuCategory } from '../../../models/mongodb/menu/category';

testFunc(EEntityType.Menu)(`Creates a menu category.`, async (t) => {
  const entity = new model.db.Menu({
    ...menu,
    location,
  });
  await entity.save();

  try {
    const payload = {
      ...menucategory,
    } as IMenuCategory;
    delete payload.token;

    const response = await testRequest<IMenuCategory>({
      payload,
      method: ERequestMethod.Post,
      role: EUserRole.Manager,
      url: `/${EEntityType.Menu}/${entity.token}/category`,
    });

    if (!response.result) {
      t.fail('Invalid response.');
      return;
    }

    const created = await model.db.Menu.findById(entity.token).then(x => x.toJSON()) as IMenu;

    t.is(response.statusCode, 200, 'statusCode');

    t.is(created.categories.length, entity.categories.length + 1, 'length');
    t.is(created.categories.pop().token, response.result.token, 'token');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Menu)(`Updates a menu category.`, async (t) => {
  const entity = new model.db.Menu({
    ...menu,
    location,
  });
  await entity.save();

  try {
    const {
      categories: [category1],
    } = entity.toJSON() as IMenu;

    const payload = {
      ...category1,
      title: new Date().toString(),
    } as IMenuCategory;

    const response = await testRequest<IMenuCategory>({
      payload,
      method: ERequestMethod.Put,
      role: EUserRole.Manager,
      url: `/${EEntityType.Menu}/${entity.token}/category/${payload.token}`,
    });

    if (!response.result) {
      t.fail('Invalid response.');
      return;
    }

    const newentity = await model.db.Menu.findById(entity.token).then(x => x.toJSON()) as IMenu;

    t.is(response.statusCode, 200, 'statusCode');

    t.is(newentity.categories.length, entity.categories.length, 'length');
    t.is(newentity.categories[0].token, response.result.token, 'token');
    t.is(newentity.categories[0].title, payload.title, 'title');
  } finally {
    await entity.remove();
  }
});

testFunc(EEntityType.Menu)(`Deletes a menu category.`, async (t) => {
  const entity = new model.db.Menu({
    ...menu,
    location,
  });
  await entity.save();

  try {
    const {
      categories: [category1, category2],
    } = entity.toJSON() as IMenu;

    const response = await testRequest<IMenuItem>({
      method: ERequestMethod.Delete,
      role: EUserRole.Manager,
      url: `/${EEntityType.Menu}/${entity.token}/category/${category1.token}`,
    });

    const newentity = await model.db.Menu.findById(entity.token).then(x => x.toJSON()) as IMenu;

    t.is(response.statusCode, 204, 'statusCode');

    t.is(newentity.categories.length, entity.categories.length - 1, 'length');
    t.is(newentity.categories[0].token, category2.token, 'token');
  } finally {
    await entity.remove();
  }
});
