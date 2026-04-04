function uid(length = 36) {
  let pattern = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  if (length > 36) {
    length = 36;
  }
  let uuid = pattern.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0;
    var v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  }).substring(0, length);
  return uuid;
}
export {
  uid
};
