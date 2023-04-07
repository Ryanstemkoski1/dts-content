import config from '../config';

import { EEntityType } from '../domain/service';

import { MongoClient } from '../services/mongodb';

import Allergen, { IAllergen } from './mongodb/allergen';
import Campaign, { ICampaign } from './mongodb/campaign';
import Channel, { IChannel } from './mongodb/channel';
import Database, { IDatabase } from './mongodb/database';
import Feed, { IFeed } from './mongodb/feed';
import Ingredient, { IIngredient } from './mongodb/ingredient';
import Location, { ILocation } from './mongodb/location';
import Media, { IMedia } from './mongodb/media';
import Menu, { IMenu } from './mongodb/menu';
import Modifier, { IModifier } from './mongodb/modifier';
import Presentation, { IPresentation } from './mongodb/presentation';
import Seat, { ISeat } from './mongodb/seat';
import { IDocument } from './mongodb/schema';
import Survey, { ISurvey } from './mongodb/survey';
import Tag, { ITag } from './mongodb/tag';
import Template, { ITemplate } from './mongodb/template';
// import Trivia, { ITrivia } from './mongodb/trivia';
import Theme, { ITheme } from './mongodb/theme';
import Workflow, { IWorkflow } from './mongodb/workflow';

import * as analytics from './analytics';
import * as entity from './entity';
import * as entry from './entry';
import { LocationModel } from './location';
import * as presentation from './presentation';

import mongoose, { Mongoose, Model } from 'mongoose';

export interface IModelDatabases {
  Allergen:Model<IAllergen, {}>;
  Campaign:Model<ICampaign, {}>;
  Channel:Model<IChannel, {}>;
  Database:Model<IDatabase, {}>;
  Feed:Model<IFeed, {}>;
  Ingredient:Model<IIngredient, {}>;
  Location:Model<ILocation, {}>;
  Media:Model<IMedia, {}>;
  Menu:Model<IMenu, {}>;
  Modifier:Model<IModifier, {}>;
  Presentation:Model<IPresentation, {}>;
  Tag:Model<ITag, {}>;
  Seat:Model<ISeat, {}>;
  Survey:Model<ISurvey, {}>;
  Theme:Model<ITheme, {}>;
  Template:Model<ITemplate, {}>;
  Workflow:Model<IWorkflow, {}>;
  // Trivia:Model<ITrivia, {}>;
}

export class Models {
  readonly analytics = analytics;
  readonly entity = entity;
  readonly entry = entry;
  readonly location = new LocationModel();
  readonly presentation = presentation;

  readonly mongo = new MongoClient();
  readonly mongoose:Mongoose = mongoose;

  public db:IModelDatabases;

  private isDisposed:boolean = false;

  public async connect() {
    await Promise.all([
      this.mongo.connect(),
    ]);

    try {
      await this.createSchema();
    } catch (error) {
      throw error;
    }
  }

  public async disconnect() {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;

    await Promise.all([
      this.mongo.disconnect(),
    ]);
  }

  public async truncate() {
  }

  public async checkHealth() {
    await this.location.read(config.realm);
  }

  public getEntityModel<T extends IDocument = any>(type:EEntityType):Model<T> {
    const name = type.charAt(0).toUpperCase() + type.slice(1);
    return this.db[name];
  }

  private async createSchema() {
    const mongoose = this.mongo.db;

    this.db = {
      Allergen: mongoose.model<IAllergen>((Allergen.statics as any).modelName(), Allergen),
      Campaign: mongoose.model<ICampaign>((Campaign.statics as any).modelName(), Campaign),
      Channel: mongoose.model<IChannel>((Channel.statics as any).modelName(), Channel),
      Database: mongoose.model<IDatabase>((Database.statics as any).modelName(), Database),
      Feed: mongoose.model<IFeed>((Feed.statics as any).modelName(), Feed),
      Ingredient: mongoose.model<IIngredient>((Ingredient.statics as any).modelName(), Ingredient),
      Location: mongoose.model<ILocation>((Location.statics as any).modelName(), Location),
      Media: mongoose.model<IMedia>((Media.statics as any).modelName(), Media),
      Menu: mongoose.model<IMenu>((Menu.statics as any).modelName(), Menu),
      Modifier: mongoose.model<IModifier>((Modifier.statics as any).modelName(), Modifier),
      Presentation: mongoose.model<IPresentation>((Presentation.statics as any).modelName(), Presentation),
      Seat: mongoose.model<ISeat>((Seat.statics as any).modelName(), Seat),
      Survey: mongoose.model<ISurvey>((Survey.statics as any).modelName(), Survey),
      Tag: mongoose.model((Tag.statics as any).modelName(), Tag),
      Template: mongoose.model<ITemplate>((Template.statics as any).modelName(), Template),
      Theme: mongoose.model<ITheme>((Theme.statics as any).modelName(), Theme),
      Workflow: mongoose.model<IWorkflow>((Workflow.statics as any).modelName(), Workflow),
      // Trivia: mongoose.model<ITrivia>(Trivia.statics.modelName(), Trivia),
    };

    await this.location.init(this.db);
  }
}

export default new Models();
