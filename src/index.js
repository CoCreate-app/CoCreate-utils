(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], function () {
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

        try {
            let frameDocuments = window.top.frameDocuments;
            if (!frameDocuments) {
                window.top.frameDocuments = new Map();
                frameDocuments = window.top.frameDocuments;
            }
            let frames = document.querySelectorAll('iframe');
            for (let frame of frames) {
                let frameDocument = frame.contentDocument;
                if (!frameDocuments.has(frameDocument)) {
                    frameDocuments.set(frameDocument, '')
                    frameDocument.addEventListener('click', e => {
                        frameDocument.clickedElement = e.target;
                    });
                }
            }

        } catch (e) {
            console.log('cross-origin failed')
        }

    }

    const ObjectId = (id) => {
        // Define the rnd function
        const rnd = (r16) => Math.floor(r16).toString(16);

        if (id === undefined) {
            // If id is undefined, generate a new ObjectId
            return rnd(Date.now() / 1000) + '0'.repeat(16).replace(/./g, () => rnd(Math.random() * 16));
        } else {
            // Check if the provided id is a valid ObjectId
            const validIdRegex = /^[0-9a-fA-F]{24}$/;
            if (!validIdRegex.test(id)) {
                throw new Error('Invalid ObjectId');
            }
            return id; // Return the valid ObjectId as a string
        }
    };

    function checkValue(value) {
        if (/{{\s*([\w\W]+)\s*}}/g.test(value))
            return false;
        else
            return true
    }

    function dotNotationToObject(data, obj = {}) {
        try {
            for (const key of Object.keys(data)) {
                let value = data[key]
                let newObject = obj
                let oldObject = new Object(obj)
                let keys = key.split('.');
                let length = keys.length - 1
                for (let i = 0; i < keys.length; i++) {
                    if (/\[([0-9]*)\]/g.test(keys[i])) {
                        let [k, index] = keys[i].split('[');
                        index = index.slice(0, -1)
                        if (length == i) {
                            if (value === undefined)
                                newObject[k].splice(index, 1);
                            else
                                newObject[k][index] = value;
                        } else {
                            newObject[k] = oldObject[k] || [];
                            newObject[k][index] = oldObject[k][index] || {};
                            newObject = newObject[k][index]
                            oldObject = oldObject[k][index]
                        }
                    } else {
                        if (length == i) {
                            if (value === undefined)
                                delete newObject[keys[i]]
                            else
                                newObject[keys[i]] = value;
                        } else {
                            newObject[keys[i]] = oldObject[keys[i]] || {};
                            newObject = newObject[keys[i]]
                            oldObject = oldObject[keys[i]]
                        }
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

            path = path.replace(/\[(\d+)\]/g, '.$1');

            let jsonData = json, subpath = path.split('.');

            for (let i = 0; i < subpath.length; i++) {
                jsonData = jsonData[subpath[i]];
                if (!jsonData)
                    return jsonData;
            }
            return jsonData;
        } catch (error) {
            console.log("Error in getValueFromObject", error);
            return;
        }
    }

    function isObjectEmpty(obj) {
        for (var x in obj) { return false }
        return true;
    }

    function domParser(str) {
        try {
            var mainTag = str.match(/\<(?<tag>[a-z0-9]+)(.*?)?\>/).groups.tag;
        } catch (e) {
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

    function escapeHtml(html) {
        return html.replaceAll('&', '&amp').replaceAll('<', '&lt').replaceAll('>', '&gt;').replaceAll("'", '&#39;').replaceAll('"', '&quot;');
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
            if (node.id) {
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
                    // TODO: improve array logic so ignores javascript generated html??
                    let children = []
                    for (let child of node.parentNode.children) {
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
            else {
                index = path.lastIndexOf('<')
                path = path.slice(0, index)
            }
        }

        return path;
    }

    function queryElements({ element, prefix, type, selector }) {
        let elements = new Map()
        if (!element)
            element = document
        let hasAttribute = false

        if (selector) {
            if (!type)
                type = ['selector']
            else if (!Array.isArray(type))
                type = [type]
        } else
            type = ['selector', 'closest', 'parent', 'next', 'previous']

        for (let i = 0; i < type.length; i++) {
            let Selector = selector
            if (!Selector && element.nodeType !== 9) {

                let name = prefix + '-' + type[i]
                if (!element.hasAttribute(name))
                    continue
                hasAttribute = true
                Selector = element.getAttribute(name);
            }

            if (Selector) {

                let selectors = Selector.split(',');
                for (let j = 0; j < selectors.length; j++) {
                    let queriedElement = element
                    let specialSelectors = selectors[j].split(';')
                    for (let k = 0; k < specialSelectors.length; k++) {

                        // TODO: Support an array of queried elements and branch off to return matches for each
                        // if (!Array.isArray(queriedElement)) {
                        //     queriedElement = [queriedElement]
                        // }
                        if (k === 0) {
                            if (type[i] === 'parent')
                                queriedElement = queriedElement.parentElement
                            else if (type[i] === 'next')
                                queriedElement = queriedElement.nextElementSibling
                            else if (type[i] === 'previous')
                                queriedElement = queriedElement.previousElementSibling
                        }

                        switch (specialSelectors[k] = specialSelectors[k].trim()) {
                            case 'top':
                                queriedElement = window.top.document
                                break;
                            case 'frame':
                                if (queriedElement.nodeType === 9)
                                    queriedElement = queriedElement.window.frameElement;
                                else if (queriedElement.contentDocument)
                                    queriedElement = queriedElement.contentDocument;
                                break;
                            case 'document':
                                queriedElement = document
                                break;
                            case 'parent':
                                queriedElement = queriedElement.parentElement
                                break;
                            case 'next':
                                queriedElement = queriedElement.nextElementSibling
                                break;
                            case 'previous':
                                queriedElement = queriedElement.previousElementSibling
                                break;
                            default:
                                if (k === 0 && type[i] === 'closest')
                                    queriedElement = queriedElement.closest(specialSelectors[k])
                                else if (specialSelectors[k].endsWith('[]'))
                                    queriedElement = queriedElement.querySelectorAll(specialSelectors[k].slice(0, -2))
                                else
                                    queriedElement = queriedElement.querySelector(specialSelectors[k])
                        }
                        if (!queriedElement)
                            break;
                    }

                    if (Array.isArray(queriedElement) || queriedElement instanceof HTMLCollection || queriedElement instanceof NodeList) {
                        for (let el of queriedElement)
                            elements.set(el, '')
                    } else if (queriedElement) {
                        elements.set(queriedElement, '')
                    }

                }
            } else if (Selector === '') {
                if (type[i] === 'parent')
                    elements.set(element.parentElement, '')
                else if (type[i] === 'next')
                    elements.set(element.nextElementSibling, '')
                else if (type[i] === 'previous')
                    elements.set(element.previousElementSibling, '')
            }
        }

        if (!hasAttribute && !selector)
            elements = false
        else
            elements = Array.from(elements.keys())

        return elements
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
                if (query[i].key.includes('.') || /\[([0-9]*)\]/g.test(query[i].key))
                    dataValue = getValueFromObject(data[n], query[i].key)
                else
                    dataValue = data[n][query[i].key]
                if (dataValue == undefined)
                    dataValue = ''
                let logicalOperator = query[i].logicalOperator || 'and'
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
                            // if (queryValue === "" && logicalOperator === 'and') {
                            //     if (dataValue !== "")
                            //         queryStatus = false
                            // }
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

                    if (searchString === "" && search[i].operator === 'and') {
                        if (value !== "")
                            return false
                    }

                    if (value.indexOf(searchString) > -1)
                        status = true;

                    if (status)
                        return true;
                    else if (search[i].operator == 'and')
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
            let key = sort[i].key
            if (key) {
                try {
                    data.sort((a, b) => {
                        if (sort[i].direction == 'desc') {
                            switch (typeof b[key]) {
                                case 'string':
                                    if (!b[key])
                                        b[key] = ""
                                    return b[key].localeCompare(a[key])
                                case 'number':
                                    if (!b[key])
                                        b[key] = 0
                                    return b[key] - a[key]
                                case 'array':
                                case 'object':
                                    break;
                            }
                        } else {
                            switch (typeof a[key]) {
                                case 'string':
                                    if (!a[key])
                                        a[key] = ""
                                    return a[key].localeCompare(b[key])
                                case 'number':
                                    if (!a[key])
                                        a[key] = 0
                                    return a[key] - b[key]
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

    if (isBrowser)
        clickedElement();

    return {
        ObjectId,
        checkValue,
        dotNotationToObject,
        getValueFromObject,
        isObjectEmpty,
        domParser,
        parseTextToHtml,
        escapeHtml,
        cssPath,
        queryElements,
        queryData,
        searchData,
        sortData,
        getAttributes,
        setAttributeNames,
        getAttributeNames
    }

}));
