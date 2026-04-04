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
var ObjectId_exports = {};
__export(ObjectId_exports, {
  ObjectId: () => ObjectId
});
module.exports = __toCommonJS(ObjectId_exports);
let counter = 0;
function ObjectId(inputId) {
  if (inputId && /^[0-9a-fA-F]{24}$/.test(inputId)) {
    return {
      timestamp: inputId.substring(0, 8),
      processId: inputId.substring(8, 20),
      counter: inputId.substring(20),
      toString: function() {
        return this.timestamp + this.processId + this.counter;
      }
    };
  } else if (inputId) {
    throw new Error("Invalid ObjectId provided.");
  }
  const timestampHex = Math.floor(
    new Date((/* @__PURE__ */ new Date()).toISOString()).getTime() / 1e3
  ).toString(16).padStart(8, "0");
  const processIdHex = Math.floor(Math.random() * 17592186044416).toString(16).padStart(12, "0");
  counter = (counter + 1) % 1e4;
  if (counter < 2) {
    counter = Math.floor(Math.random() * (5e3 - 100 + 1)) + 100;
  }
  const counterHex = counter.toString(16).padStart(4, "0");
  return {
    timestamp: timestampHex,
    processId: processIdHex,
    counter: counterHex,
    toString: function() {
      return this.timestamp + this.processId + this.counter;
    }
  };
}
