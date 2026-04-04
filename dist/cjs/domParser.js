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
var domParser_exports = {};
__export(domParser_exports, {
  domParser: () => domParser
});
module.exports = __toCommonJS(domParser_exports);
function domParser(str) {
  try {
    var mainTag = str.match(/\<(?<tag>[a-z0-9]+)(.*?)?\>/).groups.tag;
  } catch (e) {
  }
  let doc;
  switch (mainTag) {
    case "html":
      doc = new DOMParser().parseFromString(str, "text/html");
      return doc.documentElement;
    case "body":
      doc = new DOMParser().parseFromString(str, "text/html");
      return doc.body;
    case "head":
      doc = new DOMParser().parseFromString(str, "text/html");
      return doc.head;
    default:
      let con = document.createElement("dom-parser");
      con.innerHTML = str;
      return con;
  }
}
