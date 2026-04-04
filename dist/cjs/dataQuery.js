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
var dataQuery_exports = {};
__export(dataQuery_exports, {
  queryData: () => queryData,
  searchData: () => searchData,
  sortData: () => sortData
});
module.exports = __toCommonJS(dataQuery_exports);
var import_getValueFromObject = require("./getValueFromObject.js");
var import_isValidDate = require("./isValidDate.js");
function isEqualArray(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (!isEqualObject(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
}
function isEqualObject(obj1, obj2) {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  if (keys1.length !== keys2.length) {
    return false;
  }
  for (const key of keys1) {
    if (obj1[key] !== obj2[key]) {
      return false;
    }
  }
  return true;
}
function queryMatch(data, query) {
  for (let key of Object.keys(query)) {
    let dataValue;
    try {
      dataValue = (0, import_getValueFromObject.getValueFromObject)(data, key, true);
    } catch (error) {
      return false;
    }
    if (typeof query[key] === "string" || typeof query[key] === "number" || typeof query[key] === "boolean") {
      if (Array.isArray(dataValue)) return dataValue.includes(query[key]);
      else return dataValue === query[key];
    } else if (Array.isArray(query[key])) {
      if (Array.isArray(dataValue)) {
        return isEqualArray(dataValue, query[key]);
      } else {
        return false;
      }
    } else {
      for (let property of Object.keys(query[key])) {
        if (property === "$options") continue;
        if (!property.startsWith("$")) {
          if (typeof dataValue !== "object") {
            return false;
          } else
            return queryMatch(
              { [property]: (0, import_getValueFromObject.getValueFromObject)(dataValue, property) },
              { [property]: query[key][property] }
            );
        } else {
          let queryValue = query[key][property];
          if ((0, import_isValidDate.isValidDate)(queryValue) && (0, import_isValidDate.isValidDate)(dataValue)) {
            queryValue = new Date(queryValue);
            dataValue = new Date(dataValue);
          }
          let queryStatus = false;
          switch (property) {
            case "$eq":
              if (Array.isArray(dataValue) && Array.isArray(queryValue)) {
                queryStatus = isEqualArray(dataValue, queryValue);
              } else {
                queryStatus = dataValue === queryValue;
              }
              break;
            case "$ne":
              if (Array.isArray(dataValue) && Array.isArray(queryValue)) {
                queryStatus = !isEqualArray(dataValue, queryValue);
              } else {
                queryStatus = dataValue !== queryValue;
              }
              break;
            case "$not":
              queryStatus = !queryMatch(data, {
                [key]: query[key]["$not"]
              });
              break;
            case "$lt":
              queryStatus = dataValue < queryValue;
              break;
            case "$lte":
              queryStatus = dataValue <= queryValue;
              break;
            case "$gt":
              queryStatus = dataValue > queryValue;
              break;
            case "$gte":
              queryStatus = dataValue >= queryValue;
              break;
            case "$in":
              if (Array.isArray(dataValue)) {
                queryStatus = dataValue.some(
                  (element) => queryValue.includes(element)
                );
              } else {
                queryStatus = queryValue.includes(dataValue);
              }
              break;
            case "$nin":
              if (Array.isArray(dataValue)) {
                queryStatus = !dataValue.some(
                  (element) => queryValue.includes(element)
                );
              } else {
                queryStatus = !queryValue.includes(dataValue);
              }
              break;
            case "$all":
              if (Array.isArray(dataValue) && Array.isArray(queryValue)) {
                queryStatus = queryValue.every(
                  (element) => dataValue.includes(element)
                );
              }
              break;
            case "$elemMatch":
              if (Array.isArray(data[key])) {
                queryStatus = data[key].some(
                  (element) => queryMatch(element, query[key][property])
                );
              }
              break;
            case "$size":
              if (Array.isArray(dataValue)) {
                queryStatus = dataValue.length === queryValue;
              }
              break;
            case "$exists":
              queryStatus = queryValue ? data.hasOwnProperty(key) : !data.hasOwnProperty(key);
              break;
            case "$regex":
              if (typeof dataValue === "string") {
                let regexFlag = query[key]["$options"] || "";
                let regex = new RegExp(queryValue, regexFlag);
                queryStatus = regex.test(dataValue);
              }
              break;
            case "$type":
              let dataType = typeof dataValue;
              if (Array.isArray(dataValue)) {
                dataType = "array";
              }
              queryStatus = dataType === queryValue;
              break;
            case "$mod":
              if (typeof dataValue === "number" && Array.isArray(queryValue) && queryValue.length === 2) {
                const [divisor, remainder] = queryValue;
                queryStatus = dataValue % divisor === remainder;
              }
              break;
            case "$where":
              if (typeof queryValue === "function") {
                try {
                } catch (error) {
                  console.error(
                    "Error in queryData $where function:",
                    error
                  );
                }
              }
              break;
            default:
              console.log("unknown operator");
              break;
          }
          if (!queryStatus) return false;
        }
      }
      return true;
    }
  }
}
function queryData(data, query) {
  if (!query) return true;
  if (query.$and) {
    for (let i = 0; i < query.$and.length; i++) {
      if (!queryData(data, query.$and[i])) return false;
    }
  }
  if (query.$nor) {
    for (let i = 0; i < query.$nor.length; i++) {
      if (queryData(data, query.$nor[i])) return false;
    }
  }
  for (let key of Object.keys(query)) {
    if (key === "$and" || key === "$or") continue;
    if (!queryMatch(data, { [key]: query[key] })) return false;
  }
  if (query.$or) {
    for (let i = 0; i < query.$or.length; i++) {
      if (queryData(data, query.$or[i])) return true;
    }
  }
  return true;
}
function searchData(data, search) {
  if (!search) return true;
  if (!Array.isArray(search)) search = [search];
  for (let i = 0; i < search.length; i++) {
    let searchValue = search[i].value;
    if (!Array.isArray(searchValue)) searchValue = [searchValue];
    for (let key in data) {
      let value = data[key];
      let status = false;
      switch (typeof value) {
        case "number":
          value = value.toString();
          break;
        case "object":
          value = JSON.stringify(value);
          break;
        case "function":
          value = value.toString();
          break;
      }
      if (search[i].caseSensitive != "true" || search[i].caseSensitive != true)
        value = value.toLowerCase();
      for (let i2 = 0; i2 < searchValue.length; i2++) {
        let searchString = searchValue[i2];
        if (search[i2].caseSensitive != "true" || search[i2].caseSensitive != true)
          searchString = searchString.toLowerCase();
        if (searchString === "" && search[i2].operator === "and") {
          if (value !== "") return false;
        }
        if (value.indexOf(searchString) > -1) status = true;
        if (status) return true;
        else if (search[i2].operator == "and") return false;
      }
    }
    if (search[i].value.length && search[i].operator == "or") return false;
  }
  return true;
}
function sortData(data, sort) {
  return data.sort((a, b) => {
    for (let i = 0; i < sort.length; i++) {
      let key = sort[i].key;
      if (a[key] == null && b[key] == null) continue;
      if (a[key] == null) return sort[i].direction === "desc" ? -1 : 1;
      if (b[key] == null) return sort[i].direction === "desc" ? 1 : -1;
      if (typeof a[key] !== typeof b[key]) {
        return typeof a[key] < typeof b[key] ? -1 : 1;
      }
      if (a[key] !== b[key]) {
        if (typeof a[key] === "string") {
          return sort[i].direction === "desc" ? b[key].localeCompare(a[key]) : a[key].localeCompare(b[key]);
        } else {
          return sort[i].direction === "desc" ? b[key] - a[key] : a[key] - b[key];
        }
      }
    }
    return 0;
  });
}
