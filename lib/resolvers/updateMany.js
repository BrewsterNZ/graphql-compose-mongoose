function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-param-reassign */
import { limitHelper, limitHelperArgs, skipHelper, skipHelperArgs, recordHelperArgs, filterHelper, filterHelperArgs, sortHelper, sortHelperArgs } from './helpers';
import { toMongoDottedObject } from '../utils/toMongoDottedObject';
export default function updateMany(model, // === MongooseModel
tc, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver updateMany() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'ObjectTypeComposer') {
    throw new Error('Second arg for Resolver updateMany() should be instance of ObjectTypeComposer.');
  }

  const outputTypeName = `UpdateMany${tc.getTypeName()}Payload`;
  const outputType = tc.schemaComposer.getOrCreateOTC(outputTypeName, t => {
    t.addFields({
      numAffected: {
        type: 'Int',
        description: 'Affected documents number'
      }
    });
  });
  const resolver = tc.schemaComposer.createResolver({
    name: 'updateMany',
    kind: 'mutation',
    description: 'Update many documents without returning them: ' + 'Use Query.update mongoose method. ' + 'Do not apply mongoose defaults, setters, hooks and validation. ',
    type: outputType,
    args: _objectSpread({}, recordHelperArgs(tc, _objectSpread({
      recordTypeName: `UpdateMany${tc.getTypeName()}Input`,
      removeFields: ['id', '_id'],
      isRequired: true
    }, opts && opts.record)), filterHelperArgs(tc, model, _objectSpread({
      filterTypeName: `FilterUpdateMany${tc.getTypeName()}Input`,
      model
    }, opts && opts.filter)), sortHelperArgs(tc, model, _objectSpread({
      sortTypeName: `SortUpdateMany${tc.getTypeName()}Input`
    }, opts && opts.sort)), skipHelperArgs(), limitHelperArgs(_objectSpread({}, opts && opts.limit))),
    resolve: async resolveParams => {
      const recordData = resolveParams.args && resolveParams.args.record || {};

      if (!(typeof recordData === 'object') || Object.keys(recordData).length === 0) {
        return Promise.reject(new Error(`${tc.getTypeName()}.updateMany resolver requires ` + 'at least one value in args.record'));
      }

      resolveParams.query = model.find();
      filterHelper(resolveParams);
      skipHelper(resolveParams);
      sortHelper(resolveParams);
      limitHelper(resolveParams);
      resolveParams.query = resolveParams.query.setOptions({
        multi: true
      }); // eslint-disable-line

      if (resolveParams.query.updateMany) {
        resolveParams.query.updateMany({
          $set: toMongoDottedObject(recordData)
        });
      } else {
        // OLD mongoose
        resolveParams.query.update({
          $set: toMongoDottedObject(recordData)
        });
      }

      let res; // `beforeQuery` is experemental feature, if you want to use it
      // please open an issue with your use case, cause I suppose that
      // this option is excessive

      if (resolveParams.beforeQuery) {
        res = await resolveParams.beforeQuery(resolveParams.query, resolveParams);
      } else {
        res = await resolveParams.query.exec();
      }

      if (res.ok) {
        return {
          numAffected: res.n || res.nModified
        };
      } // unexpected response


      throw new Error(JSON.stringify(res));
    }
  });
  return resolver;
}