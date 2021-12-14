/*globals DOMParser*/
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
            if (eid) {
                pathSplit += `[eid="${eid}"]`;
                node = '';
            }
            else {
                if (node.classList.length) {
                    node.classList.forEach((item) => {
                        if (item.indexOf(":") === -1) pathSplit += "." + item;
                    });
                }
        
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

export function queryFrameSelector(selector) {
		if(selector.indexOf(';') !== -1) {
			let [frameSelector, target] = selector.split(';');
			let frame = document.querySelector(frameSelector);
			if (frame) {
			 	let Document = frame.contentDocument;
			 	let elements = Document.querySelectorAll(target);
			 	return elements;
			}
		}
}

export function queryFrameSelectorAll(selector) {
		if(selector.indexOf(';') !== -1) {
			let [frameSelector, target] = selector.split(';');
			let frame = document.querySelector(frameSelector);
			if (frame) {
			 	let Document = frame.contentDocument;
			 	let element = Document.querySelector(target);
			 	return element;
			}
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

export default {
  parseTextToHtml,
  getAttributes,
  cssPath,
  domParser
};
