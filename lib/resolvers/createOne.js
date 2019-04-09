function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable no-param-reassign, new-cap */
import { recordHelperArgs } from './helpers';
export default function createOne(model, // === MongooseModel
tc, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver createOne() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'ObjectTypeComposer') {
    throw new Error('Second arg for Resolver createOne() should be instance of ObjectTypeComposer.');
  }

  const tree = model.schema.obj;
  const requiredFields = [];

  for (const field in tree) {
    if (tree.hasOwnProperty(field)) {
      const fieldOptions = tree[field];

      if (fieldOptions.required) {
        requiredFields.push(field);
      }
    }
  }

  const outputTypeName = `CreateOne${tc.getTypeName()}Payload`;
  const outputType = tc.schemaComposer.getOrCreateOTC(outputTypeName, t => {
    t.addFields({
      recordId: {
        type: 'MongoID',
        description: 'Created document ID'
      },
      record: {
        type: tc,
        description: 'Created document'
      }
    });
  });
  const resolver = tc.schemaComposer.createResolver({
    name: 'createOne',
    kind: 'mutation',
    description: 'Create one document with mongoose defaults, setters, hooks and validation',
    type: outputType,
    args: _objectSpread({}, recordHelperArgs(tc, _objectSpread({
      recordTypeName: `CreateOne${tc.getTypeName()}Input`,
      removeFields: ['id', '_id'],
      isRequired: true,
      requiredFields
    }, opts && opts.record))),
    resolve: async resolveParams => {
      const recordData = resolveParams.args && resolveParams.args.record || {};

      if (!(typeof recordData === 'object') || Object.keys(recordData).length === 0) {
        throw new Error(`${tc.getTypeName()}.createOne resolver requires at least one value in args.record`);
      }

      let doc = new model(recordData);

      if (resolveParams.beforeRecordMutate) {
        doc = await resolveParams.beforeRecordMutate(doc, resolveParams);
        if (!doc) return null;
      }

      await doc.save();
      return {
        record: doc,
        recordId: tc.getRecordIdFn()(doc)
      };
    }
  });
  return resolver;
}