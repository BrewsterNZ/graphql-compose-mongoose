function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { graphql } from 'graphql-compose';
import { recordHelperArgs } from './helpers';

async function createSingle(model, tc, recordData, resolveParams) {
  // eslint-disable-next-line new-cap
  let doc = new model(recordData);

  if (resolveParams.beforeRecordMutate) {
    doc = await resolveParams.beforeRecordMutate(doc, resolveParams);
    if (!doc) return null;
  }

  return doc.save();
}

export default function createMany(model, // === MongooseModel
tc, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver createMany() should be instance of Mongoose Model.');
  }

  if (!tc || tc.constructor.name !== 'ObjectTypeComposer') {
    throw new Error('Second arg for Resolver createMany() should be instance of ObjectTypeComposer.');
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

  const outputTypeName = `CreateMany${tc.getTypeName()}Payload`;
  const outputType = tc.schemaComposer.getOrCreateOTC(outputTypeName, t => {
    t.addFields({
      recordIds: {
        type: '[MongoID]!',
        description: 'Created document ID'
      },
      records: {
        type: new graphql.GraphQLNonNull(tc.getTypePlural()),
        description: 'Created documents'
      },
      createCount: {
        type: 'Int!',
        description: 'Count of all documents created'
      }
    });
  });
  const resolver = tc.schemaComposer.createResolver({
    name: 'createMany',
    kind: 'mutation',
    description: 'Creates Many documents with mongoose defaults, setters, hooks and validation',
    type: outputType,
    args: {
      records: {
        type: new graphql.GraphQLNonNull(new graphql.GraphQLList(recordHelperArgs(tc, _objectSpread({
          recordTypeName: `CreateMany${tc.getTypeName()}Input`,
          removeFields: ['id', '_id'],
          isRequired: true,
          requiredFields
        }, opts && opts.records)).record.type))
      }
    },
    resolve: async resolveParams => {
      const recordData = resolveParams.args && resolveParams.args.records || [];

      if (!Array.isArray(recordData) || recordData.length === 0) {
        throw new Error(`${tc.getTypeName()}.createMany resolver requires args.records to be an Array and must contain at least one record`);
      }

      for (const record of recordData) {
        if (!(typeof record === 'object') || Object.keys(record).length === 0) {
          throw new Error(`${tc.getTypeName()}.createMany resolver requires args.records to contain non-empty records, with at least one value`);
        }
      }

      const recordPromises = []; // concurrently create docs

      for (const record of recordData) {
        recordPromises.push(createSingle(model, tc, record, resolveParams));
      }

      const results = await Promise.all(recordPromises);
      const returnObj = {
        records: [],
        recordIds: [],
        createCount: 0
      };

      for (const doc of results) {
        if (doc) {
          returnObj.createCount += 1;
          returnObj.records.push(doc);
          returnObj.recordIds.push(doc._id);
        }
      }

      return returnObj;
    }
  });
  return resolver;
}