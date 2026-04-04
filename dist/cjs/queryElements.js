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
var queryElements_exports = {};
__export(queryElements_exports, {
  checkMediaQueries: () => checkMediaQueries,
  queryElements: () => queryElements
});
module.exports = __toCommonJS(queryElements_exports);
const queryTypes = [
  "$closest",
  "$parent",
  "$next",
  "$previous",
  "$document",
  "$frame",
  "$top"
];
const regexPatternString = `(?:${queryTypes.map((type) => type.replace("$", "\\$")).join("|")})`;
const queryTypesRegex = new RegExp(regexPatternString);
const mediaRanges = {
  xs: [0, 575],
  sm: [576, 768],
  md: [769, 992],
  lg: [993, 1200],
  xl: [1201, 0]
};
function checkMediaQueries(selector) {
  if (selector && selector.includes("@")) {
    const viewportWidth = window.innerWidth;
    let mediaViewport = false;
    let screenSizes = selector.split("@");
    selector = screenSizes.shift();
    for (let screenSize of screenSizes) {
      if (mediaRanges.hasOwnProperty(screenSize)) {
        const [minWidth, maxWidth] = mediaRanges[screenSize];
        if (viewportWidth >= minWidth && viewportWidth <= maxWidth) {
          mediaViewport = true;
          break;
        }
      }
    }
    if (!mediaViewport) return false;
  }
  return selector;
}
function queryType(element, type) {
  if (!element) return null;
  switch (type) {
    case "$top":
      return window.top.document;
    case "$frame":
      if (element.nodeType === 9) return window.frameElement;
      return element;
    case "$document":
      return element.nodeType === 9 ? element : element.ownerDocument;
    case "$closest":
      return element.nodeType === 9 ? element : element.ownerDocument;
    case "$parent":
      if (element.nodeType === 9) {
        return element.defaultView !== window.top ? element.defaultView.parent.document : null;
      }
      return element.parentElement;
    case "$next":
      return element.nextElementSibling;
    case "$previous":
      return element.previousElementSibling;
    default:
      return null;
  }
}
function querySelector(element, selector) {
  if (!element) return null;
  return selector.endsWith("[]") ? element.querySelectorAll(selector.slice(0, -2)) : element.querySelector(selector);
}
function queryElements({ element = document, prefix, selector }) {
  try {
    let elements = /* @__PURE__ */ new Set();
    if (!selector && element.nodeType === 1) {
      if (!prefix) {
        for (let attr of element.attributes) {
          if (attr.name.endsWith("-query") || attr.name.endsWith(".query")) {
            prefix = attr.name.slice(0, -6);
          }
        }
        if (!prefix) return [];
      }
      selector = element.getAttribute(prefix + "-query") || element.getAttribute(prefix + ".query");
      if (!selector) return [];
    }
    let selectors = selector.split(/,(?![^()\[\]]*[)\]])/g);
    for (let i = 0; i < selectors.length; i++) {
      if (!selectors[i]) continue;
      let queriedElement = element;
      if (selectors[i].includes("@")) {
        selectors[i] = checkMediaQueries(selectors[i]);
        if (selectors[i] === false) continue;
      }
      let remainingSelector = selectors[i].trim();
      let match;
      while ((match = queryTypesRegex.exec(remainingSelector)) !== null) {
        const matchIndex = match.index;
        const operator = match[0];
        const part = remainingSelector.substring(0, matchIndex).trim().replace(/,$/, "");
        if (part) {
          queriedElement = querySelector(queriedElement, part);
          if (!queriedElement) break;
        }
        remainingSelector = remainingSelector.substring(matchIndex + operator.length).trim();
        if (operator === "$closest") {
          let [closest, remaining = ""] = remainingSelector.split(/\s+/, 2);
          queriedElement = queriedElement.closest(closest);
          remainingSelector = remaining.trim();
        } else {
          queriedElement = queryType(queriedElement, operator);
        }
        if (!queriedElement) break;
      }
      if (!queriedElement) continue;
      if (remainingSelector) {
        queriedElement = querySelector(queriedElement, remainingSelector);
      }
      if (Array.isArray(queriedElement) || queriedElement instanceof HTMLCollection || queriedElement instanceof NodeList) {
        for (let el of queriedElement) {
          if (el instanceof Element) {
            elements.add(el);
          }
        }
      } else if (queriedElement instanceof Element) {
        elements.add(queriedElement);
      }
    }
    return Array.from(elements);
  } catch (e) {
    console.error(
      `CoCreate: Error in queryElements with selector: "${selector}".`,
      e
    );
    return [];
  }
}
