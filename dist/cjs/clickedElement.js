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
var clickedElement_exports = {};
__export(clickedElement_exports, {
  clickedElement: () => clickedElement
});
module.exports = __toCommonJS(clickedElement_exports);
function clickedElement() {
  document.addEventListener("click", (e) => {
    document.clickedElement = e.target;
  });
  try {
    let frames = document.querySelectorAll("iframe");
    for (let frame of frames) {
      try {
        let frameDocument = frame.contentDocument;
        if (!frameDocument.clickedElementListenerAdded) {
          frameDocument.addEventListener("click", (e) => {
            frameDocument.clickedElement = e.target;
          });
          frameDocument.clickedElementListenerAdded = true;
        }
      } catch (iframeError) {
        console.log(
          `Cross-origin frame handling failed for: ${frame}`,
          iframeError
        );
      }
    }
  } catch (e) {
    console.log("Top-level frame document handling failed:", e);
  }
}
