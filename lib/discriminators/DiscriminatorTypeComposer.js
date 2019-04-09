function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { EnumTypeComposer, schemaComposer as globalSchemaComposer, SchemaComposer, ObjectTypeComposer } from 'graphql-compose';
import { composeWithMongoose } from '../composeWithMongoose';
import { composeChildTC } from './composeChildTC';
import { mergeCustomizationOptions } from './utils/mergeCustomizationOptions';
import { prepareBaseResolvers } from './prepareBaseResolvers';
import { reorderFields } from './utils/reorderFields';

// sets the values on DKey enum TC
function setDKeyETCValues(discriminators) {
  const values = {};

  for (const DName in discriminators) {
    if (discriminators.hasOwnProperty(DName)) {
      values[DName] = {
        value: DName
      };
    }
  }

  return values;
} // creates an enum from discriminator names
// then sets this enum type as the discriminator key field type


function createAndSetDKeyETC(dTC, discriminators) {
  const DKeyETC = dTC.schemaComposer.createEnumTC({
    name: `EnumDKey${dTC.getTypeName()}${dTC.getDKey()[0].toUpperCase() + dTC.getDKey().substr(1)}`,
    values: setDKeyETCValues(discriminators)
  }); // set on Output

  dTC.extendField(dTC.getDKey(), {
    type: () => DKeyETC
  }); // set on Input

  dTC.getInputTypeComposer().extendField(dTC.getDKey(), {
    type: () => DKeyETC
  });
  return DKeyETC;
}

export class DiscriminatorTypeComposer extends ObjectTypeComposer {
  static _getClassConnectedWithSchemaComposer(schemaComposer) {
    class _DiscriminatorTypeComposer extends DiscriminatorTypeComposer {}

    _defineProperty(_DiscriminatorTypeComposer, "schemaComposer", schemaComposer || globalSchemaComposer);

    return _DiscriminatorTypeComposer;
  }
  /* ::
  constructor(gqType: any, schemaComposer: SchemaComposer<TContext>): DiscriminatorTypeComposer<TSource, TContext> {
    super(gqType, schemaComposer);
    return this;
  }
  */


  static createFromModel(baseModel, schemaComposer, opts) {
    if (!baseModel || !baseModel.discriminators) {
      throw Error('Discriminator Key not Set, Use composeWithMongoose for Normal Collections');
    }

    if (!(schemaComposer instanceof SchemaComposer)) {
      throw Error('DiscriminatorTC.createFromModel() should recieve SchemaComposer in second argument');
    } // eslint-disable-next-line


    opts = _objectSpread({
      reorderFields: true,
      schemaComposer
    }, opts);
    const baseTC = composeWithMongoose(baseModel, opts);

    const _DiscriminatorTypeComposer = this._getClassConnectedWithSchemaComposer(opts.schemaComposer);

    const baseDTC = new _DiscriminatorTypeComposer(baseTC.getType(), schemaComposer);
    baseDTC.opts = opts;
    baseDTC.childTCs = [];
    baseDTC.discriminatorKey = baseModel.schema.get('discriminatorKey') || '__t'; // discriminators an object containing all discriminators with key being DNames

    baseDTC.DKeyETC = createAndSetDKeyETC(baseDTC, baseModel.discriminators);
    reorderFields(baseDTC, baseDTC.opts.reorderFields, baseDTC.discriminatorKey);
    baseDTC.DInterface = baseDTC._createDInterface(baseDTC);
    baseDTC.setInterfaces([baseDTC.DInterface]);
    baseDTC.schemaComposer.addSchemaMustHaveType(baseDTC); // prepare Base Resolvers

    prepareBaseResolvers(baseDTC);
    return baseDTC;
  }

  _createDInterface(baseTC) {
    return this.schemaComposer.createInterfaceTC({
      name: `${baseTC.getTypeName()}Interface`,
      resolveType: value => {
        const childDName = value[baseTC.getDKey()];

        if (childDName) {
          return baseTC.schemaComposer.getOTC(childDName).getType();
        } // as fallback return BaseModelTC


        return baseTC.schemaComposer.getOTC(baseTC.getTypeName()).getType();
      },
      fields: () => {
        const baseFields = baseTC.getFieldNames();
        const interfaceFields = {};

        for (const field of baseFields) {
          interfaceFields[field] = baseTC.getFieldConfig(field);
        }

        return interfaceFields;
      }
    });
  }

  getDKey() {
    return this.discriminatorKey;
  }

  getDKeyETC() {
    return this.DKeyETC;
  }

  getDInterface() {
    return this.DInterface;
  }

  hasChildTC(DName) {
    return !!this.childTCs.find(ch => ch.getTypeName() === DName);
  }
  /* eslint no-use-before-define: 0 */


  discriminator(childModel, opts) {
    const customizationOpts = mergeCustomizationOptions(this.opts, opts);
    let childTC = composeWithMongoose(childModel, customizationOpts);
    childTC = composeChildTC(this, childTC, this.opts);
    this.schemaComposer.addSchemaMustHaveType(childTC);
    this.childTCs.push(childTC);
    return childTC;
  }

  setFields(fields) {
    const oldFieldNames = super.getFieldNames();
    super.setFields(fields);

    for (const childTC of this.childTCs) {
      childTC.removeField(oldFieldNames);
      childTC.addFields(fields);
      reorderFields(childTC, this.opts.reorderFields, this.getDKey(), super.getFieldNames());
    }

    return this;
  }

  setField(fieldName, fieldConfig) {
    super.setField(fieldName, fieldConfig);

    for (const childTC of this.childTCs) {
      childTC.setField(fieldName, fieldConfig);
    }

    return this;
  } // discriminators must have all interface fields


  addFields(newFields) {
    super.addFields(newFields);

    for (const childTC of this.childTCs) {
      childTC.addFields(newFields);
    }

    return this;
  }

  addNestedFields(newFields) {
    super.addNestedFields(newFields);

    for (const childTC of this.childTCs) {
      childTC.addNestedFields(newFields);
    }

    return this;
  }

  removeField(fieldNameOrArray) {
    super.removeField(fieldNameOrArray);

    for (const childTC of this.childTCs) {
      childTC.removeField(fieldNameOrArray);
    }

    return this;
  }

  removeOtherFields(fieldNameOrArray) {
    const oldFieldNames = super.getFieldNames();
    super.removeOtherFields(fieldNameOrArray);

    for (const childTC of this.childTCs) {
      const specificFields = childTC.getFieldNames().filter(childFieldName => !oldFieldNames.find(oldBaseFieldName => oldBaseFieldName === childFieldName));
      childTC.removeOtherFields(super.getFieldNames().concat(specificFields));
      reorderFields(childTC, this.opts.reorderFields, this.getDKey(), super.getFieldNames());
    }

    return this;
  }

  extendField(fieldName, partialFieldConfig) {
    super.extendField(fieldName, partialFieldConfig);

    for (const childTC of this.childTCs) {
      childTC.extendField(fieldName, partialFieldConfig);
    }

    return this;
  }

  reorderFields(names) {
    super.reorderFields(names);

    for (const childTC of this.childTCs) {
      childTC.reorderFields(names);
    }

    return this;
  }

  makeFieldNonNull(fieldNameOrArray) {
    super.makeFieldNonNull(fieldNameOrArray);

    for (const childTC of this.childTCs) {
      childTC.makeFieldNonNull(fieldNameOrArray);
    }

    return this;
  }

  makeFieldNullable(fieldNameOrArray) {
    super.makeFieldNullable(fieldNameOrArray);

    for (const childTC of this.childTCs) {
      childTC.makeFieldNullable(fieldNameOrArray);
    }

    return this;
  }

  deprecateFields(fields) {
    super.deprecateFields(fields);

    for (const childTC of this.childTCs) {
      childTC.deprecateFields(fields);
    }

    return this;
  } // relations with args are a bit hard to manage as interfaces i believe as of now do not
  // support field args. Well if one wants to have use args, you setType for resolver as this
  // this = this DiscriminantTypeComposer
  // NOTE, those relations will be propagated to the childTypeComposers and you can use normally.


  addRelation(fieldName, relationOpts) {
    super.addRelation(fieldName, relationOpts);

    for (const childTC of this.childTCs) {
      childTC.addRelation(fieldName, relationOpts);
    }

    return this;
  }

  setRecordIdFn(fn) {
    super.setRecordIdFn(fn);

    for (const childTC of this.childTCs) {
      childTC.setRecordIdFn(fn);
    }

    return this;
  }

}