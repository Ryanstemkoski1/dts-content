import * as Hapi from '@hapi/hapi';
import * as Boom from '@hapi/boom';

import { EUserPermission, hasPermission } from '../../domain/user';

import model from '../../models';
import { IPresentation, schema } from '../../models/mongodb/presentation';
import * as presentationModel from '../../models/presentation';

import logger from '../../services/logger';
import schedule from '../../services/schedule';

import * as crud from '../crud';

export default (server:Hapi.Server) => {
  crud.createCrud(server, model.db.Presentation, {
    methods: [
      'list',
      'read',
      'delete',
    ],
    permissions: {
      write: EUserPermission.PlayerEdit,
    },
  });

  crud.createCrudCreate(server, schema, { handler: async ({ payload, user }) => {
    if (!hasPermission(user, EUserPermission.PlayerEdit)) {
      throw Boom.forbidden();
    }

    presentationModel.prepareInputPayload(payload);

    const entity = new model.db.Presentation(payload);

    return entity;
  }, postHandler: async ({ result }) => {
    await updatePreview(result);

    return result;
  } });

  crud.createCrudUpdate(server, schema, {
    handler: async ({ query, payload, user }) => {
      if (!hasPermission(user, EUserPermission.PlayerEdit)) {
        throw Boom.forbidden();
      }

      presentationModel.prepareInputPayload(payload);

      updatePreview(payload);
      updateCombinations(payload);
      updateRecordings(payload);

      return await model.db.Presentation
        .findOneAndUpdate(query, payload, { runValidators: true, new: true })
        .exec();
    },
  });

  crud.createCrudPatch(server, schema, {
    handler: async ({ query, payload, user, select, state }) => {
      if (!hasPermission(user, EUserPermission.PlayerEdit)) {
        throw Boom.forbidden();
      }

      presentationModel.prepareInputPayload(payload);

      state['doUpdate'] = Boolean(
        payload.render !== undefined ||
        payload.displays ||
        payload.slides ||
        payload.canvas,
      );

      if (state['doUpdate']) {
        select = {};
      }

      return await model.db.Presentation
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
        updateCombinations(result);
        updateRecordings(result);

        const update = {
          slides: result.slides,
          preview: result.preview,
        } as IPresentation;

        await model.db.Presentation
          .findOneAndUpdate({ _id: result.token }, update, { projection: { _id: true } })
          .lean()
          .exec()
          .catch(error => logger.warn({ error }, 'Presentation handler error'));
      }

      return result;
    },
  });
};

function updatePreview(entity:IPresentation):void {
  const preview = presentationModel.preparePresentationPreview(entity);

  if (preview) {
    entity.preview = preview;

    presentationModel.generatePresentationPreview(entity)
      .then(() => {
        logger.debug({ preview, entity: entity.token }, 'Presentation preview updated.');
      })
      .catch((error) => {
        logger.warn({ error, preview, entity: entity.token }, 'Presentation preview error.');
      });
  }
}

function updateRecordings(entity:IPresentation):void {
  presentationModel.handlePresentationRecordings(entity)
    .catch(error => logger.warn({ error }, 'Recording error.'));
}

function updateCombinations(payload:IPresentation):void {
  if (payload.displays?.length > 0 && payload.render) {
    payload.slides.forEach((slide) => {
      slide.combinations = schedule.getCombinations(payload, slide);
    });
  } else {
    payload.slides.forEach(slide => slide.combinations = null);
  }
}
