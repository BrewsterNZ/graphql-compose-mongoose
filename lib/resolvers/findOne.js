function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-param-reassign */
import { skipHelper, skipHelperArgs, filterHelper, filterHelperArgs, sortHelper, sortHelperArgs, projectionHelper } from './helpers';
export default function findOne(model, // === MongooseModel
tc, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver findOne() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'ObjectTypeComposer') {
    throw new Error('Second arg for Resolver findOne() should be instance of ObjectTypeComposer.');
  }

  return tc.schemaComposer.createResolver({
    type: tc.getType(),
    name: 'findOne',
    kind: 'query',
    args: _objectSpread({}, filterHelperArgs(tc, model, _objectSpread({
      filterTypeName: `FilterFindOne${tc.getTypeName()}Input`,
      model
    }, opts && opts.filter)), skipHelperArgs(), sortHelperArgs(tc, model, _objectSpread({
      sortTypeName: `SortFindOne${tc.getTypeName()}Input`
    }, opts && opts.sort))),
    resolve: resolveParams => {
      resolveParams.query = model.findOne({}); // eslint-disable-line

      filterHelper(resolveParams);
      skipHelper(resolveParams);
      sortHelper(resolveParams);
      projectionHelper(resolveParams);
      return resolveParams.query.exec();
    }
  });
}