import { createCrud } from '../crud';
import model from '../../models';

export default (server) => {
  createCrud(server, model.db.Channel);
};
