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
var objectToSearchParams_exports = {};
__export(objectToSearchParams_exports, {
  objectToSearchParams: () => objectToSearchParams
});
module.exports = __toCommonJS(objectToSearchParams_exports);
function objectToSearchParams(paramsObj) {
  if (!paramsObj || typeof paramsObj !== "object" || Array.isArray(paramsObj)) {
    return "";
  }
  const filteredObj = {};
  for (const key in paramsObj) {
    if (Object.hasOwn(paramsObj, key)) {
      const value = paramsObj[key];
      if (value !== null && value !== void 0) {
        filteredObj[key] = value;
      }
    }
  }
  if (Object.keys(filteredObj).length === 0) {
    return "";
  }
  const searchParams = new URLSearchParams(filteredObj);
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}
