/* eslint-disable no-use-before-define, no-param-reassign, global-require */
import { schemaComposer as globalSchemaComposer } from 'graphql-compose';
import { convertModelToGraphQL } from './fieldsConverter';
import * as resolvers from './resolvers';
import MongoID from './types/mongoid';
export function composeWithMongoose(model, // === MongooseModel,
opts = {}) {
  const m = model;
  const name = opts && opts.name || m.modelName;
  const sc = opts.schemaComposer || globalSchemaComposer;
  sc.set('MongoID', MongoID);
  const tc = convertModelToGraphQL(m, name, sc);

  if (opts.description) {
    tc.setDescription(opts.description);
  }

  if (opts.fields) {
    prepareFields(tc, opts.fields);
  }

  tc.setRecordIdFn(source => source ? `${source._id}` : '');
  createInputType(tc, opts.inputType);

  if (!{}.hasOwnProperty.call(opts, 'resolvers') || opts.resolvers !== false) {
    createResolvers(m, tc, opts.resolvers || {});
  }

  tc.makeFieldNonNull('_id');
  return tc;
}
export function prepareFields(tc, opts) {
  if (Array.isArray(opts.only)) {
    const onlyFieldNames = opts.only;
    const removeFields = Object.keys(tc.getFields()).filter(fName => onlyFieldNames.indexOf(fName) === -1);
    tc.removeField(removeFields);
  }

  if (opts.remove) {
    tc.removeField(opts.remove);
  }
}
export function prepareInputFields(inputTypeComposer, inputFieldsOpts) {
  if (Array.isArray(inputFieldsOpts.only)) {
    const onlyFieldNames = inputFieldsOpts.only;
    const removeFields = Object.keys(inputTypeComposer.getFields()).filter(fName => onlyFieldNames.indexOf(fName) === -1);
    inputTypeComposer.removeField(removeFields);
  }

  if (inputFieldsOpts.remove) {
    inputTypeComposer.removeField(inputFieldsOpts.remove);
  }

  if (inputFieldsOpts.required) {
    inputTypeComposer.makeRequired(inputFieldsOpts.required);
  }
}
export function createInputType(tc, inputTypeOpts = {}) {
  const inputTypeComposer = tc.getInputTypeComposer();

  if (inputTypeOpts.name) {
    inputTypeComposer.setTypeName(inputTypeOpts.name);
  }

  if (inputTypeOpts.description) {
    inputTypeComposer.setDescription(inputTypeOpts.description);
  }

  if (inputTypeOpts.fields) {
    prepareInputFields(inputTypeComposer, inputTypeOpts.fields);
  }
}
export function createResolvers(model, tc, opts) {
  const names = resolvers.getAvailableNames();
  names.forEach(resolverName => {
    if (!{}.hasOwnProperty.call(opts, resolverName) || opts[resolverName] !== false) {
      const createResolverFn = resolvers[resolverName];

      if (createResolverFn) {
        const resolver = createResolverFn(model, tc, opts[resolverName] || {});

        if (resolver) {
          tc.setResolver(resolverName, resolver);
        }
      }
    }
  });
}