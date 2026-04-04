var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var objectToDotNotation_exports = {};
__export(objectToDotNotation_exports, {
  objectToDotNotation: () => objectToDotNotation
});
module.exports = __toCommonJS(objectToDotNotation_exports);
function objectToDotNotation(input) {
  const results = {};
  function traverse(currentValue, path) {
    if (typeof currentValue !== "object" || currentValue === null) {
      if (path !== void 0 && path !== null && path !== "") {
        results[path] = currentValue;
      }
      return;
    }
    if (Array.isArray(currentValue)) {
      if (currentValue.length > 0) {
        currentValue.forEach((item, index) => {
          const nextPath = `${path}[${index}]`;
          traverse(item, nextPath);
        });
      } else if (path) {
      }
    } else {
      const keys = Object.keys(currentValue);
      if (keys.length > 0) {
        keys.forEach((key) => {
          const nextPath = path ? `${path}.${key}` : key;
          traverse(currentValue[key], nextPath);
        });
      } else if (path) {
      }
    }
  }
  traverse(input, "");
  return results;
}
