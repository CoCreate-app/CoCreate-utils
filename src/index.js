/*globals DOMParser*/
function clickedElement() {
    document.addEventListener('click', e => {
        document.clickedElement = e.target;
    });
    let frameDocuments = window.top.frameDocuments;
    if (!frameDocuments){
        window.top.frameDocuments = new Map();
        frameDocuments = window.top.frameDocuments;
    }
    let frames = document.querySelectorAll('iframe');
    for (let frame of frames){
        let frameDocument = frame.contentDocument;
        if (!frameDocuments.has(frameDocument)){
            frameDocuments.set(frameDocument, '')
            frameDocument.addEventListener('click', e => {
                frameDocument.clickedElement = e.target;
            });
        }
    }
}

export function getAttributes(element) {
  return element.getAttributeNames().reduce((attrMap, name) => {
    attrMap[name] = element.getAttribute(name);
    return attrMap;
  }, {});
}

export function parseTextToHtml(text) {
  let doc = new DOMParser().parseFromString(text, "text/html");
  if (doc.head.children[0]) return doc.head.children[0];
  else return doc.body.children[0];
}

export function cssPath(node, container) {
    let pathSplits = [];
    do {
        if (!node || !node.tagName) return false;
        let pathSplit = node.tagName.toLowerCase();
        // if (node.tagName == "DOM-PARSER" || node.hasAttribute('contenteditable')){
        //     pathSplit = "[contenteditable]";
        //     node = '';
        // }
        if (node.id){
            pathSplit += "#" + node.id;
            node = '';
        }
        else {
            let eid = node.getAttribute('eid');
            if(/{{\s*([\w\W]+)\s*}}/g.test(eid)) {
    			eid = false;
    		}
            if (eid) {
                pathSplit += `[eid="${eid}"]`;
                node = '';
            }
            else {
                // if (node.classList.length) {
                //     node.classList.forEach((item) => {
                //         if (item.indexOf(":") === -1) pathSplit += "." + item;
                //     });
                // }
        
                if (node.parentNode && node.parentNode.children.length > 1) {
                    // ToDo: improve array logic so ignores javascript generated html??
                    let children = []
                    for (let child of node.parentNode.children){
                        // if (!child.matches('.mirror'))
                        //     children.push(child);
                        if (child.tagName == node.tagName)
                            children.push(child);
                    }
                    let index = Array.prototype.indexOf.call(
                        children,
                        node
                    );
                    // if (children.length > 1)
                    // pathSplit += `:nth-child(${index + 1})`;
                    pathSplit += `:nth-of-type(${index + 1})`;
                }
        
                // pathSplits.unshift(pathSplit);
                node = node.parentNode;
                if (node == null || node.tagName == "HTML" || node.tagName == "DOM-PARSER" || node.nodeName == "#document" || node.hasAttribute('contenteditable'))
                	node = '';
            }
        }
        pathSplits.unshift(pathSplit);
    } while (node);
    return pathSplits.join(" > ");
}

export function domParser(str) {
    try {
        var mainTag = str.match(/\<(?<tag>[a-z0-9]+)(.*?)?\>/).groups.tag;
    } catch (e){
        console.log('find position: can not find the main tag');
    }
    let doc;
    switch (mainTag) {
        case 'html':
            doc = new DOMParser().parseFromString(str, "text/html");
            return doc.documentElement;
        case 'body':
            doc = new DOMParser().parseFromString(str, "text/html");
            return doc.body;
        case 'head':
            doc = new DOMParser().parseFromString(str, "text/html");
            return doc.head;

        default:
            let con = document.createElement('dom-parser');
            con.innerHTML = str;
            return con;
    }
}

export function getFrameSelector(selector) {
	let selectorArray = [];
	if (selector) {
		let selectors = [selector];
		if(selector.indexOf(',') !== -1){
			selectors = selector.split(',');
		}
		for (let selector of selectors){
			let els;
			if(selector.indexOf(';') !== -1) {
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
		if(selector.indexOf(',') !== -1){
			selectors = selector.split(',');
		}
		for (let selector of selectors){
			let els;
			if(selector.indexOf(';') !== -1) {
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

// export function computeStyles(el, properties) {
//   let computed = window.getComputedStyle(el);
//   let result = {};
//   properties.forEach((property) => {
//     result[property] = parseInt(computed[property]);
//   });
//   return result;
// }

// 	function checkParent(element, selectors){
// 	    let parentElement;
// 	    do {
// 	    	parentElement = element.parentElement.closest(selectors);
// 	    	if(parentElement) {
// 		    	element = parentElement;
// 		    } else {
// 				return element;
// 		    }
// 	    } while (parentElement);
// 	}

clickedElement();

export default {
  parseTextToHtml,
  getAttributes,
  cssPath,
  domParser,
  queryFrameSelectorAll
};
