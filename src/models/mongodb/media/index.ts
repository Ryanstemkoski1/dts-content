import Meta, { IMediaMetadata } from './meta';
import Worker, { IMediaWorker } from './worker';
import Comment, { IMediaCommentdata } from './comment'
import {
  IDocument,
  enumField,
  generateDocumentSchema,
  validateUuid,
  validateMime,
  generateObjectSchema,
} from '../schema';
import Schedule, { ISchedule } from '../schedule';
import { EEntityType } from '../../../domain/service';
import { Document } from 'mongoose';

export interface IMedia extends IDocument {
  parent?:string;
  mime?:string;
  name?:string;
  error?:string;
  category?:string;
  upload?:string;
  uploader?:string;
  url?:string;
  workers?:IMediaWorker[];
  status:EMediaStatus;
  meta:IMediaMetadata;
  hidden?:boolean;
  tags?:string[];
  published?:boolean;
  schedules:ISchedule[];
  comments:IMediaCommentdata[];
}

export enum EMediaStatus {
  Pending = 'pending',
  Processing = 'processing',
  Ready = 'ready',
  Error = 'error',
}

export enum EMediaMime {
  Binary = 'application/octet-stream',
}

export const schema = generateDocumentSchema<IMedia>(EEntityType.Media, {
  parent:         {
    type: String,
    validate: validateUuid(true),
    ref: EEntityType.Media,
    description: 'Parent media element.',
  },
  mime:           {
    type: String,
    trim: true,
    description: 'Original mime type.',
    validate: validateMime,
    default: EMediaMime.Binary,
  },
  name:           { type: String, trim: true, description: 'Media name.' },
  error:          { type: String, description: 'Processign error code.' },
  category:       { type: String, trim: true, description: 'Category name.' },
  upload:         { type: String, description: 'Original upload file path.' },
  uploader:       { type: String, description: 'File uploader User ID.' },
  url:            { type: String, index: true, description: 'Original file URL.' },
  workers:        { type: [Worker] },
  status:         enumField(EMediaStatus),
  meta:           { type: Meta },
  hidden:         { type: Boolean, description: 'File is hidden from the list.' },
  tags:           { type: [String], trim: true, description: 'List of tags.'  },
  published:      { type: Boolean, description: 'Media is published for child locations' },
  schedules:      { type: [Schedule], description: 'Media schedules' },
  comments:       { type: [Comment] }
}, {
  id: 'uuid',
  minimal: [
    'mime',
    'name',
    'category',
    'meta',
    'hidden',
    'tags',
    'parent',
    'schedules',
    'comments'
  ],
  readonly: [
    'parent',
    'upload',
    'uploader',
    'url',
  ],
});

export default schema;

export interface IMediaCreate extends Document {
  token?:string;
  location?:string;
  upload?:string;
  url?:string;
  parent?:string;
  mime?:string;
  category?:string;
  hidden?:boolean;
  name?:string;
  published?:boolean;
  tags?:string[];
  meta?:IMediaMetaWrite;
  comments?:IMediaCommentdata;
}

export interface IMediaWrite extends Document {
  category?:string;
  hidden?:boolean;
  name?:string;
  published?:boolean;
  tags?:string[];
  meta?:IMediaMetaWrite;
  status?:EMediaStatus;
  error?:string;
  mime?:string;
  comments?:IMediaCommentdata;
}

export interface IMediaMetaWrite extends Document {
  'font-family'?:string;
  'font-weight'?:number;
}

export const writeMetaSchema = generateObjectSchema('MediaMetaEditable', {
  'font-family':  { type: String, description: 'Font family' },
  'font-weight':  { type: Number, description: 'Font weight' },
});

export const writeCommentSchema = generateObjectSchema('MediaCommentEdiable', {
  body:           { type: String},
  mentions:           { type: [String]},
  user:          { type: String},
  createdAt:         { type: Number, default: Date.now }
})

export const createSchema = generateObjectSchema<IMediaCreate>('MediaCreate', {
  token:        { type: String, validate: validateUuid(true), description: 'Pre-assigned ID (S2S only).' },
  parent:       {
    type: String,
    validate: validateUuid(true),
    ref: EEntityType.Media,
    description: 'Parent media element.',
  },
  mime:         {
    type: String,
    trim: true,
    description: 'Original mime type.',
    validate: validateMime,
  },
  location:       {
    type: String,
    validate: validateUuid(true),
    description: 'Location ID.',
  },
  upload:       { type: String, trim: true, description: 'Uploaded temporary file path.' },
  url:          { type: String, trim: true, description: 'Remote URL to download.' },
  name:         { type: String, trim: true, description: 'Media name.' },
  category:     { type: String, description: 'Category name.' },
  hidden:       { type: Boolean, description: 'File is hidden from the list.' },
  published:    { type: Boolean, description: 'Media is published for child locations' },
  tags:         { type: [String], trim: true, description: 'List of tags.'  },
  meta:         { type: writeMetaSchema },
  schedules:    { type: [Schedule], description: 'Media schedules' },
  comments:     { type: [writeCommentSchema] }
});

export const updateSchema = generateObjectSchema<IMediaWrite>('MediaUpdate', {
  name:         { type: String, trim: true, description: 'Media name.' },
  category:     { type: String, description: 'Category name.' },
  hidden:       { type: Boolean, description: 'File is hidden from the list.' },
  published:    { type: Boolean, description: 'Media is published for child locations' },
  tags:         { type: [String], trim: true, description: 'List of tags.'  },
  meta:         { type: writeMetaSchema },
  schedules:      { type: [Schedule], description: 'Media schedules' },
  comments:     { type: [writeCommentSchema] }
});

export const patchSchema = generateObjectSchema<IMediaWrite>('MediaPatch', {
  name:         { type: String, trim: true, description: 'Media name.' },
  category:     { type: String, description: 'Category name.' },
  hidden:       { type: Boolean, description: 'File is hidden from the list.' },
  published:    { type: Boolean, description: 'Media is published for child locations' },
  tags:         { type: [String], trim: true, description: 'List of tags.'  },
  meta:         { type: Meta },
  status:       enumField(EMediaStatus, true),
  error:        { type: String, description: 'Processign error code.' },
  comments:     { type: Comment},
  mime:         {
    type: String,
    trim: true,
    description: 'Original mime type.',
    validate: validateMime,
  },
  schedules:      { type: [Schedule], description: 'Media schedules' },
});
