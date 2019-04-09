function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { Types } from 'mongoose';
const ObjectId = Types.ObjectId;

function _toMongoDottedObject(obj, target = {}, path = [], filter = false) {
  const objKeys = Object.keys(obj);
  /* eslint-disable */

  objKeys.forEach(key => {
    if (key.startsWith('$')) {
      if (path.length === 0) {
        target[key] = obj[key];
      } else {
        target[path.join('.')] = _objectSpread({}, target[path.join('.')], {
          [key]: obj[key]
        });
      }
    } else if (Object(obj[key]) === obj[key] && !(obj[key] instanceof ObjectId)) {
      _toMongoDottedObject(obj[key], target, Array.isArray(obj) && filter ? path : path.concat(key), filter);
    } else {
      target[path.concat(key).join('.')] = obj[key];
    }
  });

  if (objKeys.length === 0) {
    target[path.join('.')] = obj;
  }

  return target;
  /* eslint-enable */
}
/**
 * Convert object to dotted-key/value pair
 * { a: { b: { c: 1 }}} ->  { 'a.b.c': 1 }
 * { a: { $in: [ 1, 2, 3] }} ->  { 'a': { $in: [ 1, 2, 3] } }
 * { a: { b: { $in: [ 1, 2, 3] }}} ->  { 'a.b': { $in: [ 1, 2, 3] } }
 * { a: [ { b: 1 }, { c: 2 }]} -> { 'a.0.b': 1, 'a.1.c': 2 }
 * Usage:
 *   var toMongoDottedObject(obj)
 *   or
 *   var target = {}; toMongoDottedObject(obj, target)
 *
 * @param {Object} obj source object
 * @param {Object} target target object
 * @param {Array} path path array (internal)
 */


export function toMongoDottedObject(obj, target = {}, path = []) {
  return _toMongoDottedObject(obj, target, path);
}
/**
 * Convert object to dotted-key/value pair
 * { a: { b: { c: 1 }}} ->  { 'a.b.c': 1 }
 * { a: { $in: [ 1, 2, 3] }} ->  { 'a': { $in: [ 1, 2, 3] } }
 * { a: { b: { $in: [ 1, 2, 3] }}} ->  { 'a.b': { $in: [ 1, 2, 3] } }
 * { a: [ { b: 1 }, { c: 2 }]} -> { 'a.b': 1, 'a.c': 2 }
 * Usage:
 *   var toMongoFilterDottedObject(obj)
 *   or
 *   var target = {}; toMongoFilterDottedObject(obj, target)
 *
 * @param {Object} obj source object
 * @param {Object} target target object
 * @param {Array} path path array (internal)
 */

export function toMongoFilterDottedObject(obj, target = {}, path = []) {
  return _toMongoDottedObject(obj, target, path, true);
}