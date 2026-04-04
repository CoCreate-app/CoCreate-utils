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
var getRelativePath_exports = {};
__export(getRelativePath_exports, {
  getRelativePath: () => getRelativePath
});
module.exports = __toCommonJS(getRelativePath_exports);
function getRelativePath(path) {
  const isBrowser = typeof window !== "undefined";
  if (!path && isBrowser) {
    path = window.location.pathname.replace(/\/[^\/]*$/, "");
  }
  if (isBrowser && (location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    const srcIndex = path.indexOf("/src");
    if (srcIndex !== -1) {
      path = path.slice(srcIndex + 4);
    }
  }
  if (!path.endsWith("/")) {
    path += "/";
  }
  let depth = path.split("/").filter(Boolean).length;
  return depth > 0 ? "../".repeat(depth) : "./";
}
