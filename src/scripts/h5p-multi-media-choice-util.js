/**
 * Merge the contents of two or more objects together and return it
 * @param {Object} out
 */
export default function deepExtend(out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];

    if (!obj) {
      continue;
    }

    if (Array.isArray(obj)) {
      out = obj;
    }

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object') out[key] = deepExtend(out[key], obj[key]);
        else out[key] = obj[key];
      }
    }
  }

  return out;
}
