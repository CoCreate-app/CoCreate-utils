/**
 * Created by jin
 * 2020-04-03
 */


// export function generateUUID(length = 36) {
//   // if (length == 10) {
//   //   var result           = '';
//   //   var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   //   var charactersLength = characters.length;
//   //   for ( var i = 0; i < length; i++ ) {
//   //     result += characters.charAt(Math.floor(Math.random() * charactersLength));
//   //   }

//   //   var dd = new Date().toTimeString();
//   //   var random = dd.replace(/[\W_]+/g, "").substr(0,6);
//   //   result += random;
//   //   return result;
//   // }

//   let d = new Date().getTime();
//   let d2 =
//     (window.performance &&
//       window.performance.now &&
//       window.performance.now() * 1000) ||
//     0;
//   let pattern = "uxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";

//   if (length <= pattern.length) {
//     pattern = pattern.substr(0, length);
//   }
//   else {
//     let add_len = length - pattern.length;
//     let sub_pattern = "-xxxyyxxx";

//     let group_n = Math.floor(add_len / sub_pattern.length);

//     for (let i = 0; i < group_n; i++) {
//       pattern += sub_pattern;
//     }

//     group_n = add_len - group_n * sub_pattern.length;
//     pattern += sub_pattern.substr(0, group_n);
//   }

//   let uuid = pattern.replace(/[xy]/g, function(c) {
//     var r = Math.random() * 16;
//     if (d > 0) {
//       var r = (d + r) % 16 | 0;
//       d = Math.floor(d / 16);
//     }
//     else {
//       var r = (d2 + r) % 16 | 0;
//       d2 = Math.floor(d2 / 16);
//     }
//     return (c == "x" ? r : (r & 0x7) | 0x8).toString(16);
//   });
//   return uuid;
// }

export function getParentFromElement(element, parent_class, attributes) {
  if (parent_class) {
    if (element.classList.contains(parent_class)) {
      return element;
    }

    let node = element.parentNode;
    while (node != null && node.classList) {
      if (node.classList.contains(parent_class)) {
        return node;
      }
      node = node.parentNode;
    }
  }
  else if (attributes) {
    if (attributes.every((attr) => element.attributes.hasOwnProperty(attr))) {
      return element;
    }

    let node = element.parentNode;
    while (node != null && node.attributes) {
      if (attributes.every((attr) => node.attributes.hasOwnProperty(attr))) {
        return node;
      }
      node = node.parentNode;
    }
  }

  return false;
}


export function isJsonString(str_data) {
  try {
    let json_data = JSON.parse(str_data);
    if (typeof json_data === "object" && json_data != null) {
      return true;
    }
    else {
      return false;
    }
  }
  catch (e) {
    return false;
  }
}

export function getAttributes(element) {
  return element.getAttributeNames().reduce((attrMap, name) => {
    attrMap[name] = element.getAttribute(name);
    return attrMap;
  }, {});
}

export function checkValue(value) {
  if (!value) return false;
  if (/{{\s*([\w\W]+)\s*}}/g.test(value)) {
    return false;
  }

  return true;
}
// hosseins utills

// function to go through all frames
export function allFrame(callback) {
  let allFrames = [{ document, window }];
  for (let frame of document.querySelectorAll("iframe")) {
    let frameDocument = frame.contentDocument || frame.contentWindow.document;
    let frameWindow = frame.contentWindow;
    allFrames.push({
      document: frameDocument,
      window: frameWindow,
      frameElement: frame,
    });
  }
  let result = new Set();
  for (let frame of allFrames) {
    let callbackResult = callback(frame);
    if (
      callbackResult &&
      typeof callbackResult[Symbol.iterator] === "function"
    )
      callbackResult.forEach((el) => result.add(el));
    else if (callbackResult) result.add(callbackResult);
  }

  return Array.from(result);
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

export function getTopMostWindow() {
  let parentWindow = window;
  while (parentWindow !== window.parent) parentWindow = window.parent;
  return parentWindow;
}

export function findIframeFromElement(windowObject, element) {
  let frameElement;
  allFrame((frame) => {
    if (frame.document.contains(element)) frameElement = frame.frameElement;
    // window.cc.findIframeFromElement(frame.window, element);
  });
  return frameElement;
}

export function getIframeFromPath(path) {
  let topWindow = getTopMostWindow;

  path.forEach((selector) => {
    if (topWindow) topWindow = topWindow.querySelector(selector);
  });
  return topWindow;
}
// DO NOT REMOVE

export function* configMatch(elementConfig, element) {
  for (let config of elementConfig) {
    // if (!Array.isArray(config.selector))
    //   config.selector = [config.selector];

    if (config.selector && element.matches(config.selector)) yield config;
  }
  return;
}


// export function configMatch2(elementConfig, element) {
//   let result = [];
//   for (let config of elementConfig) {
//     if (config.selector && element.matches(config.selector)) result.push(config);
//   }
//   return result;
// }

// DO NOT REMOVE

// an opiniated function uses configMatch2 to read configs
// WARNING: the config iterated from top to bottom. for deseired effect elementConfig should be reveresed
// typeof elementConfig: array of objects and every objects containing keys as false, true or a selector 
// element: the element to read attributes
// key: the key in which is in elementConfig and on match onSuccess callback will be called
export function configExecuter(element, key, onSuccess, elementConfig) {
  for (let config of configMatch(elementConfig || window.elementConfig, element))
    if (config[key] === true) return onSuccess(element, config);
    else if (config[key] === false) return false;
  else if (config[key] === undefined) continue;
  else if (isValidSelector(config[key]))
    return onSuccess(element, config, true);
  else console.warn("builder: wrong element config ", config);

  return false;
}

export function UUID(length = 10) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  var d = new Date().toTimeString();
  var random = d.replace(/[\W_]+/g, "").substr(0, 6);
  result += random;
  return result;
}

export function parseTextToHtml(text) {
  let doc = new DOMParser().parseFromString(text, "text/html");
  if (doc.head.children[0]) return doc.head.children[0];
  else return doc.body.children[0];
}

export function splitBydelimiter(str, delimiter) {
  return str.split(delimiter).map((s) => s.trim());
}

export function joinBydelimiter(str, delimiter) {
  return str.map((s) => s.trim()).join(delimiter);
}

export function isValidSelector(selector) {
  try {
    document.createDocumentFragment().querySelector(selector);
  }
  catch (error) {
    return false;
  }
  return true;
}

export function getElementPath(element, returnContext) {
  let path = [];

  let topWindow = window;
  let iframeElement = findIframeFromElement(topWindow, element);
  let p = cssPath(iframeElement);
  if (p) path.unshift(p);

  return returnContext ? { path, document: iframeElement || document } : path;
  //todo: support for nested iframe
  // while(iframeElement !== findIframeFromElement(topWindow,iframeElement))
  // {
  //   iframeElement = findIframeFromElement(topWindow,iframeElement);
  //   path.unshift(cssPath(iframeElement))
  // }
}


export default {
  getElementPath,
  isValidSelector,
  joinBydelimiter,
  splitBydelimiter,
  parseTextToHtml,
  UUID,
  configExecuter,
  configMatch,
  getIframeFromPath,
  findIframeFromElement,
  getTopMostWindow,
  cssPath,
  allFrame,
  checkValue,
  getAttributes,
  isJsonString,
  getParentFromElement
}
