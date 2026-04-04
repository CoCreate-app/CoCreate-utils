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
var index_exports = {};
__export(index_exports, {
  ObjectId: () => import_ObjectId.ObjectId,
  checkMediaQueries: () => import_queryElements.checkMediaQueries,
  checkValue: () => import_checkValue.checkValue,
  clickedElement: () => import_clickedElement.clickedElement,
  createUpdate: () => import_createUpdate.createUpdate,
  cssPath: () => import_cssPath.cssPath,
  default: () => index_default,
  domParser: () => import_domParser.domParser,
  dotNotationToObject: () => import_dotNotationToObject.dotNotationToObject,
  escapeHtml: () => import_escapeHtml.escapeHtml,
  getAttributeNames: () => import_attributes.getAttributeNames,
  getAttributes: () => import_attributes.getAttributes,
  getRelativePath: () => import_getRelativePath.getRelativePath,
  getValueFromObject: () => import_getValueFromObject.getValueFromObject,
  isValidDate: () => import_isValidDate.isValidDate,
  objectToDotNotation: () => import_objectToDotNotation.objectToDotNotation,
  objectToSearchParams: () => import_objectToSearchParams.objectToSearchParams,
  parseTextToHtml: () => import_parseTextToHtml.parseTextToHtml,
  processOperators: () => import_operators.processOperators,
  processOperatorsAsync: () => import_operators.processOperatorsAsync,
  queryData: () => import_dataQuery.queryData,
  queryElements: () => import_queryElements.queryElements,
  searchData: () => import_dataQuery.searchData,
  setAttributeNames: () => import_attributes.setAttributeNames,
  sortData: () => import_dataQuery.sortData,
  uid: () => import_uid.uid
});
module.exports = __toCommonJS(index_exports);
var import_getRelativePath = require("./getRelativePath.js");
var import_ObjectId = require("./ObjectId.js");
var import_uid = require("./uid.js");
var import_checkValue = require("./checkValue.js");
var import_isValidDate = require("./isValidDate.js");
var import_objectToSearchParams = require("./objectToSearchParams.js");
var import_dotNotationToObject = require("./dotNotationToObject.js");
var import_objectToDotNotation = require("./objectToDotNotation.js");
var import_getValueFromObject = require("./getValueFromObject.js");
var import_createUpdate = require("./createUpdate.js");
var import_domParser = require("./domParser.js");
var import_parseTextToHtml = require("./parseTextToHtml.js");
var import_escapeHtml = require("./escapeHtml.js");
var import_cssPath = require("./cssPath.js");
var import_queryElements = require("./queryElements.js");
var import_dataQuery = require("./dataQuery.js");
var import_attributes = require("./attributes.js");
var import_clickedElement = require("./clickedElement.js");
var import_operators = require("./operators.js");
var import_getRelativePath2 = require("./getRelativePath.js");
var import_ObjectId2 = require("./ObjectId.js");
var import_uid2 = require("./uid.js");
var import_checkValue2 = require("./checkValue.js");
var import_isValidDate2 = require("./isValidDate.js");
var import_objectToSearchParams2 = require("./objectToSearchParams.js");
var import_dotNotationToObject2 = require("./dotNotationToObject.js");
var import_objectToDotNotation2 = require("./objectToDotNotation.js");
var import_getValueFromObject2 = require("./getValueFromObject.js");
var import_createUpdate2 = require("./createUpdate.js");
var import_domParser2 = require("./domParser.js");
var import_parseTextToHtml2 = require("./parseTextToHtml.js");
var import_escapeHtml2 = require("./escapeHtml.js");
var import_cssPath2 = require("./cssPath.js");
var import_queryElements2 = require("./queryElements.js");
var import_dataQuery2 = require("./dataQuery.js");
var import_attributes2 = require("./attributes.js");
var import_clickedElement2 = require("./clickedElement.js");
var import_operators2 = require("./operators.js");
const utils = {
  getRelativePath: import_getRelativePath2.getRelativePath,
  ObjectId: import_ObjectId2.ObjectId,
  uid: import_uid2.uid,
  checkValue: import_checkValue2.checkValue,
  isValidDate: import_isValidDate2.isValidDate,
  dotNotationToObject: import_dotNotationToObject2.dotNotationToObject,
  objectToDotNotation: import_objectToDotNotation2.objectToDotNotation,
  getValueFromObject: import_getValueFromObject2.getValueFromObject,
  objectToSearchParams: import_objectToSearchParams2.objectToSearchParams,
  domParser: import_domParser2.domParser,
  parseTextToHtml: import_parseTextToHtml2.parseTextToHtml,
  escapeHtml: import_escapeHtml2.escapeHtml,
  cssPath: import_cssPath2.cssPath,
  queryElements: import_queryElements2.queryElements,
  checkMediaQueries: import_queryElements2.checkMediaQueries,
  queryData: import_dataQuery2.queryData,
  searchData: import_dataQuery2.searchData,
  sortData: import_dataQuery2.sortData,
  createUpdate: import_createUpdate2.createUpdate,
  getAttributes: import_attributes2.getAttributes,
  setAttributeNames: import_attributes2.setAttributeNames,
  getAttributeNames: import_attributes2.getAttributeNames,
  // safeParse,
  clickedElement: import_clickedElement2.clickedElement,
  processOperators: import_operators2.processOperators,
  processOperatorsAsync: import_operators2.processOperatorsAsync
};
var index_default = utils;
