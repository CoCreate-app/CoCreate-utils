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

// ToDo: duplicate it is in crud.utils
export function checkValue(value) {
  if (!value) return false;
  if (/{{\s*([\w\W]+)\s*}}/g.test(value)) {
    return false;
  }

  return true;
}

// ToDo: Maybe can be deprciated
export function getValueFromJonDeep(json, path) {
	try {
		if (typeof json == 'undefined')
			return false;
		let subpath = path.split('.');
		let find = subpath.shift();
		if (subpath.length > 0) {
			return this.__getValueFromJonDeep(json[find], subpath.join('.'))
		}
		return json[find];
	}
	catch (error) {
		console.log(error)
		return false;
	}
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

export function logger(level = "all") {
  if (!['all', 'error', 'warn', 'log', 'off'].includes(level))
    throw new Error('level must be one of all, error, warn, log or off')
  return {
    error: function(msg) {
      // if (compoentToLoad.includes(comName))
      if (['all', 'error'].includes(level))
        console.error.apply(console, arguments)
    },
    warn: function(msg) {
      // if (compoentToLoad.includes(comName))
      if (['all', 'error', 'warn'].includes(level))
        console.warn.apply(console, arguments)
    },
    log: function() {
      // if (compoentToLoad.includes(comName))
      if (['all', 'error', 'warn', 'log'].includes(level))
        console.log.apply(console, arguments)
    },
  }

}

export async function waitForLoad(doc) {

  if (doc.contentDocument.readyState === 'loading') {
    try {
      await new Promise((resolve, reject) => {
        doc.contentWindow.addEventListener('load', (e) => resolve())
      });
    }
    catch (err) {
      console.error('iframe can not be loaded')
    }
    // this.observerElements(doc.contentWindow)
    // doc.contentWindow.observedByCCAttributes = true;
  }
}

//export function frameQuerySelector(comSelector) {
//     let [canvasSelector, selector] = comSelector.split(';');
//     let canvas = this.querySelector(canvasSelector);
//     if (!canvas)
//         return null;


//     return canvas.contentWindow.document.querySelector(selector);
// }

export function getComplexSelector(node, comSelector) {
  let selectors = comSelector.split(';');
  let canvas = node;
  for (let i = 0; i < selectors.length - 1; i++) {
    canvas = canvas.querySelector(selectors[i]);
    if (!canvas)
      return [];

  }
  return [this, [selectors.length - 1]]
}

export function frameQuerySelector(comSelector) {
  let [canvas, selector] = getComplexSelector(this, comSelector)
  if (canvas)
    return canvas.contentWindow.document.querySelector(selector);
  return null;

}

export function frameQuerySelectorAll(comSelector) {
  let [canvas, selector] = getComplexSelector(this, comSelector)
  if (canvas)
    return canvas.contentWindow.document.querySelectorAll(selector);
  return [];


}

async function complexSelector(comSelector, callback) {
	let [canvasSelector, selector] = comSelector.split(';');
	let canvas = document.querySelector(canvasSelector);
	if (!canvas) {
		console.warn('complex selector canvas now found for', comSelector);
		return;
	}

	if (canvas.contentDocument.readyState === 'loading') {
		try {
			await new Promise((resolve, reject) => {
				canvas.contentWindow.addEventListener('load', (e) => resolve());
			});
		}
		catch(err) {
			console.error('iframe can not be loaded');
		}
	}

	if (canvas.contentWindow.parent.CoCreate.observer && !observerInit.has(canvas.contentWindow)) {
		observerElements(canvas.contentWindow);
	}

	return callback(canvas.contentWindow.document, selector);
}

// function eid(html){
// 	let dom = domParser(html);
// 	let elements = dom.querySelectorAll('*');
// 	for (let element of elements){
// 	    if (!element.getAttribute('eid')){
// 	        element.setAttribute(eid, uuid(8))
// 	    } 
// 	}
// 	return dom.outterHTML
// }


// export function computeStyles(el, properties) {
//   let computed = window.getComputedStyle(el);
//   let result = {};
//   properties.forEach((property) => {
//     result[property] = parseInt(computed[property]);
//   });
//   return result;
// }

	function isObjectEmpty(obj) { 
	   for (var x in obj) { return false; }
	   return true;
	}

  export function getFrameSelector(selector) {
    let selectorArray = [];
    if (selector) {
      let selectors = [selector];
      if (selector.indexOf(',') !== -1){
        selectors = selector.split(',');
      }
      for (let selector of selectors){
        let els;
        if (selector.indexOf(';') !== -1) {
          let [documentSelector, targetSelector] = selector.split(';');
          let frame = document.querySelector(documentSelector);
          if (frame)
             selectorArray.push({Document: frame.contentDocument, selector: targetSelector});
        }
        else
          selectorArray.push({Document: document, selector: selector});
      }
      return selectorArray;
    }
  }
  export function queryFrameSelectorAll(selector) {
    let elements = [];
  
    if (selector) {
      let selectors = [selector];
      if (selector.indexOf(',') !== -1){
        selectors = selector.split(',');
      }
      for (let selector of selectors){
        let els;
        if (selector.indexOf(';') !== -1) {
          let [documentSelector, targetSelector] = selector.split(';');
          let frame = document.querySelector(documentSelector);
          if (frame) {
             let targetDocument = frame.contentDocument;
            if (targetSelector)
              els = targetDocument.querySelectorAll(targetSelector);
            else
              if (targetDocument.clickedElement)
                els = [targetDocument.clickedElement];
          }
        }
        else
          els = document.querySelectorAll(selector);
        if (els){
          els = Array.prototype.slice.call(els);
          elements = elements.concat(els);
        }
      }
      return elements;
    }
  }
  
  function decodeArray(data) {
		let keys = Object.keys(data);
		let objectData = {};

		keys.forEach((k) => {
			let nk = k
			if (/\[([0-9]*)\]/g.test(k)) {
				nk = nk.replace(/\[/g, '.');
				if (nk.endsWith(']'))
					nk = nk.slice(0, -1)
				nk = nk.replace(/\]./g, '.');
				nk = nk.replace(/\]/g, '.');
			}
			objectData[nk] = data[k];
		});
		return objectData;
	}

  function valueTypes(data) {
    let object = {}
    if ( typeof data === 'object' ) {
      // update['$set'] = {}
      for (let [key, value] of Object.entries(data)) {
        let val;
        let valueType = typeof value;
        switch(valueType) {
          case 'string':
            val = value
            break;
          case 'number':
            val = Number(value)
            break;
          case 'object':
            if (Array.isArray(value))
              val = new Array(...value)
            else
              val = new Object(value)
            break;
          default:
            val = value
        }
        object[key] = val
      }	
      return object;
    }
  }
  
  
export default {
  getElementPath,
  isValidSelector,
  joinBydelimiter,
  splitBydelimiter,
  parseTextToHtml,
  configExecuter,
  configMatch,
  getIframeFromPath,
  findIframeFromElement,
  getTopMostWindow,
  cssPath,
  allFrame,
  checkAttrValue,
  getAttributes,
  isJsonString,
  getParentFromElement,
  logger
}
