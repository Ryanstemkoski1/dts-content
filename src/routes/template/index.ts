import * as Boom from '@hapi/boom';
import * as Joi from '@hapi/joi';
import * as Hapi from '@hapi/hapi';

import config from '../../config';

import { PurchaseTemplate } from '../../domain/purchase';
import { hasPermission, EUserPermission, hasRole, EUserRole } from '../../domain/user';
import { EEntityType } from '../../domain/service';

import model from '../../models';
import { presentationUseSchema, schema as presentationSchema } from '../../models/mongodb/presentation';
import { ITemplate, schema } from '../../models/mongodb/template';
import * as presentationModel from '../../models/presentation';

import logger from '../../services/logger';

import * as crud from '../crud';
import * as utils from '../utils';

export default (server:Hapi.Server) => {
  crud.createCrud(server, model.db.Template, {
    methods: [
      'create',
      'delete',
    ],
    permissions: {
      write: EUserPermission.PlayerEdit,
    },
  });

  crud.createCrudList(server, schema, {
    preHandler: async ({ user, query, select }) => {
      // if (!hasPermission(user, EUserPermission.Player)) {
      //   throw Boom.forbidden();
      // }
      // TODO: fix caching
      Object.assign(select, {
        location: true,
        created: true,
        modified: true,
        title: true,
        category: true,
        preview: true,
        canvas: true,
        tags: true,
        price: true,
        published: true,
      });
    },
    handler: async ({ user, query, select }) => {
      const business = user.business;

      const [
        entities,
        purchases,
      ] = await Promise.all([
        model.db.Template
          .find(query)
          .select(select)
          .exec(),
        business ?
          model.presentation.listTemplatePurchase(business) :
          Promise.resolve([] as PurchaseTemplate[]),
      ]);

      const purchaseMap = purchases.reduce((res, item) => {
        res[item.template] = true;
        return res;
      }, {});

      entities.forEach((entity) => {
        entity.purchased = purchaseMap[entity.token] || false;
      });

      if (user.location !== config.realm) {
        return entities.filter(x => x.location !== config.realm || x.published);
      }

      return entities;
    },
  });

  crud.createCrudRead(server, schema, {
    handler: async ({ user, query }) => {
      // if (!hasPermission(user, EUserPermission.Player)) {
      //   throw Boom.forbidden();
      // }

      const entity = await model.db.Template.findOne(query);

      if (
        !hasRole(user, EUserRole.Backend) &&
        user.location !== config.realm &&
        entity.location === config.realm
      ) {
        throw Boom.forbidden();
      }

      return entity;
    },
  });

  crud.createCrudUpdate(server, schema, {
    handler: async ({ payload, user, query }) => {
      if (!hasPermission(user, EUserPermission.PlayerEdit)) {
        throw Boom.forbidden();
      }

      presentationModel.prepareInputPayload(payload);

      updatePreview(payload);

      return await model.db.Template
        .findOneAndUpdate(query, payload, { runValidators: true, new: true })
        .exec();
    },
  });

  crud.createCrudPatch(server, schema, {
    handler: async ({ payload, user, query, select, state }) => {
      if (!hasPermission(user, EUserPermission.PlayerEdit)) {
        throw Boom.forbidden();
      }

      presentationModel.prepareInputPayload(payload);

      state['doUpdate'] = Boolean(
        payload.slides ||
        payload.canvas,
      );

      if (state['doUpdate']) {
        select = {};
      }

      return await model.db.Template
        .findOneAndUpdate(query, payload, {
          projection: select,
          runValidators: true,
          new: true,
        })
        .exec();
    },
    postHandler: async ({ result, state }) => {
      if (state['doUpdate']) {
        updatePreview(result);

        const update = {
          preview: result.preview,
        } as ITemplate;

        await model.db.Template
          .findOneAndUpdate({ _id: result.token }, update, { projection: { _id: true } })
          .lean()
          .exec()
          .catch(error => logger.warn({ error }, 'Template handler error'));
      }

      return result;
    },
  });

  crud.createCrudInvoke(server, presentationUseSchema, presentationSchema, {
    method: 'POST',
    path: `/${EEntityType.Template}/{id}/use`,
    route: crud.generateInvokeOptions(EEntityType.Template, {
      id: 'purchaseTemplate',
      description: 'Purchase a Template and generate a Presentation.',
      response: utils.documentModel(model.db.Presentation.schema, {
        operation: 'read',
      }),
      payload: utils.documentModel(presentationUseSchema),
      params: {
        'id': Joi.string()
          .description(`ID of Template to use`)
          .required(),
      },
      roles: [EUserRole.Manager],
    }),
    handler: async ({ request, user }) => {
      // if (!hasPermission(user, EUserPermission.PlayerPurchase)) {
      //   throw Boom.badRequest();
      // }

      const { id } = request.params;
      const { location } = user;
      const payload = request.payload;

      if (!payload) {
        throw Boom.badRequest();
      }

      const template = await model.db.Template.findById(id);

      if (!template || !template.slides) {
        throw Boom.notFound();
      }

      await model.presentation.purchaseTemplate(template, user);

      const result = model.presentation.generateTemplatePresentation(template);
      result.location = location;

      return result;
    },
  });
};

function updatePreview(entity:ITemplate):void {
  const preview = presentationModel.prepareTemplatePreview(entity);

  if (preview) {
    entity.preview = preview;

    presentationModel.generateTemplatePreview(entity)
      .then(() => {
        logger.debug({ preview, entity: entity.token }, 'Template preview updated.');
      })
      .catch((error) => {
        logger.warn({ error, preview, entity: entity.token }, 'Template preview error.');
      });
  }
}
