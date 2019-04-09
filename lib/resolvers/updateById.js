function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-param-reassign */
import { recordHelperArgs } from './helpers/record';
import findById from './findById';
export default function updateById(model, // === MongooseModel
tc, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver updateById() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'ObjectTypeComposer') {
    throw new Error('Second arg for Resolver updateById() should be instance of ObjectTypeComposer.');
  }

  const findByIdResolver = findById(model, tc);
  const outputTypeName = `UpdateById${tc.getTypeName()}Payload`;
  const outputType = tc.schemaComposer.getOrCreateOTC(outputTypeName, t => {
    t.addFields({
      recordId: {
        type: 'MongoID',
        description: 'Updated document ID'
      },
      record: {
        type: tc.getType(),
        description: 'Updated document'
      }
    });
  });
  const resolver = tc.schemaComposer.createResolver({
    name: 'updateById',
    kind: 'mutation',
    description: 'Update one document: ' + '1) Retrieve one document by findById. ' + '2) Apply updates to mongoose document. ' + '3) Mongoose applies defaults, setters, hooks and validation. ' + '4) And save it.',
    type: outputType,
    args: _objectSpread({}, recordHelperArgs(tc, _objectSpread({
      recordTypeName: `UpdateById${tc.getTypeName()}Input`,
      requiredFields: ['_id'],
      isRequired: true
    }, opts && opts.record))),
    resolve: async resolveParams => {
      const recordData = resolveParams.args && resolveParams.args.record || {};

      if (!(typeof recordData === 'object')) {
        return Promise.reject(new Error(`${tc.getTypeName()}.updateById resolver requires args.record value`));
      }

      if (!recordData._id) {
        return Promise.reject(new Error(`${tc.getTypeName()}.updateById resolver requires args.record._id value`));
      }

      resolveParams.args._id = recordData._id;
      delete recordData._id; // We should get all data for document, cause Mongoose model may have hooks/middlewares
      // which required some fields which not in graphql projection
      // So empty projection returns all fields.

      resolveParams.projection = {};
      let doc = await findByIdResolver.resolve(resolveParams);

      if (resolveParams.beforeRecordMutate) {
        doc = await resolveParams.beforeRecordMutate(doc, resolveParams);
      }

      if (!doc) {
        throw new Error('Document not found');
      }

      if (recordData) {
        doc.set(recordData);
        await doc.save();
      }

      return {
        record: doc,
        recordId: tc.getRecordIdFn()(doc)
      };
    }
  });
  return resolver;
}