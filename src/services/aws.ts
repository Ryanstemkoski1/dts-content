import backend from './backend';

import { GraphQLSchema } from 'graphql';
import { applyMiddlewareToDeclaredResolvers } from 'graphql-middleware';
import isPromise from 'is-promise';

const service = {
  applySchemaTracer: (schema:GraphQLSchema):GraphQLSchema => {
    const fieldPathFromInfo = (info) => {
      let path = info.path;
      const segments = [];
      while (path) {
        segments.unshift(path.key);
        path = path.prev;
      }

      return segments.join('.');
    };

    const tracer = (resolver, parent, args, context, info) => {
      const segment = backend.aws.xray.getSegment();

      if (!segment) {
        return resolver();
      }

      const fieldPath = fieldPathFromInfo(info);

      return new Promise((resolve, reject) => {
        backend.aws.xray.captureAsyncFunc(`GraphQL ${fieldPath}`, (subsegment) => {
          const result = resolver();

          if (isPromise(result)) {
            result.then((data) => {
              subsegment.close();
              resolve(data);
            }, (error) => {
              subsegment.close(error);
              reject(error);
            });
          } else {
            segment.removeSubsegment(subsegment);
            subsegment.close();

            resolve(result);
          }
        }, segment);
      });
    };

    return applyMiddlewareToDeclaredResolvers(schema, tracer);
  },
};

export default service;
