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
export {
  ObjectId
};
