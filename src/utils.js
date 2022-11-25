(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], function() {
        	return factory(true)
        });
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(false);
    } else {
        root.returnExports = factory(true);
  	}
}(typeof self !== 'undefined' ? self : this, function (isBrowser) {


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

    function dotNotationToObject(data, obj = {}) {
        try {	
            for (const [key, value] of Object.entries(data)) {	
                let newObject = obj
                let oldObject = new Object(obj)
                let keys = key.split('.');
                let length = keys.length - 1
                for (let i = 0; i < keys.length; i++) {
                    if (/\[([0-9]*)\]/g.test(keys[i])){
                        let [k, index] = keys[i].split('[');
                        index = index.slice(0, -1)
                        if (length == i){
                            newObject[k] = oldObject[k] || [];
                            newObject[k][index] = value;
                        }
                        else {
                            newObject[k] = oldObject[k] || [];
                            newObject[k][index] = oldObject[k][index] || {};
                        }
                        newObject = newObject[k][index]
                        oldObject = oldObject[k][index]
                    }
                    else {
                        if (length == i)
                            newObject[keys[i]] = value;
                        else
                            newObject[keys[i]] = oldObject[keys[i]] || {};

                        newObject = newObject[keys[i]]
                        oldObject = oldObject[keys[i]]
                    }
                }
            }
            return obj
        } catch (error) {
            console.log("Error converting dot notation to object", error);
            return false;
        }
    }

    function parseTextToHtml(text) {
        let doc = new DOMParser().parseFromString(text, "text/html");
        if (doc.head.children[0]) return doc.head.children[0];
        else return doc.body.children[0];
    }

    function cssPath(node, container) {
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
                // let eid = node.getAttribute('eid');
                // if (/{{\s*([\w\W]+)\s*}}/g.test(eid)) {
                // 	eid = false;
                // }
                // if (eid) {
                //     pathSplit += `[eid="${eid}"]`;
                //     node = '';
                // }
                // else {
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
            // }
            pathSplits.unshift(pathSplit);
        } while (node);
        let path = pathSplits.join(" > ")
        if (path && path.includes('<')) {
            let index = path.lastIndexOf(' >')
            if (index != -1)
                path = path.slice(0, index)
            else{
                index = path.lastIndexOf('<')
                path = path.slice(0, index)
            }
        }

        return path;
    }

    function domParser(str) {
        try {
            var mainTag = str.match(/\<(?<tag>[a-z0-9]+)(.*?)?\>/).groups.tag;
        } catch (e){
            // console.log(e, 'find position: can not find the main tag');
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

    function queryDocumentSelectorAll(selector) {
        let elements = [];

        if (selector) {
            let selectors = [selector];
            if (selector.indexOf(',') !== -1){
                selectors = selector.split(',');
            }
            for (let selector of selectors){
                let els;
                if (selector.indexOf(';') !== -1) {
                    let targetDocument;
                    let [documentSelector, targetSelector] = selector.split(';');
                    if (['parent', 'parentDocument'].includes(documentSelector))
                        targetDocument = window.parent.document;
                    else {
                        let frame = document.querySelector(documentSelector);
                        if (frame)
                            targetDocument = frame.contentDocument;
                    }
                    if (targetDocument){
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

    function queryDocumentSelector(selector) {
        if (selector) {
            let selectors = [selector];
            if (selector.indexOf(',') !== -1){
                selectors = selector.split(',');
            }
            for (let selector of selectors){
                let el;
                if (selector.indexOf(';') !== -1) {
                    let targetDocument;
                    let [documentSelector, targetSelector] = selector.split(';');
                    if (['parent', 'parentDocument'].includes(documentSelector))
                        targetDocument = window.parent.document;
                    else {
                        let frame = document.querySelector(documentSelector);
                        if (frame)
                            targetDocument = frame.contentDocument;
                    }
                    if (targetDocument){
                        if (targetSelector)
                            el = targetDocument.querySelector(targetSelector);
                        else
                            if (targetDocument.clickedElement)
                                el = [targetDocument.clickedElement];
                    }
                }
                else
                    el = document.querySelector(selector);
                if (el)
                    return el
            }
            return;
        }
    }

    function searchData(data, filter) {
		if (filter && filter.search) {
			if (filter['search']['type'] == 'and') {
				data = andSearch(data, filter['search']['value']);
			} else {
				data = orSearch(data, filter['search']['value']);
			}
			
			const total = data.length;
			const startIndex = filter.startIndex;
			const count = filter.count;
			let result_data = [];
			
			if (startIndex) 
				data = data.slice(startIndex, total);
			if (count)
				data = data.slice(0, count)
			
			result_data = data;
			filter['startIndex'] = startIndex
			if (count)
				filter['count'] = count
			filter['total'] = total
			return result_data
		} else {
			return data
		}
	}

	//. or operator
	function orSearch(results, search) {
		var tmp
		if (search && search.length > 0) {

			tmp = results.filter(function(item) {
				
				for (var key in item) {
					var value = item[key];
					var __status = false;
					
					var str_value = value;
					
					if (Array.isArray(str_value) || typeof str_value == 'number') {
						str_value = str_value.toString();
					}
					
					if (typeof str_value == 'string') {
						str_value = str_value.toUpperCase();
					}

					for (let i = 0; i < search.length; i++) {
						if (typeof search[i] == 'string' && typeof str_value == 'string') {
							if (str_value.indexOf(search[i].toUpperCase()) > -1) {
								__status = true;
								break;
							}
						} else {
							if (value == search[i]) {
								__status = true;
								break;
							}
						}
					}
					
					if (__status) {
						return true;
					}
				}
				
				return false;
			})  
		} else {
			tmp = results;
		}
		
		return tmp;
	}


	//. and operator
	function andSearch(results, search) {
		var tmp
		if (search && search.length > 0) {
					
			tmp = results.filter(function(item) {

				for (let i = 0; i < search.length; i++) {
					var __status = false;
					
					for (var key in item) {
						var value = item[key];
						
						if (typeof search[i] == 'string') {
							
							if (Array.isArray(value) || typeof value == 'number' ) {
								value = value.toString();
							} 
							
							if (typeof value == 'string') {
								value = value.toUpperCase();  
								if (value.indexOf(search[i].toUpperCase()) > -1) {
									__status = true;
									break;
								}
							}
							
						} else {
							if (value == search[i]) {
								__status = true;
								break;
							}
						}
					}
					
					if (!__status) {
						return false;  
					}
				}
				
				return true;
			})  
		} else {
			tmp = results;
		}
		
		return tmp;
	}
		
	function sortData(data, sorts) {
		if (!Array.isArray(sorts))
			sorts = [sorts]
		for (let sort of sorts) {
			let name = sort.name
			if (name) {
				data.sort((a, b) => {
					if (!a[name])				
						a[name] = ''
					if (!b[name])				
						b[name] = ''
					if (sort.type == '-1') {
						if (sort.valueType == 'number')
							return b[name] - a[name]
						else
							return b[name].localeCompare(a[name])
					} else {
						if (sort.valueType == 'number')
							return a[name] - b[name]
						else
							return a[name].localeCompare(b[name])
					}
				});
			}
		}
		return data;
	}	

	function queryData(item, query) {
		//. $contain, $range, $eq, $ne, $lt, $lte, $gt, $gte, $in, $nin, $geoWithin
		let flag = true;
		if (!item || !query) {
			return false;
		}
		if (Array.isArray(item)) return false;
		for (let i = 0; i < query.length; i++) {
			let fieldValue = item[query[i].name];
			if (fieldValue == undefined) 
				fieldValue = ''
			let values = query[i].value
			if (!Array.isArray(values))
				values = [values] 
			
			for (let value of values) {
				switch (query[i].operator) {
					case '$contain':
						if (!fieldValue.includes(value)) 
							flag = false;
						break;
					case '$range':
						if (value !== null && value !== null) {
							if (value[0] > fieldValue || value[1] <= fieldValue)
								flag = false;
						} else if (item.value[0] == null && value[1] >= fieldValue) {
							flag = false;
						} else if (item.value[1] == null && value[0] <= fieldValue) {
							flag = false;
						}
						break;
					case '$eq':
						if (fieldValue != value) flag = false; 
						break;
					case '$ne':
						if (fieldValue == value) flag = false;
						break;
					case '$lt':
						if (fieldValue >= value) flag = false;
						break;
					case '$lte':
						if (fieldValue > value) flag = false;
						break;
					case '$gt':
						if (fieldValue <= value) flag = false;
						break;
					case '$gte':
						if (fieldValue < value) flag = false;
						break;
					case '$in':
						if (!Array.isArray(fieldValue) || !fieldValue.some(x => value.includes(x))) flag = false;
						break;
					case '$nin':
						if (Array.isArray(fieldValue) && fieldValue.some(x => value.includes(x))) flag = false;
						break;
					default:
						// if (!Array.isArray(fieldValue) || !fieldValue.some(x => value.includes(x))) flag = false;
						if (fieldValue && !fieldValue.includes(value)) flag = false; 
						break;
				}
			}
		}
		return flag;
	}


    // function computeStyles(el, properties) {
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
    // 	    	if (parentElement) {
    // 		    	element = parentElement;
    // 		    } else {
    // 				return element;
    // 		    }
    // 	    } while (parentElement);
    // 	}

    if (isBrowser)
        clickedElement();

    return {
        parseTextToHtml,
        dotNotationToObject,
        cssPath,
        domParser,
        queryDocumentSelector,
        queryDocumentSelectorAll,
        searchData,
		andSearch,
		orSearch,
		sortData,
		queryData
    }

}));
