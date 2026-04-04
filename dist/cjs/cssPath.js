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
var cssPath_exports = {};
__export(cssPath_exports, {
  cssPath: () => cssPath
});
module.exports = __toCommonJS(cssPath_exports);
function cssPath(node, container) {
  let pathSplits = [];
  do {
    if (!node || !node.tagName) return false;
    let pathSplit = node.tagName.toLowerCase();
    if (node.id) {
      pathSplit += "#" + node.id;
      node = "";
    } else {
      let eid = node.getAttribute("eid");
      if (eid && !/{{\s*([\w\W]+)\s*}}/g.test(eid)) {
        pathSplit += `[eid="${eid}"]`;
        node = "";
      } else if (node.parentNode && node.parentNode.children.length > 1) {
        let children = [];
        for (let child of node.parentNode.children) {
          if (child.tagName == node.tagName) children.push(child);
        }
        let index = Array.prototype.indexOf.call(children, node);
        pathSplit += `:nth-of-type(${index + 1})`;
      }
      node = node.parentNode;
      if (node == null || node.tagName == "HTML" || node.tagName == "BODY" || node.tagName == "DOM-PARSER" || node.nodeName == "#document" || node.hasAttribute("contenteditable"))
        node = "";
    }
    pathSplits.unshift(pathSplit);
  } while (node);
  let path = pathSplits.join(" > ");
  if (path && path.includes("<")) {
    let index = path.lastIndexOf(" >");
    if (index != -1) path = path.slice(0, index);
    else {
      index = path.lastIndexOf("<");
      path = path.slice(0, index);
    }
  }
  return path;
}
