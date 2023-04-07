import config from '../config';
import models from '../models';

import allergen from './allergen';
import campaign from './campaign';
import channel from './channel';
import menu from './menu';
import database from './database';
import feed from './feed';
import ingredient from './ingredient';
import media from './media';
import modifier from './modifier';
import presentation from './presentation';
import seat from './seat';
import survey from './survey';
import tag from './tag';
import template from './template';
import theme from './theme';
import workflow from './workflow';
// import trivia from './trivia';

import * as Hapi from '@hapi/hapi';

export default (server:Hapi.Server) => {
  server.route({
    method: 'GET',
    path: '/',
    options: { auth: false },
    handler: () => {
      return `${config.name}:${config.version}`;
    },
  });

  server.route({
    method: 'GET',
    path: '/health',
    options: { auth: false },
    handler: async () => {
      await models.checkHealth();

      return `OK`;
    },
  });

  server.route({
    method: 'GET',
    path: '/favicon.ico',
    options: { auth: false },
    handler: () => {
      return '';
    },
  });

  allergen(server);
  campaign(server);
  channel(server);
  menu(server);
  database(server);
  feed(server);
  ingredient(server);
  media(server);
  modifier(server);
  presentation(server);
  seat(server);
  survey(server);
  tag(server);
  template(server);
  theme(server);
  workflow(server);
  // trivia(server);
};
