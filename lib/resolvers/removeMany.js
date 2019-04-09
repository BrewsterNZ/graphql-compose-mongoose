function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-param-reassign */
import { filterHelperArgs, filterHelper } from './helpers';
export default function removeMany(model, // === MongooseModel
tc, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver removeMany() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'ObjectTypeComposer') {
    throw new Error('Second arg for Resolver removeMany() should be instance of ObjectTypeComposer.');
  }

  const outputTypeName = `RemoveMany${tc.getTypeName()}Payload`;
  const outputType = tc.schemaComposer.getOrCreateOTC(outputTypeName, t => {
    t.addFields({
      numAffected: {
        type: 'Int',
        description: 'Affected documents number'
      }
    });
  });
  const resolver = tc.schemaComposer.createResolver({
    name: 'removeMany',
    kind: 'mutation',
    description: 'Remove many documents without returning them: ' + 'Use Query.remove mongoose method. ' + 'Do not apply mongoose defaults, setters, hooks and validation. ',
    type: outputType,
    args: _objectSpread({}, filterHelperArgs(tc, model, _objectSpread({
      filterTypeName: `FilterRemoveMany${tc.getTypeName()}Input`,
      isRequired: true,
      model
    }, opts && opts.filter))),
    resolve: async resolveParams => {
      const filterData = resolveParams.args && resolveParams.args.filter || {};

      if (!(typeof filterData === 'object') || Object.keys(filterData).length === 0) {
        throw new Error(`${tc.getTypeName()}.removeMany resolver requires at least one value in args.filter`);
      }

      resolveParams.query = model.find();
      filterHelper(resolveParams);

      if (resolveParams.query.deleteMany) {
        resolveParams.query = resolveParams.query.deleteMany();
      } else {
        // old mongoose
        resolveParams.query = resolveParams.query.remove();
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
        // mongoose 5
        return {
          numAffected: res.n
        };
      } else if (res.result && res.result.ok) {
        // mongoose 4
        return {
          numAffected: res.result.n
        };
      } // unexpected response


      throw new Error(JSON.stringify(res));
    }
  });
  return resolver;
}