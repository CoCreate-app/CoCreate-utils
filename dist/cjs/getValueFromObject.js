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
var getValueFromObject_exports = {};
__export(getValueFromObject_exports, {
  getValueFromObject: () => getValueFromObject
});
module.exports = __toCommonJS(getValueFromObject_exports);
function getValueFromObject(object = {}, path = "", throwError = false) {
  try {
    if (!Array.isArray(object) && !Object.keys(object).length || !path) {
      if (throwError) throw new Error("Invalid input to getValueFromObject");
      return;
    }
    path = path.replace(/\[(\d+)\]/g, ".$1").replace(/^\./, "");
    let data = object, subpath = path.split(".");
    for (let i = 0; i < subpath.length; i++) {
      if (throwError && !(subpath[i] in data))
        throw new Error("Key not found in object: " + subpath[i]);
      data = data[subpath[i]];
      if (!data) break;
    }
    return data;
  } catch (error) {
    if (throwError) throw error;
  }
}
