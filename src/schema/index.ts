import * as fs from 'fs';

require.extensions['.graphql'] = (module, filename) => {
  module.exports.default = fs.readFileSync(filename, 'utf8');
};

import extension from './extension.graphql';

export const extensionSchema = extension;
