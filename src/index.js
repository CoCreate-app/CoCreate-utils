(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(["./utils"], function(CoCreateUtils) {
        	return factory(CoCreateUtils)
        });
    } else if (typeof module === 'object' && module.exports) {
      const CoCreateUtils = require("./utils.js")
      module.exports = factory(CoCreateUtils);
    } else {
        root.returnExports = factory(root["./utils.js"]);
  }
}(typeof self !== 'undefined' ? self : this, function (CoCreateUtils) {
  return CoCreateUtils;
}));