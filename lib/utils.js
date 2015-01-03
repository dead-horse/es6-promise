/*!
 * es6-promise - lib/utils.js
 * Copyright(c) 2014 dead_horse <dead_horse@qq.com>
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

/**
 * check x and y are the same
 * http://people.mozilla.org/~jorendorff/es6-draft.html#sec-samevalue
 *
 * @param {mixed} x
 * @param {mixed} y
 * @return {Boolean}
 */

exports.sameValue = function (x, y) {
  var typeofX = typeof x;
  var typeofY = typeof y;
  if (typeofX !== typeofY) {
    return false;
  }

  if (x === undefined || x === null) {
    return true;
  }

  if (typeofX === 'number') {
    if (Number.isNaN(x) && Number.isNaN(y)) {
      return true;
    }
    // TODO: -0 +0
    return x === y;
  }

  return x === y;
};
