import { IModelDatabases } from "../models";

import { EEntityType } from "@triggerpointmedia/dts-microservice/domain/entity";
import * as Hapi from "@hapi/hapi";
import * as AWSXRay from "aws-xray-sdk-core";

export interface IGraphContext {
  auth: Hapi.RequestAuth;
  request: Hapi.Request;
  segment?: AWSXRay.Segment;
}

export interface IGraphArgs {
  [x: string]: any;
}

export interface IGraphProjection {
  [x: string]: any;
}

export interface IGraphResolver<TParent = any> {
  field: string;
  description?: string;
  dependencies: string[];
  type: EEntityType;
  isArray?: boolean;
  method: (input: {
    db: IModelDatabases;
    parent: TParent;
    select: { [x: string]: boolean };
  }) => Promise<any>;
}
