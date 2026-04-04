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
var attributes_exports = {};
__export(attributes_exports, {
  getAttributeNames: () => getAttributeNames,
  getAttributes: () => getAttributes,
  setAttributeNames: () => setAttributeNames
});
module.exports = __toCommonJS(attributes_exports);
function getAttributes(el) {
  if (!el) return;
  let attributes = window.CoCreateConfig.attributes;
  let object = {};
  for (let attribute of el.attributes) {
    let variable = attributes[attribute.name];
    if (variable) {
      object[variable] = el.getAttribute(attribute.name);
    }
  }
  return object;
}
function getAttributeNames(variables) {
  let reversedObject = {};
  for (const key of Object.keys(CoCreateConfig.attributes)) {
    reversedObject[CoCreateConfig.attributes[key]] = key;
  }
  let attributes = [];
  for (const variable of variables) {
    let attribute = reversedObject[variable];
    if (attribute) attributes.push(attribute);
  }
  return attributes;
}
function setAttributeNames(attributes, overWrite) {
  let reversedObject = {};
  for (const key of Object.keys(CoCreateConfig.attributes)) {
    reversedObject[CoCreateConfig.attributes[key]] = key;
  }
  for (const attribute of Object.keys(attributes)) {
    const variable = attributes[attribute];
    if (!reversedObject[variable] || overWrite != false)
      reversedObject[variable] = attribute;
  }
  let revertObject = {};
  for (const key of Object.keys(reversedObject)) {
    revertObject[reversedObject[key]] = key;
  }
  CoCreateConfig.attributes = revertObject;
}
