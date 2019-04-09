function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-param-reassign */
import { skipHelperArgs, recordHelperArgs, filterHelperArgs, sortHelperArgs } from './helpers';
import findOne from './findOne';
export default function updateOne(model, // === MongooseModel
tc, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver updateOne() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'ObjectTypeComposer') {
    throw new Error('Second arg for Resolver updateOne() should be instance of ObjectTypeComposer.');
  }

  const findOneResolver = findOne(model, tc, opts);
  const outputTypeName = `UpdateOne${tc.getTypeName()}Payload`;
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
    name: 'updateOne',
    kind: 'mutation',
    description: 'Update one document: ' + '1) Retrieve one document via findOne. ' + '2) Apply updates to mongoose document. ' + '3) Mongoose applies defaults, setters, hooks and validation. ' + '4) And save it.',
    type: outputType,
    args: _objectSpread({}, recordHelperArgs(tc, _objectSpread({
      recordTypeName: `UpdateOne${tc.getTypeName()}Input`,
      removeFields: ['id', '_id'],
      isRequired: true
    }, opts && opts.record)), filterHelperArgs(tc, model, _objectSpread({
      filterTypeName: `FilterUpdateOne${tc.getTypeName()}Input`,
      model
    }, opts && opts.filter)), sortHelperArgs(tc, model, _objectSpread({
      sortTypeName: `SortUpdateOne${tc.getTypeName()}Input`
    }, opts && opts.sort)), skipHelperArgs()),
    resolve: async resolveParams => {
      const recordData = resolveParams.args && resolveParams.args.record || null;
      const filterData = resolveParams.args && resolveParams.args.filter || {};

      if (!(typeof filterData === 'object') || Object.keys(filterData).length === 0) {
        return Promise.reject(new Error(`${tc.getTypeName()}.updateOne resolver requires at least one value in args.filter`));
      } // We should get all data for document, cause Mongoose model may have hooks/middlewares
      // which required some fields which not in graphql projection
      // So empty projection returns all fields.


      resolveParams.projection = {};
      let doc = await findOneResolver.resolve(resolveParams);

      if (resolveParams.beforeRecordMutate) {
        doc = await resolveParams.beforeRecordMutate(doc, resolveParams);
      }

      if (doc && recordData) {
        doc.set(recordData);
        await doc.save();
      }

      if (doc) {
        return {
          record: doc,
          recordId: tc.getRecordIdFn()(doc)
        };
      }

      return null;
    }
  });
  return resolver;
}