// Validate all presentations and templates

// SSH tunnel to MongoDB at localhost:27000:
// ssh -N -L localhost:27000:MONGO_IP:27017 \
//   -i /Users/Artem/.ssh/dts-root.pem \
//   ec2-user@dts-service-content-staging.us-west-2.elasticbeanstalk.com

try {
  require('dotenv').config();
} catch (err) {}

import config from '../config';
import model from '../models';
import server from '../server';

import * as utils from '../routes/utils';

import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client/core';
import fetch from 'cross-fetch';
import * as Bluebird from 'bluebird';
import { Model } from 'mongoose';

const CONCURRENCY = 30;

async function init() {
  await server.start();
}

async function runCheck(model:Model<any, {}>) {
  const name = utils.getModelName(model.schema);

  console.log(name);

  const schema = utils.documentModel(model.schema, {
    operation: 'read',
  });

  const menus = model
    .find({})
    .select({ _id: true })
    .cursor();

  let tasks = [];

  await menus.eachAsync(async (entity) => {
    const task = async () => {
      const value = await model
        .findById(entity._id)
        .select({})
        .exec();

      const payload = JSON.parse(JSON.stringify(value.toJSON({ getters: true })));
      const validation = schema.validate(payload, { stripUnknown: true });

      if (validation.error) {
        console.log(name, entity._id, validation.error.details);
      }
    };

    tasks.push(task);

    if (tasks.length >= CONCURRENCY) {
      const ts = tasks;
      tasks = [];
      await Bluebird.map(ts, t => t(), { concurrency: CONCURRENCY });
    }
  });
}

async function runPresentationsGqlCheck() {
  console.log('runPresentationsGqlCheck');

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({
      fetch,
      uri: `http://localhost:${config.port}/graphql`,
      headers: {
        'X-Caller': config.name,
      },
    }),
  });

  const presentations = model.db.Presentation
  .find({})
  .select({ _id: true })
  .cursor();

  let tasks = [];

  await presentations.eachAsync(async (entity) => {
    const task = async () => {
      try {
        const res = await client.query({
          query: presentationQuery,
          variables:  {
            id: entity._id,
          },
        });
      } catch (error) {
        if (error.networkError?.result?.errors) {
          console.log(entity._id, error.networkError?.result?.errors);
        }

        if (error.graphQLErrors) {
          console.log(entity._id, error.graphQLErrors[0]);
        }

        throw error;
      }
    };

    tasks.push(task);

    if (tasks.length >= CONCURRENCY) {
      const ts = tasks;
      tasks = [];
      await Bluebird.map(ts, t => t(), { concurrency: CONCURRENCY });
    }
  });
}

async function runPresentationsCheck() {
  console.log('runPresentationsCheck');

  const schema = utils.documentModel(model.db.Presentation.schema, {
    operation: 'read',
  });

  const presentations = model.db.Presentation
    .find({})
    .select({ _id: true })
    .cursor();

  let tasks = [];

  await presentations.eachAsync(async (entity) => {
    const task = async () => {
      const value = await model.db.Presentation
        .findById(entity._id)
        .select({ preview_image: false })
        .exec();

      const payload = JSON.parse(JSON.stringify(value.toJSON({ getters: true })));
      const validation = schema.validate(payload, { stripUnknown: true });

      if (validation.error) {
        console.log('presentation', entity._id, validation.error.details);
      }
    };

    tasks.push(task);

    if (tasks.length >= CONCURRENCY) {
      const ts = tasks;
      tasks = [];
      await Bluebird.map(ts, t => t(), { concurrency: CONCURRENCY });
    }
  });
}

async function runTemplatesCheck() {
  console.log('runTemplatesCheck');

  const schema = utils.documentModel(model.db.Template.schema, {
    operation: 'read',
  });

  const templates = model.db.Template
    .find({})
    .select({ _id: true })
    .cursor();

  let tasks = [];

  await templates.eachAsync(async (entity) => {
    const task = async () => {
      const value = await model.db.Template
        .findById(entity._id)
        .select({ preview_image: false })
        .exec();

      const payload = JSON.parse(JSON.stringify(value.toJSON({ getters: true })));
      const validation = schema.validate(payload, { stripUnknown: true });

      if (validation.error) {
        console.log('template', entity._id, validation.error.details);
      }
    };

    tasks.push(task);

    if (tasks.length >= CONCURRENCY) {
      await Bluebird.map(tasks, t => t(), { concurrency: CONCURRENCY });
      tasks = [];
    }
  });
}

init()
.then(() => runCheck(model.db.Allergen))
.then(() => runCheck(model.db.Campaign))
.then(() => runCheck(model.db.Channel))
.then(() => runCheck(model.db.Database))
// .then(() => runCheck(model.db.Feed))
.then(() => runCheck(model.db.Ingredient))
// .then(() => runCheck(model.db.Media))
.then(() => runCheck(model.db.Seat))
.then(() => runCheck(model.db.Survey))
.then(() => runCheck(model.db.Tag))
.then(() => runCheck(model.db.Theme))
.then(() => runCheck(model.db.Modifier))
.then(() => runCheck(model.db.Menu))
.then(() => runPresentationsCheck())
.then(() => runTemplatesCheck())
.then(() => runPresentationsGqlCheck())
.catch(console.error)
.then(() => server.stop())
.then(() => process.exit(0));

const presentationQuery = gql`
query ReadPresentation($id:ID!) {
  presentation: readPresentation(id:$id) {
    created
    modified
    location
    position
    title
    schedule {
      start_time
      start
      end
      end_time
      from
      to
      days
      lock
      token
    }
    player_device
    player_devices
    canvas {
      wizard
      orientation
      width
      height
      display_width
      display_height
      ratio
      diagonal
      background_color
      grid {
        type
        x
        y
        token
      }
      modified
      output_width
      output_height
      player_type
      token
    }
    preview
    size
    screensaver
    category
    autoreload
    crossfade
    render
    tags
    type
    token
    slides {
      modified
      position
      schedule {
        start_time
        end_time
      }
      delay
      loop
      rewind
      hidden
      name
      elements {
        modified
        position
        type
        name
        group
        hidden
        schedule {
          start_time
          end_time
        }
        controls
        crossfade
        bitmap {
          source
          token
        }
        media {
          token
          mime
          width
          height
          pages
          original
        }
        text
        calendar {
          calendar
          readonly
          theme
          background
          token
        }
        clock {
          style
          timezone
          type
          token
        }
        container {
          medias {
            token
            mime
            width
            height
            pages
            original
          }
          animations {
            modified
            trigger
            effect
            duration
            delay
            hidden
            options
            token
          }
          delay
          delays
          manual
          controls
          crossfade
          direction
          count
          layout
          token
        }
        pdf {
          type
          media {
            token
            mime
            width
            height
            pages
            original
          }
          token
        }
        social {
          animations {
            modified
            trigger
            effect
            duration
            delay
            hidden
            options
            token
          }
          feed
          mode
          header {
            background_color
            border_color
            border_radius
            border_width
            stroke_style
            stroke_width
            stroke_color
            color
            font_family
            font_size
            font_weight
            font_style
            text_align
            opacity
            padding
            token
          }
          body {
            background_color
            border_color
            border_radius
            border_width
            stroke_style
            stroke_width
            stroke_color
            color
            font_family
            font_size
            font_weight
            font_style
            text_align
            opacity
            padding
            token
          }
          delay
          token
        }
        survey {
          token
        }
        weather {
          feed
          type
          icons
          token
        }
        twitter {
          username
          token
        }
        stream {
          type
          url
          token
        }
        layout {
          left
          right
          top
          bottom
        }
        shape {
          type
          token
        }
        style {
          background_color
          border_color
          border_radius
          border_width
          stroke_style
          stroke_width
          stroke_color
          color
          font_family
          font_size
          font_weight
          font_style
          text_align
          opacity
          padding
          token
        }
        web
        custom_css
        href {
          slide
          params
          token
        }
        html {
          text
          direction
          delay
          bindings {
            modified
            path
            feed
            filter
            type
            target
            transform {
              type
              datetime {
                format
                timezone
                token
              }
              token
            }
            token
          }
          version
          token
        }
        animations {
          modified
          trigger
          effect
          duration
          delay
          hidden
          options
          token
        }
        transitions {
          modified
          duration
          delay
          token
        }
        bindings {
          modified
          path
          feed
          filter
          type
          target
          transform {
            type
            datetime {
              format
              timezone
              token
            }
            token
          }
          token
        }
        size
        rotation
        lock
        muted
        media_layout
        token
      }
      animations {
        modified
        trigger
        effect
        duration
        delay
        hidden
        options
        token
      }
      combinations {
        modified
        display
        elements
        combinations
        token
      }
      tags
      device_tags
      source_presentation
      source_slide
      criteria {
        triggers {
          modified
          source
          attribute
          value_text
          value_number_min
          value_number_max
          token
        }
        transition
        token
      }
      media {
        token
        mime
        width
        height
        pages
        original
      }
      token
    }
    assets {
      token
      mime
      meta {
        etag
        size
        width
        height
        pages
        duration
        layers
        parsed
        font_family
        font_weight
        audiocodec
        videocodec
        token
      }
    }
    databases
    bitmaps {
      modified
      data
      token
    }
    displays {
      modified
      name
      model
      x
      y
      width
      height
      video_width
      video_height
      scale
      rotate
      diagonal
      bezel_side
      bezel_top
      bezel_bottom
      token
    }
  }
}
`;
