function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-param-reassign */
import { filterHelperArgs, sortHelperArgs } from './helpers';
import findOne from './findOne';
export default function removeOne(model, // === MongooseModel
tc, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver removeOne() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'ObjectTypeComposer') {
    throw new Error('Second arg for Resolver removeOne() should be instance of ObjectTypeComposer.');
  }

  const findOneResolver = findOne(model, tc, opts);
  const outputTypeName = `RemoveOne${tc.getTypeName()}Payload`;
  const outputType = tc.schemaComposer.getOrCreateOTC(outputTypeName, t => {
    t.addFields({
      recordId: {
        type: 'MongoID',
        description: 'Removed document ID'
      },
      record: {
        type: tc,
        description: 'Removed document'
      }
    });
  });
  const resolver = tc.schemaComposer.createResolver({
    name: 'removeOne',
    kind: 'mutation',
    description: 'Remove one document: ' + '1) Remove with hooks via findOneAndRemove. ' + '2) Return removed document.',
    type: outputType,
    args: _objectSpread({}, filterHelperArgs(tc, model, _objectSpread({
      filterTypeName: `FilterRemoveOne${tc.getTypeName()}Input`,
      model
    }, opts && opts.filter)), sortHelperArgs(tc, model, _objectSpread({
      sortTypeName: `SortRemoveOne${tc.getTypeName()}Input`
    }, opts && opts.sort))),
    resolve: async resolveParams => {
      const filterData = resolveParams.args && resolveParams.args.filter || {};

      if (!(typeof filterData === 'object') || Object.keys(filterData).length === 0) {
        return Promise.reject(new Error(`${tc.getTypeName()}.removeOne resolver requires at least one value in args.filter`));
      } // We should get all data for document, cause Mongoose model may have hooks/middlewares
      // which required some fields which not in graphql projection
      // So empty projection returns all fields.


      resolveParams.projection = {};
      let doc = await findOneResolver.resolve(resolveParams);

      if (resolveParams.beforeRecordMutate) {
        doc = await resolveParams.beforeRecordMutate(doc, resolveParams);
      }

      if (doc) {
        await doc.remove();
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