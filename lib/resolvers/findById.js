import { projectionHelper } from './helpers';
export default function findById(model, // === MongooseModel
tc, opts // eslint-disable-line no-unused-vars
) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver findById() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'ObjectTypeComposer') {
    throw new Error('Second arg for Resolver findById() should be instance of ObjectTypeComposer.');
  }

  return tc.schemaComposer.createResolver({
    type: tc.getType(),
    name: 'findById',
    kind: 'query',
    args: {
      _id: 'MongoID!'
    },
    resolve: resolveParams => {
      const args = resolveParams.args || {};

      if (args._id) {
        resolveParams.query = model.findById(args._id); // eslint-disable-line

        projectionHelper(resolveParams);
        return resolveParams.query.exec();
      }

      return Promise.resolve(null);
    }
  });
}