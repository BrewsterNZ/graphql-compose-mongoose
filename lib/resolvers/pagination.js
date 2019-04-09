function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* eslint-disable global-require */
export default function pagination(model, // === MongooseModel
tc, opts) {
  try {
    require.resolve('graphql-compose-pagination');
  } catch (e) {
    return undefined;
  }

  const preparePaginationResolver = require('graphql-compose-pagination').preparePaginationResolver;

  if (!preparePaginationResolver) {
    throw new Error('You should update `graphql-compose-pagination` package till 3.3.0 version or above');
  }

  const resolver = preparePaginationResolver(tc, _objectSpread({
    findResolverName: 'findMany',
    countResolverName: 'count'
  }, opts));
  return resolver;
}