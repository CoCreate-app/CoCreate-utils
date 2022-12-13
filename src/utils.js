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

    const ObjectId = (rnd = r16 => Math.floor(r16).toString(16)) =>
    rnd(Date.now()/1000) + ' '.repeat(16).replace(/./g, () => rnd(Math.random()*16));
	
    function checkValue(value) {
		if (/{{\s*([\w\W]+)\s*}}/g.test(value))
			return false;
		else 
			return true
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

    function getValueFromObject(json, path) {
		try {
			if (typeof json == 'undefined' || !path)
				return;
			
			if (/\[([0-9]*)\]/g.test(path)) {
				path = path.replace(/\[/g, '.');
				if (path.endsWith(']'))
					path = path.slice(0, -1)
				path = path.replace(/\]./g, '.');
				path = path.replace(/\]/g, '.');
			}
			let jsonData = json, subpath = path.split('.');
			
			for (let i = 0; i < subpath.length; i++) {
				jsonData = jsonData[subpath[i]];
				if (!jsonData) return;
			}
			return jsonData;
		}catch(error){
			console.log("Error in getValueFromObject", error);
			return;
		}
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

    function queryData(data, query) {
		if (!data)
			return false;
            
        if (!Array.isArray(data))
            data = [data]

        if (!query)
            return true
        
        if (!Array.isArray(query))
            query = [query]
        if (!query.length)
            return true

        let queryResult = false
        for (let n = 0; n < data.length; n++) {
            for (let i = 0; i < query.length; i++) {
                let dataValue
                if (query[i].name.includes('.') || /\[([0-9]*)\]/g.test(query[i].name))
                    dataValue = getValueFromObject(data[n], query[i].name)
                else 
                    dataValue = data[n][query[i].name]
                if (dataValue == undefined)
                    dataValue = ''
                let logicalOperator = query[i].logicalOperator || 'or'
                let queryValues = query[i].value
                if (!Array.isArray(queryValues))
                    queryValues = [queryValues] 
                
                let queryStatus = false
                for (let queryValue of queryValues) {
                    if (query[i].caseSensitive != 'true' || query[i].caseSensitive != true) {
                        if (typeof dataValue == 'string') 
                            dataValue = dataValue.toLowerCase()
                        if (typeof queryValue == 'string') 
                            queryValue = queryValue.toLowerCase()
                    }

                    switch (query[i].operator) {
                        case '$includes':
                        case 'includes':
                            if (dataValue.includes(queryValue))
                                queryStatus = true
                            break;
                        case '$eq':
                            if (dataValue == queryValue)
                                queryStatus = true
                            break;
                        case '$ne':
                            if (dataValue != queryValue)
                                queryStatus = true
                            break;
                        case '$lt':
                            if (dataValue > queryValue)
                                queryStatus = true
                            break;
                        case '$lte':
                            if (dataValue >= queryValue)
                                queryStatus = true
                            break;
                        case '$gt':
                            if (dataValue < queryValue)
                                queryStatus = true
                            break;
                        case '$gte':
                            if (dataValue <= queryValue)
                                queryStatus = true
                            break;
                        case '$in':
                            if (Array.isArray(dataValue) && dataValue.some(x => queryValue.includes(x)))
                                queryStatus = true
                            break;
                        case '$nin':
                            if (!Array.isArray(dataValue) || !dataValue.some(x => queryValue.includes(x)))
                                queryStatus = true
                            break;
                        case '$range':
                            if (queryValue[0] !== null && queryValue[1] !== null) {
                                if (dataValue >= queryValue[0] && dataValue <= queryValue[1])
                                    queryStatus = true
                            } else if (queryValue[0] == null && dataValue <= queryValue[1]) {
                                queryStatus = true
                            } else if (queryValue[1] == null && dataValue >= queryValue[0]) {
                                queryStatus = true
                            }
                            break;

                        default:
                            if (dataValue.includes(queryValue)) 
                                queryStatus = true
                            break;
                    }
                    if (queryStatus == true) {
                        queryResult = true
                        break;
                    }

                }
                switch (logicalOperator) {
                    case 'and':
                        if (queryStatus == false)
                            return false
                        break;
                }
                // if (logicalOperator == 'and' && queryStatus == false)
                //     return false        
            }
        }
    
		return queryResult;
	}

    function searchData(data, search) {
        if (!search)
            return true
        if (!Array.isArray(search))
            search = [search]
        for (let i = 0; i < search.length; i++) {
            let searchValue = search[i].value
            if (!Array.isArray(searchValue))
                searchValue = [searchValue]
            for (let key in data) {
                let value = data[key];
                let status = false;
                switch (typeof value) {
                    case 'number':
                        value = value.toString();
                        break;
                    case 'object':
                        value = JSON.stringify(value)
                        break;
                    case 'function':
                        value = value.toString();
                        break;   
                }
                if (search[i].caseSensitive != 'true' || search[i].caseSensitive != true)
                    value = value.toLowerCase()
    
                for (let i = 0; i < searchValue.length; i++) {
                    let searchString = searchValue[i]
                    if (search[i].caseSensitive != 'true' || search[i].caseSensitive != true)
                        searchString = searchString.toLowerCase()
                    
                    if (value.indexOf(searchString) > -1)
                        status = true;

                    if (search[i].operator == 'or' && status)
                        return true;

                    if (search[i].operator == 'and' && !status)
                        return false;

                }  
            }
            if (search[i].value.length && search[i].operator == 'or')
                return false        
        
        }
        return true
	}
		
	function sortData(data, sort) {
		if (!Array.isArray(sort))
			sort = [sort]
		for (let i = 0; i < sort.length; i++) {
			let name = sort[i].name
			if (name) {
                try {
                    data.sort((a, b) => {
                        if (sort[i].direction == 'desc') {
                            switch (typeof b[name]) {
                                case 'string':
                                    if (!b[name]) 
                                        b[name] = ""
                                    return b[name].localeCompare(a[name])
                                case 'number':
                                    return b[name] - a[name]
                                case 'array':
                                case 'object':
                                    break;
                            }
                        } else {
                            switch (typeof a[name]) {
                                case 'string':
                                    if (!a[name]) 
                                        a[name] = ""
                                    return a[name].localeCompare(b[name])
                                case 'number':
                                    return a[name] - b[name]
                                case 'array':
                                case 'object':
                                    break;
                            }
                        }
                    });
                } catch (error) {
                    console.log(error)
                }
			}
		}
		return data;
	}
    
    function getAttributes(el) {
		if (!el) return;

		let attributes = window.CoCreateConfig.attributes;
		let object = {};

		for (let attribute of el.attributes) {
			let variable = attributes[attribute.name]
			if (variable) {
				object[variable] = attribute.value
			} 
		}

		return object
	}

	function getAttributeNames(variables) {
		let reversedObject = {}
		for (const key of Object.keys(CoCreateConfig.attributes)) {
			reversedObject[CoCreateConfig.attributes[key]] = key
		}

		let attributes = [];
		for (const variable of variables) {
			let attribute = reversedObject[variable]
			if (attribute)
				attributes.push(attribute)
		}
		return attributes
	}
    
    function setAttributeNames(attributes, overWrite) {
		let reversedObject = {}
		for (const key of Object.keys(CoCreateConfig.attributes)) {
			reversedObject[CoCreateConfig.attributes[key]] = key
		}

		for (const attribute of Object.keys(attributes)) {
			const variable = attributes[attribute]
			if (!reversedObject[variable] || overWrite != false)
				reversedObject[variable] = attribute
		}

		let revertObject = {}
		for (const key of Object.keys(reversedObject)) {
			revertObject[reversedObject[key]] = key
		}
		CoCreateConfig.attributes = revertObject
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
        ObjectId,
        checkValue,
        dotNotationToObject,
        getValueFromObject,
        domParser,
        parseTextToHtml,
        cssPath,
        queryDocumentSelector,
        queryDocumentSelectorAll,
        queryData,
        searchData,
		sortData,
        getAttributes,
        setAttributeNames,
        getAttributeNames
    }

}));
