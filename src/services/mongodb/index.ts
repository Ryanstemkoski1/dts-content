import config from '../../config';

import backend from '../backend';
import logger from '../logger';

import * as mongoose from 'mongoose';

export class MongoClient {
  private connection:mongoose.Connection;
  private task:any;

  public async connect():Promise<void> {
    let connectionString = process.env.MONGODB;

    try {
      if (!connectionString) {
        if (config.is_testing || config.is_debug) {
          throw new Error('MongoDB connection string not provided.');
        }

        logger.debug({}, 'Loading MongoDB credentials...');

        await (this.task || (this.task = new Promise((resolve, reject) => {
          backend.aws.secrets.getSecretValue({
            SecretId: config.secrets.mongodb,
          }).promise()
          .then((response) => {
            connectionString = JSON.parse(response.SecretString);
            this.task = null;
            resolve(undefined);
          })
          .catch(reject);
        })));
      } else {
        logger.debug({ connectionString }, 'Using provided MongoDB credentials.');
      }
    } catch (error) {
      logger.fatal({ error }, 'Unable to load MongoDB credentials.');
      throw error;
    }

    this.connection = mongoose.createConnection(connectionString, {
      dbName: 'snap',
    });

    this.connection.on('connecting', () => {
      logger.debug({}, 'Connecting to MongoDB...');
    });
    this.connection.on('connected', () => {
      logger.debug({}, 'MongoDB has connected.');
    });
    this.connection.on('error', (error) => {
      logger.fatal({ error }, 'MongoDB connection error.');
    });

    await this.waitConnect();

    this.connection.on('disconnected', () => {
      logger.debug({}, 'MongoDB has disconnected.');
    });
  }

  private async waitConnect():Promise<void> {
    await new Promise((resolve, reject) => {
      this.connection.on('connected', resolve);
      this.connection.on('error', reject);
    });
  }

  public async disconnect():Promise<void> {
    logger.debug({}, 'Disconnecting from MongoDB...');

    await new Promise((resolve, reject) => {
      if (!this.connection) {
        return resolve(undefined);
      }

      this.connection.close((error) => {
        this.connection = null;

        if (error) {
          return reject(error);
        }

        resolve(undefined);
      });
    });
  }

  public get db():mongoose.Connection {
    return this.connection;
  }

  public get mongoose():mongoose.Mongoose {
    return mongoose;
  }

  public createObjectId(id:string):mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId(id);
  }

  public generateObjectId():mongoose.Types.ObjectId {
    return new mongoose.Types.ObjectId();
  }
}
