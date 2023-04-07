import { validateInteger, generateObjectSchema, enumField } from '../schema';

export enum EThemeTileStyle {
  Default = 'default',
  Regular = 'regular',
}

export const schema = generateObjectSchema('ThemeOptions', {
  tiles_style:          enumField(EThemeTileStyle, true),
  hide_prices:          { type: Boolean },
  screensaver_timeout:  {
    type: Number,
    validate: validateInteger(true),
  },
  background_interval:  {
    type: Number,
    validate: validateInteger(true),
  },
  screensaver_interval: {
    type: Number,
    validate: validateInteger(true),
  },
  color:                { type: String },
  background_color:     { type: String },
  secondary_color:      { type: String },
  text_color:           { type: String },
  lock_on_order:        { type: Boolean },
  hardened_unlock:      { type: Boolean },
  font_family:          { type: String },
  freosk_order_text:    { type: String },
});

export default schema;
