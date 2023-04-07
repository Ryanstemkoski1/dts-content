import { generateObjectSchema, enumField } from "../../schema";

export enum EPresentationWeatherType {
  Minimal = 'minimal',
  Regular = 'regular',
  Extended = 'extended',
  Forecast = 'forecast',
}

export enum EPresentationWeatherIcons {
  Plain = 'plain',
  Graphical = 'graphical',
}

export const schema = generateObjectSchema('PresentationElementWeather', {
  feed:        { type: String, trim: true, required: true },
  type:        enumField(EPresentationWeatherType, true),
  icons:       enumField(EPresentationWeatherIcons, true),
});

export default schema;
