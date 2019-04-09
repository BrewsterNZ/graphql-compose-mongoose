function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-param-reassign */
import { filterHelper, filterHelperArgs } from './helpers';
export default function count(model, // === MongooseModel
tc, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver count() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'ObjectTypeComposer') {
    throw new Error('Second arg for Resolver count() should be instance of ObjectTypeComposer.');
  }

  return tc.schemaComposer.createResolver({
    type: 'Int',
    name: 'count',
    kind: 'query',
    args: _objectSpread({}, filterHelperArgs(tc, model, _objectSpread({
      filterTypeName: `Filter${tc.getTypeName()}Input`,
      model
    }, opts && opts.filter))),
    resolve: resolveParams => {
      resolveParams.query = model.find();
      filterHelper(resolveParams);

      if (resolveParams.query.countDocuments) {
        // mongoose 5.2.0 and above
        return resolveParams.query.countDocuments().exec();
      } else {
        // mongoose 5 and below
        return resolveParams.query.count().exec();
      }
    }
  });
}