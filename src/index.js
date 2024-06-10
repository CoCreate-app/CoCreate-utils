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

    /**
     * Generates an ObjectId
     */
    let counter = 0;
    function ObjectId(inputId) {
        if (inputId && /^[0-9a-fA-F]{24}$/.test(inputId)) {
            // If a valid ObjectId is provided, return it as a custom ObjectId object
            return {
                timestamp: inputId.substring(0, 8),
                processId: inputId.substring(8, 20),
                counter: inputId.substring(20),
                toString: function () {
                    return this.timestamp + this.processId + this.counter;
                }
            };
        } else if (inputId) {
            throw new Error('Invalid ObjectId provided.');
        }

        // Generate a new custom ObjectId
        const timestampHex = Math.floor(new Date(new Date().toISOString()).getTime() / 1000).toString(16).padStart(8, '0');
        const processIdHex = Math.floor(Math.random() * 0x100000000000).toString(16).padStart(12, '0');

        counter = (counter + 1) % 10000;
        if (counter < 2) {
            counter = Math.floor(Math.random() * (5000 - 100 + 1)) + 100;
        }

        const counterHex = counter.toString(16).padStart(4, '0');

        // Return the custom ObjectId object with a toString() method
        return {
            timestamp: timestampHex,
            processId: processIdHex,
            counter: counterHex,
            toString: function () {
                return this.timestamp + this.processId + this.counter;
            }
        };
    }

    function checkValue(value) {
        if (/{{\s*([\w\W]+)\s*}}/g.test(value))
            return false;
        else
            return true
    }

    function isValidDate(value) {
        if (typeof value === 'string' && value.length >= 20 && value.length <= 24) {
            //  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/i.test(value))
            if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([-+]\d{2}:\d{2}|Z)?$/i.test(value)) {
                return true
            }
        }

        return false;
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
                        index = index.slice(0, -1) || 0
                        newObject[k] = oldObject[k] || [];
                        if (length == i) {
                            if (value === undefined)
                                newObject[k].splice(index, 1);
                            else
                                newObject[k][index] = value;
                        } else {
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

    function getValueFromObject(object = {}, path = '', throwError = false) {
        try {
            if (!Object.keys(object).length || !path) {
                if (throwError)
                    throw new Error("Invalid input to getValueFromObject");
                return

            }

            path = path.replace(/\[(\d+)\]/g, '.$1');

            let data = object, subpath = path.split('.');

            for (let i = 0; i < subpath.length; i++) {
                if (throwError && !(subpath[i] in data))
                    throw new Error("Key not found in object: " + subpath[i]);

                data = data[subpath[i]];
                if (!data)
                    break;
            }

            return data;
        } catch (error) {
            // console.error("Error in getValueFromObject:", error);
            if (throwError)
                throw error;
        }
    }

    function createUpdate(update, data, globalOpertors) {
        let operatorKeys = {}
        if (globalOpertors)
            operatorKeys = { ...globalOpertors }

        Object.keys(data).forEach(key => {
            if (key.startsWith('$')) {
                if (!key.includes('.'))
                    for (let oldkey of Object.keys(data[key]))
                        operatorKeys[key + '.' + oldkey] = data[key][oldkey]
                else
                    operatorKeys[key] = data[key]
            } else if (typeof data[key] === 'string' && data[key].startsWith('$')) {
                operatorKeys[data[key] + '.' + key] = data[key]
            } else if (key.endsWith(']')) {
                const regex = /^(.*(?:\[\d+\].*?)?)\[(.*?)\](?:\[\])?$/;
                const match = key.match(regex);
                if (match[2] === '')
                    operatorKeys['$push.' + match[1]] = data[key]
                else {
                    let index = parseInt(match[2], 10);
                    if (index === NaN)
                        operatorKeys[match[2] + '.' + match[1]] = data[key]
                    else
                        operatorKeys[key] = data[key]
                }
            } else if (key.includes('.')) {
                operatorKeys[key] = data[key]
            } else if (data[key] === undefined) {
                delete update[key]
            } else
                update[key] = data[key]

        })

        return dotNotationToObjectUpdate(operatorKeys, update)
    }

    function dotNotationToObjectUpdate(data, object = {}) {
        try {
            for (const key of Object.keys(data)) {
                let newObject = object
                let oldObject = new Object(newObject)
                let keys = key.replace(/\[(\d+)\]/g, '.$1').split('.');
                let value = data[key]
                let operator
                if (keys[0].startsWith('$'))
                    operator = keys.shift()

                let length = keys.length - 1
                for (let i = 0; i < keys.length; i++) {
                    if (/^\d+$/.test(keys[i]))
                        keys[i] = parseInt(keys[i]);

                    if (length == i) {
                        if (operator) {
                            let operators = ['$rename', '$inc', '$push', '$each', '$splice', '$unset', '$delete', '$slice', '$pop', '$shift', '$addToSet', '$pull']
                            if (!operators.includes(operator))
                                continue
                            if (operator === '$rename') {
                                newObject[value] = newObject[keys[i]]
                                delete newObject[keys[i]]
                            } else if (operator === '$delete' || operator === '$unset' || operator === '$slice') {
                                if (typeof keys[i] === 'number')
                                    newObject.slice(keys[i], 1);
                                else
                                    delete newObject[keys[i]]
                            } else if (operator === '$shift') {
                                newObject[keys[i]].shift();
                            } else if (operator === '$pop') {
                                newObject[keys[i]].pop();
                            } else if (operator === '$addToSet') {
                                if (!newObject[keys[i]])
                                    newObject[keys[i]] = []
                                let exists
                                if (Array.isArray(value)) {
                                    exists = newObject[keys[i]].some(item => Array.isArray(item) && isEqualArray(item, value));
                                } else if (typeof value === 'object' && value !== null) {
                                    exists = newObject[keys[i]].some(item => typeof item === 'object' && isEqualObject(item, value));
                                } else {
                                    exists = newObject[keys[i]].includes(value);
                                }
                                if (!exists)
                                    newObject[keys[i]].push(value)
                            } else if (operator === '$pull') {
                                if (Array.isArray(value)) {
                                    newObject[keys[i]] = newObject[keys[i]].filter(item => !Array.isArray(item) || !isEqualArray(item, value));
                                } else if (typeof value === 'object' && value !== null) {
                                    newObject[keys[i]] = newObject[keys[i]].filter(item => typeof item !== 'object' || !isEqualObject(item, value));
                                } else {
                                    newObject[keys[i]] = newObject[keys[i]].filter(item => item !== value);
                                }
                            } else if (operator === '$push' || operator === '$splice') {
                                if (typeof keys[i] === 'number' && newObject.length >= keys[i])
                                    newObject.splice(keys[i], 0, value);
                                else if (newObject[keys[i]])
                                    newObject[keys[i]].push(value);
                                else
                                    newObject[keys[i]] = [value];
                            } else if (operator === '$each') {
                                if (!Array.isArray(value))
                                    value = [value]
                                if (typeof keys[i] === 'number')
                                    newObject.splice(keys[i], 0, ...value);
                                else
                                    newObject[keys[i]].push(...value);
                            } else if (operator === '$inc') {
                                if (!newObject[keys[i]] || typeof newObject[keys[i]] !== "number")
                                    newObject[keys[i]] = value
                                else
                                    newObject[keys[i]] += value
                            }
                        } else if (value === undefined) {
                            if (typeof keys[i] === 'number')
                                newObject.slice(keys[i], 1);
                            else
                                delete newObject[keys[i]]
                        } else
                            newObject[keys[i]] = value;
                    } else {
                        newObject[keys[i]] = oldObject[keys[i]] || {};
                        newObject = newObject[keys[i]]
                        oldObject = oldObject[keys[i]]
                    }
                }
            }
            return object
        } catch (error) {
            console.log("Error converting dot notation to object", error);
            return false;
        }
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
                let selectors = Selector.split(/,(?![^()]*\))/g);

                for (let j = 0; j < selectors.length; j++) {
                    if (selectors[j].includes('@')) {
                        selectors[j] = checkMediaQueries(selectors[j])
                        if (selectors[j] === false)
                            continue
                    }

                    let queriedElement = element
                    let specialSelectors = selectors[j].split(';')
                    for (let k = 0; k < specialSelectors.length; k++) {

                        // TODO: Support an array of queried elements and branch off to return matches for each
                        // if (!Array.isArray(queriedElement)) {
                        //     queriedElement = [queriedElement]
                        // }
                        if (!specialSelectors[k])
                            continue
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

    const mediaRanges = {
        xs: [0, 575],
        sm: [576, 768],
        md: [769, 992],
        lg: [993, 1200],
        xl: [1201, 0],
    };

    function checkMediaQueries(selector) {
        if (selector && selector.includes('@')) {
            let screenSizes = selector.split('@')
            selector = screenSizes.shift();
            for (let screenSize of screenSizes) {
                const viewportWidth = window.innerWidth;
                let mediaViewport = false;

                // Check if screenSize is a valid range in the 'ranges' object
                if (mediaRanges.hasOwnProperty(screenSize)) {
                    const [minWidth, maxWidth] = mediaRanges[screenSize];
                    if (viewportWidth >= minWidth && viewportWidth <= maxWidth) {
                        mediaViewport = true;
                        break;
                    }
                }

                if (!mediaViewport)
                    return false

            }
        }

        return selector
    }

    function queryData(data, query) {
        if (query.$and) {
            for (let i = 0; i < query.$and.length; i++) {
                if (!queryData(data, query.$and[i]))
                    return false
            }
        }

        if (query.$nor) {
            for (let i = 0; i < query.$nor.length; i++) {
                if (queryData(data, query.$nor[i]))
                    return false;
            }
        }

        for (let key of Object.keys(query)) {
            if (key === '$and' || key === '$or')
                continue
            if (!queryMatch(data, { [key]: query[key] }))
                return false
        }

        if (query.$or) {
            for (let i = 0; i < query.$or.length; i++) {
                if (queryData(data, query.$or[i]))
                    return true
            }
        }

        return true;
    }

    function queryMatch(data, query) {
        for (let key of Object.keys(query)) {
            // if (!data.hasOwnProperty(key))
            //     return false

            let dataValue
            try {
                dataValue = getValueFromObject(data, key, true)
            } catch (error) {
                return false
            }

            if (typeof query[key] === 'string' || typeof query[key] === 'number' || typeof query[key] === 'boolean') {
                if (Array.isArray(dataValue))
                    return dataValue.includes(query[key])
                else
                    return dataValue === query[key]
            } else if (Array.isArray(query[key])) {
                if (Array.isArray(dataValue)) {
                    return isEqualArray(dataValue, query[key]);
                } else {
                    return false;
                }
            } else {
                for (let property of Object.keys(query[key])) {
                    if (property === '$options')
                        continue
                    if (!property.startsWith('$')) {
                        if (typeof dataValue !== 'object') {
                            return false;
                        } else
                            return queryMatch({ [property]: getValueFromObject(dataValue, property) }, { [property]: query[key][property] })
                    } else {
                        let queryValue = query[key][property]
                        if (isValidDate(queryValue) && isValidDate(dataValue)) {
                            queryValue = new Date(queryValue)
                            dataValue = new Date(dataValue)
                        }
                        let queryStatus = false
                        switch (property) {
                            case '$eq':
                                if (Array.isArray(dataValue) && Array.isArray(queryValue)) {
                                    queryStatus = isEqualArray(dataValue, queryValue);
                                } else {
                                    queryStatus = (dataValue === queryValue);
                                }
                                break;
                            case '$ne':
                                if (Array.isArray(dataValue) && Array.isArray(queryValue)) {
                                    queryStatus = !isEqualArray(dataValue, queryValue);
                                } else {
                                    queryStatus = (dataValue !== queryValue);
                                }
                                break;
                            case '$not':
                                queryStatus = !queryMatch(data, { [key]: query[key]['$not'] });
                                break;
                            case '$lt':
                                queryStatus = (dataValue < queryValue)
                                break;
                            case '$lte':
                                queryStatus = (dataValue <= queryValue)
                                break;
                            case '$gt':
                                queryStatus = (dataValue > queryValue)
                                break;
                            case '$gte':
                                queryStatus = (dataValue >= queryValue)
                                break;
                            case '$in':
                                if (Array.isArray(dataValue)) {
                                    queryStatus = dataValue.some(element => queryValue.includes(element));
                                } else {
                                    queryStatus = queryValue.includes(dataValue);
                                }
                                break;
                            case '$nin':
                                if (Array.isArray(dataValue)) {
                                    queryStatus = !dataValue.some(element => queryValue.includes(element));
                                } else {
                                    queryStatus = !queryValue.includes(dataValue);
                                }
                                break;
                            case '$all':
                                if (Array.isArray(dataValue) && Array.isArray(queryValue)) {
                                    queryStatus = queryValue.every(element => dataValue.includes(element));
                                }
                                break;
                            case '$elemMatch':
                                if (Array.isArray(data[key])) {
                                    queryStatus = data[key].some(element => queryMatch(element, query[key][property]));
                                }
                                break;
                            case '$size':
                                if (Array.isArray(dataValue)) {
                                    queryStatus = (dataValue.length === queryValue);
                                }
                                break;
                            case '$exists':
                                queryStatus = (queryValue ? data.hasOwnProperty(key) : !data.hasOwnProperty(key));
                                break;
                            case '$regex':
                                if (typeof dataValue === 'string') {
                                    let regexFlag = query[key]['$options'] || ''
                                    let regex = new RegExp(queryValue, regexFlag)
                                    queryStatus = regex.test(dataValue);
                                }
                                break;
                            case '$type':
                                let dataType = typeof dataValue;
                                if (Array.isArray(dataValue)) {
                                    dataType = 'array';
                                }
                                queryStatus = (dataType === queryValue);
                                break;
                            case '$mod':
                                if (typeof dataValue === 'number' && Array.isArray(queryValue) && queryValue.length === 2) {
                                    const [divisor, remainder] = queryValue;
                                    queryStatus = (dataValue % divisor === remainder);
                                }
                                break;
                            case '$where':
                                if (typeof queryValue === 'function') {
                                    try {
                                        // queryStatus = queryValue.call(data);
                                    } catch (error) {
                                        console.error('Error in queryData $where function:', error);
                                    }
                                }
                                break;

                            default:
                                console.log('unknown operator')
                                break;

                        }
                        if (!queryStatus)
                            return false

                    }
                }
                return true
            }

        }
    }

    function isEqualArray(arr1, arr2) {
        if (arr1.length !== arr2.length) {
            return false;
        }
        for (let i = 0; i < arr1.length; i++) {
            if (!isEqualObject(arr1[i], arr2[i])) {
                return false;
            }
        }
        return true;
    }

    function isEqualObject(obj1, obj2) {
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false;
        }

        for (const key of keys1) {
            if (obj1[key] !== obj2[key]) {
                return false;
            }
        }

        return true;
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
        return data.sort((a, b) => {
            for (let i = 0; i < sort.length; i++) {
                let key = sort[i].key;
                if (a[key] == null && b[key] == null) continue;
                if (a[key] == null)
                    return sort[i].direction === 'desc' ? -1 : 1;
                if (b[key] == null)
                    return sort[i].direction === 'desc' ? 1 : -1;

                if (typeof a[key] !== typeof b[key]) {
                    return typeof a[key] < typeof b[key] ? -1 : 1;
                }

                if (a[key] !== b[key]) {
                    if (typeof a[key] === 'string') {
                        return sort[i].direction === 'desc' ?
                            b[key].localeCompare(a[key]) :
                            a[key].localeCompare(b[key]);
                    } else { // Assuming numeric or other comparable types
                        return sort[i].direction === 'desc' ?
                            (b[key] - a[key]) :
                            (a[key] - b[key]);
                    }
                }
            }
            return 0;
        });
    }


    function getAttributes(el) {
        if (!el) return;

        let attributes = window.CoCreateConfig.attributes;
        let object = {};

        for (let attribute of el.attributes) {
            let variable = attributes[attribute.name]
            if (variable) {
                object[variable] = el.getAttribute(attribute.name)
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
        isValidDate,
        dotNotationToObject,
        getValueFromObject,
        domParser,
        parseTextToHtml,
        escapeHtml,
        cssPath,
        queryElements,
        checkMediaQueries,
        queryData,
        searchData,
        sortData,
        createUpdate,
        getAttributes,
        setAttributeNames,
        getAttributeNames
    }

}));
