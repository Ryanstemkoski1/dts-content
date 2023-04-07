import { ISubDocument, generateSubDocumentSchema, enumField } from '../../schema';

import Animation, { IPresentationAnimation, schemaFilter as animationSchemaFilter } from '../animation';
import Binding, { IPresentationBinding, schemaFilter as bindingSchemaFilter } from '../binding';
import Bitmap, { IPresentationElementBitmap } from './bitmap';
import ElementClock, { IPresentationElementClock } from './clock';
import ElementCalendar, { IPresentationElementCalendar } from './calendar';
import Container, { IPresentationContainer } from './container';
import File, { IFile } from '../../file';
import Href, { schemaFilter as hrefSchemaFilter } from '../href';
import Html from './html';
import Layout from './layout';
import PDF from './pdf';
import Schedule from '../../schedule';
import Shape from './shape';
import Social, { ISocialElement } from './social';
import Style, { IPresentationElementStyle } from './style';
import Survey from './survey';
import Stream from './stream';
import Transition, { IPresentationTransition } from '../transition';
import Trivia from './trivia';
import Twitter from './twitter';
import Weather from './weather';
import Web, { IPresentationElementWeb } from './web';

export interface IPresentationElement extends ISubDocument {
  animations?:IPresentationAnimation[];
  position?:number;
  type:EPresentationElementType;
  name?:string;
  group?:string;
  schedule?:any;
  controls?:boolean;
  crossfade?:boolean;
  calendar?:IPresentationElementCalendar;
  container?:IPresentationContainer;
  clock?:IPresentationElementClock;
  bitmap?:IPresentationElementBitmap;
  bindings?:IPresentationBinding[];
  html?:any;
  social?:ISocialElement;
  hidden?:boolean;
  layout?:any;
  style?:IPresentationElementStyle;
  media?:IFile;
  transitions?:IPresentationTransition[];
  size?:number;
  rotation?:number;
  web?:string;
  web_options?:IPresentationElementWeb;
}

export enum EPresentationElementType {
  Bitmap = 'bitmap',
  Clock = 'clock',
  Media = 'media',
  Text = 'text',
  Shape = 'shape',
  Trivia = 'trivia',
  Twitter = 'twitter',
  Web = 'web',
  Container = 'container',
  TextContainer = 'textcontainer',
  Pdf = 'pdf',
  Survey = 'survey',
  Marquee = 'marquee',
  Social = 'social',
  Weather = 'weather',
  Stream = 'stream',
  Scheduler = 'scheduler',
}

export enum EPresentationElementMediaLayout {
  Stretch = 'stretch',
  Fit = 'fit',
}

export const schema = generateSubDocumentSchema<IPresentationElement>('PresentationElement', {
  position:     { type: Number, default: 0 },
  type:         enumField(EPresentationElementType, true),
  name:         { type: String, trim: true },
  group:        { type: String, trim: true },
  hidden:       { type: Boolean },
  schedule:     { type: Schedule },
  controls:     { type: Boolean },
  crossfade:    { type: Boolean },
  bitmap:       { type: Bitmap, required: false },
  media:        { type: File },
  text:         { type: String },
  calendar:     { type: ElementCalendar },
  clock:        { type: ElementClock },
  container:    { type: Container },
  pdf:          { type: PDF },
  social:       { type: Social },
  survey:       { type: Survey },
  trivia:       { type: Trivia },
  weather:      { type: Weather },
  twitter:      { type: Twitter },
  stream:       { type: Stream },
  layout:       { type: Layout },
  shape:        { type: Shape },
  style:        { type: Style },
  web:          { type: String },
  web_options:  { type: Web },
  custom_css:   { type: String },
  href:         {
    type: Href,
    get: (value) => {
      return value && hrefSchemaFilter(value) ? value : undefined;
    },
  },
  html:         { type: Html },
  animations:   {
    type: [Animation],
    get: (values:IPresentationAnimation[]) => {
      return (values || []).filter(animationSchemaFilter);
    },
  },
  transitions:  { type: [Transition] },
  bindings:     {
    type: [Binding],
    get: (values:IPresentationBinding[]) => {
      return (values || []).filter(bindingSchemaFilter);
    },
  },
  size:         { type: Number, default: 0 },
  rotation:     { type: Number },
  lock:         { type: Boolean },
  muted:        { type: Boolean },
  media_layout: enumField(EPresentationElementMediaLayout, true),
});

export default schema;
