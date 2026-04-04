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
var dom_exports = {};
__export(dom_exports, {
  cssPath: () => import_cssPath.cssPath,
  domParser: () => import_domParser.domParser,
  escapeHtml: () => import_escapeHtml.escapeHtml,
  parseTextToHtml: () => import_parseTextToHtml.parseTextToHtml
});
module.exports = __toCommonJS(dom_exports);
var import_domParser = require("./domParser.js");
var import_parseTextToHtml = require("./parseTextToHtml.js");
var import_escapeHtml = require("./escapeHtml.js");
var import_cssPath = require("./cssPath.js");
