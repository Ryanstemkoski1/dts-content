const pkg = require('../package.json');

const NAME = pkg.name;
const VERSION = pkg.version;
const {
  NODE_ENV,
  PORT,
  TESTING,
} = JSON.parse(JSON.stringify(process.env));

const POSTFIX = NODE_ENV === 'production' ? 'production' : 'staging';
const ACCOUNT = '430104099533';
const REGION = 'us-west-2';
const IS_TESTING = Boolean(TESTING);

const config = {
  "is_testing": IS_TESTING,
  "is_debug": NODE_ENV === 'development',
  "name": NAME,
  "version": VERSION,
  "env": POSTFIX as 'production'|'staging',
  "port": PORT || 3000,
  "region": REGION,
  "account": ACCOUNT,
  "realm": "0e03796e-69b5-45b4-be96-45db1cdbe5ef",
  "is_tracing": !IS_TESTING && NODE_ENV !== 'development' && NODE_ENV !== 'production',
  "mongodb": {
    "database": IS_TESTING ? "test" : "snap",
  },
  "secrets": {
    "mongodb": `${NAME}-${POSTFIX}-mongo`,
  },
  "sqs": {
    "entity_event": `${NAME}-${POSTFIX}-entity-event`,
    "export_task": `${NAME}-${POSTFIX}-export-task`,
  },
  "s3": {
    "analytics": {
      "name": `dts-analytics-input`,
      "path_menuitem": `content-menuitem/`,
      "path_modifier": `content-modifier/`,
      "path_allergen": `content-allergen/`,
      "path_ingredient": `content-ingredient/`,
    },
  },
  "recording": {
    "max_displays": 5,
    "min_display_width": 480,
    "max_display_width": 3840,
    "min_display_height": 480,
    "max_display_height": 2160,
    "max_output_width": 3840,
    "max_output_height": 2160,
    "max_canvas_width": 15360,
    "max_canvas_height": 15360,
  },
};

export default config;
export type IConfig = typeof config;
