import { generateObjectSchema } from '../schema';
import Element from './element';

export const schema = generateObjectSchema('ThemeElements', {
  button_home:      Element,
  button_back:      Element,
  button_cart:      Element,
  button_rotate:    Element,
  button_waiter:    Element,
  button_check:     Element,
  button_survey:    Element,
  button_chat:      Element,
  location_logo:    Element,
  location_map:     Element,
  button_settings:  Element,
  welcome_tile:     Element,
  receipt_logo:     Element,
  startup_audio:    Element,
  freosk_head_banner:     Element,
  freosk_button_back:     Element,
  freosk_button_more:     Element,
  freosk_button_reset:    Element,
  freosk_button_order:    Element,
  freosk_button_nextitem: Element,
  freosk_button_additem:  Element,
  freosk_button_addmore:  Element,
  oms_alert_audio:  Element,
});

export default schema;
