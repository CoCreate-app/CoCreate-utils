/*globals DOMParser*/
export function getAttributes(element) {
  return element.getAttributeNames().reduce((attrMap, name) => {
    attrMap[name] = element.getAttribute(name);
    return attrMap;
  }, {});
}

export function* configMatch(elementConfig, element) {
  for (let config of elementConfig) {
    // if (!Array.isArray(config.selector))
    //   config.selector = [config.selector];

    if (config.selector && element.matches(config.selector)) yield config;
  }
  return;
}

export function parseTextToHtml(text) {
  let doc = new DOMParser().parseFromString(text, "text/html");
  if (doc.head.children[0]) return doc.head.children[0];
  else return doc.body.children[0];
}

export function cssPath(node) {
  let pathSplits = [];
  do {
    if (!node || !node.tagName) return false;
    let pathSplit = node.tagName.toLowerCase();
    if (node.id && node.tagName !== "BODY") pathSplit += "#" + node.id;

    if (node.classList.length && node.tagName !== "BODY") {
      node.classList.forEach((item) => {
        if (item.indexOf(":") === -1) pathSplit += "." + item;
      });
    }

    if (node.tagName !== "BODY" && node.parentNode) {
      let index = Array.prototype.indexOf.call(
        node.parentNode.children,
        node
      );
      pathSplit += `:nth-child(${index + 1})`;
    }

    pathSplits.unshift(pathSplit);
    node = node.parentNode;
  } while (node.tagName !== "HTML");

  return pathSplits.join(" > ");
}


// export function computeStyles(el, properties) {
//   let computed = window.getComputedStyle(el);
//   let result = {};
//   properties.forEach((property) => {
//     result[property] = parseInt(computed[property]);
//   });
//   return result;
// }

export default {
  parseTextToHtml,
  configMatch,
  getAttributes,
  cssPath
};
