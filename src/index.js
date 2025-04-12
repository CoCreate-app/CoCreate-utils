(function (root, factory) {
	if (typeof define === "function" && define.amd) {
		define([], function () {
			return factory(true);
		});
	} else if (typeof module === "object" && module.exports) {
		module.exports = factory(false);
	} else {
		root.returnExports = factory(true);
	}
})(typeof self !== "undefined" ? self : this, function (isBrowser) {
	/*globals DOMParser*/
	function clickedElement() {
		document.addEventListener("click", (e) => {
			document.clickedElement = e.target;
		});

		try {
			let frames = document.querySelectorAll("iframe");
			for (let frame of frames) {
				try {
					let frameDocument = frame.contentDocument;
					if (!frameDocument.clickedElementListenerAdded) {
						frameDocument.addEventListener("click", (e) => {
							frameDocument.clickedElement = e.target;
						});

						// Mark the document to avoid adding duplicate listeners
						frameDocument.clickedElementListenerAdded = true;
					}
				} catch (iframeError) {
					console.log(
						`Cross-origin frame handling failed for: ${frame}`,
						iframeError
					);
				}
			}
		} catch (e) {
			console.log("Top-level frame document handling failed:", e);
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
			throw new Error("Invalid ObjectId provided.");
		}

		// Generate a new custom ObjectId
		const timestampHex = Math.floor(
			new Date(new Date().toISOString()).getTime() / 1000
		)
			.toString(16)
			.padStart(8, "0");
		const processIdHex = Math.floor(Math.random() * 0x100000000000)
			.toString(16)
			.padStart(12, "0");

		counter = (counter + 1) % 10000;
		if (counter < 2) {
			counter = Math.floor(Math.random() * (5000 - 100 + 1)) + 100;
		}

		const counterHex = counter.toString(16).padStart(4, "0");

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
		if (/{{\s*([\w\W]+)\s*}}/g.test(value)) return false;
		else return true;
	}

	function isValidDate(value) {
		if (
			typeof value === "string" &&
			value.length >= 20 &&
			value.length <= 24
		) {
			//  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/i.test(value))
			if (
				/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?([-+]\d{2}:\d{2}|Z)?$/i.test(
					value
				)
			) {
				return true;
			}
		}

		return false;
	}

	function dotNotationToObject(data, obj = {}) {
		try {
			let arrayGroup = {}; // Track groups by key paths (e.g., 'messages[a]')

			for (const key of Object.keys(data)) {
				let value = data[key];
				let newObject = obj;
				let oldObject = new Object(obj);
				let keys = key.split(".");
				let length = keys.length - 1;

				for (let i = 0; i < keys.length; i++) {
					// Check if the key ends with ']', indicating an array or grouping operation
					if (keys[i].endsWith("]")) {
						// Handle array push (e.g., messages[] -> push value)
						if (keys[i].endsWith("[]")) {
							let baseKey = keys[i].slice(0, -2); // Remove '[]'

							// Initialize newObject[baseKey] as an array if not an array or doesn't exist
							if (!Array.isArray(newObject[baseKey])) {
								newObject[baseKey] = [];
							}

							if (length == i) {
								// If value is an array, spread the array values into newObject[baseKey]
								if (Array.isArray(value)) {
									newObject[baseKey].push(...value);
								} else {
									// If value is not an array, just push the single value
									newObject[baseKey].push(value);
								}
							}
						}
						// Check for array index (e.g., messages[0])
						else if (/\[([0-9]+)\]/g.test(keys[i])) {
							let [k, index] = keys[i].split("[");
							index = index.slice(0, -1); // Get the index

							// Initialize newObject[k] as an array if it doesn't exist or is not an array
							if (!Array.isArray(newObject[k])) {
								newObject[k] = [];
							}

							if (length == i) {
								if (value === undefined) {
									newObject[k].splice(index, 1); // Remove element if value is undefined
								} else {
									newObject[k][index] = value; // Replace value at specified index
								}
							} else {
								newObject[k][index] = oldObject[k][index] || {}; // Initialize inner object
								newObject = newObject[k][index];
								oldObject = oldObject[k][index];
							}
						}
						// Handle letter-based groupings (e.g., messages[a].role)
						else if (/\[\w\]/g.test(keys[i])) {
							let [k, group] = keys[i].split("[");
							group = group.slice(0, -1); // Get the letter inside []

							// Initialize newObject[k] as an array if not an array or doesn't exist
							if (!Array.isArray(newObject[k])) {
								newObject[k] = [];
							}

							// If there's no object at this group index yet, push a new object
							let index;
							if (arrayGroup[keys.slice(0, i + 1).join(".")]) {
								// Reuse the existing index for the group
								index =
									arrayGroup[keys.slice(0, i + 1).join(".")];
							} else {
								// Create a new group and track the index
								index = newObject[k].length;
								arrayGroup[keys.slice(0, i + 1).join(".")] =
									index;
								newObject[k][index] = {};
							}

							// Move into the newly created or existing object for the group
							if (length == i) {
								newObject[k][index] = value; // Set value in the group
							} else {
								newObject = newObject[k][index]; // Continue with the group object
							}
						}
					}
					// Handle regular object keys (non-array keys)
					else {
						if (length == i) {
							if (value === undefined) {
								delete newObject[keys[i]]; // Delete key if value is undefined
							} else {
								newObject[keys[i]] = value; // Set value
							}
						} else {
							newObject[keys[i]] = oldObject[keys[i]] || {}; // Initialize inner object
							newObject = newObject[keys[i]];
							oldObject = oldObject[keys[i]];
						}
					}
				}
			}
			return obj;
		} catch (error) {
			console.log("Error converting dot notation to object", error);
			return false;
		}
	}

	function getValueFromObject(object = {}, path = "", throwError = false) {
		try {
			if (!Object.keys(object).length || !path) {
				if (throwError)
					throw new Error("Invalid input to getValueFromObject");
				return;
			}

			path = path.replace(/\[(\d+)\]/g, ".$1");

			let data = object,
				subpath = path.split(".");

			for (let i = 0; i < subpath.length; i++) {
				if (throwError && !(subpath[i] in data))
					throw new Error("Key not found in object: " + subpath[i]);

				data = data[subpath[i]];
				if (!data) break;
			}

			return data;
		} catch (error) {
			// console.error("Error in getValueFromObject:", error);
			if (throwError) throw error;
		}
	}

	function createUpdate(update, data, globalOpertors) {
		let operatorKeys = {};
		if (globalOpertors) operatorKeys = { ...globalOpertors };

		Object.keys(data).forEach((key) => {
			if (key.startsWith("$")) {
				if (!key.includes("."))
					for (let oldkey of Object.keys(data[key]))
						operatorKeys[key + "." + oldkey] = data[key][oldkey];
				else operatorKeys[key] = data[key];
			} else if (
				typeof data[key] === "string" &&
				data[key].startsWith("$")
			) {
				operatorKeys[data[key] + "." + key] = data[key];
			} else if (key.endsWith("]")) {
				const regex = /^(.*(?:\[\d+\].*?)?)\[(.*?)\](?:\[\])?$/;
				const match = key.match(regex);
				if (match[2] === "")
					operatorKeys["$push." + match[1]] = data[key];
				else {
					let index = parseInt(match[2], 10);
					if (index === NaN)
						operatorKeys[match[2] + "." + match[1]] = data[key];
					else operatorKeys[key] = data[key];
				}
			} else if (key.includes(".")) {
				operatorKeys[key] = data[key];
			} else if (data[key] === undefined) {
				delete update[key];
			} else update[key] = data[key];
		});

		return dotNotationToObjectUpdate(operatorKeys, update);
	}

	function dotNotationToObjectUpdate(data, object = {}) {
		try {
			for (const key of Object.keys(data)) {
				let newObject = object;
				let oldObject = new Object(newObject);
				let keys = key
					.replace(/\[(\d+)\]/g, ".$1")
					.split(".")
					.map((k) => (isNaN(k) ? k : Number(k)));
				let value = data[key];
				let operator;
				if (keys[0].startsWith("$")) operator = keys.shift();

				let length = keys.length - 1;
				for (let i = 0; i < keys.length; i++) {
					// if (/^\d+$/.test(keys[i])) keys[i] = parseInt(keys[i]);

					if (length == i) {
						if (operator) {
							let operators = [
								"$rename",
								"$inc",
								"$push",
								"$each",
								"$splice",
								"$unset",
								"$delete",
								"$slice",
								"$pop",
								"$shift",
								"$addToSet",
								"$pull"
							];
							if (!operators.includes(operator)) continue;
							if (operator === "$rename") {
								newObject[value] = newObject[keys[i]];
								delete newObject[keys[i]];
							} else if (
								operator === "$delete" ||
								operator === "$unset" ||
								operator === "$slice"
							) {
								if (typeof keys[i] === "number") {
									newObject.splice(keys[i], 1);
								} else {
									delete newObject[keys[i]];
								}
							} else if (operator === "$shift") {
								newObject[keys[i]].shift();
							} else if (operator === "$pop") {
								newObject[keys[i]].pop();
							} else if (operator === "$addToSet") {
								if (!newObject[keys[i]])
									newObject[keys[i]] = [];
								let exists;
								if (Array.isArray(value)) {
									exists = newObject[keys[i]].some(
										(item) =>
											Array.isArray(item) &&
											isEqualArray(item, value)
									);
								} else if (
									typeof value === "object" &&
									value !== null
								) {
									exists = newObject[keys[i]].some(
										(item) =>
											typeof item === "object" &&
											isEqualObject(item, value)
									);
								} else {
									exists = newObject[keys[i]].includes(value);
								}
								if (!exists) newObject[keys[i]].push(value);
							} else if (operator === "$pull") {
								if (!newObject[keys[i]]) continue;
								if (Array.isArray(value)) {
									newObject[keys[i]] = newObject[
										keys[i]
									].filter(
										(item) =>
											!Array.isArray(item) ||
											!isEqualArray(item, value)
									);
								} else if (
									typeof value === "object" &&
									value !== null
								) {
									newObject[keys[i]] = newObject[
										keys[i]
									].filter(
										(item) =>
											typeof item !== "object" ||
											!isEqualObject(item, value)
									);
								} else {
									newObject[keys[i]] = newObject[
										keys[i]
									].filter((item) => item !== value);
								}
							} else if (
								operator === "$push" ||
								operator === "$splice"
							) {
								if (
									typeof keys[i] === "number" &&
									newObject.length >= keys[i]
								)
									newObject.splice(keys[i], 0, value);
								else if (newObject[keys[i]])
									newObject[keys[i]].push(value);
								else newObject[keys[i]] = [value];
							} else if (operator === "$each") {
								if (!Array.isArray(value)) value = [value];
								if (typeof keys[i] === "number")
									newObject.splice(keys[i], 0, ...value);
								else newObject[keys[i]].push(...value);
							} else if (operator === "$inc") {
								if (
									!newObject[keys[i]] ||
									typeof newObject[keys[i]] !== "number"
								)
									newObject[keys[i]] = value;
								else newObject[keys[i]] += value;
							}
						} else if (value === undefined) {
							if (typeof keys[i] === "number")
								newObject.splice(keys[i], 1);
							else delete newObject[keys[i]];
						} else if (typeof keys[i] === "number") {
							newObject.splice(keys[i], 0, value);
						} else {
							newObject[keys[i]] = value;
						}
					} else if (
						typeof keys[i + 1] === "number" &&
						!Array.isArray(newObject[keys[i]])
					) {
						newObject[keys[i]] = [];
					} else {
						newObject[keys[i]] = newObject[keys[i]] || {};
						// newObject[keys[i]] = oldObject[keys[i]] || {};
						// oldObject = oldObject[keys[i]];
					}
					newObject = newObject[keys[i]];
				}
			}
			return object;
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
			case "html":
				doc = new DOMParser().parseFromString(str, "text/html");
				return doc.documentElement;
			case "body":
				doc = new DOMParser().parseFromString(str, "text/html");
				return doc.body;
			case "head":
				doc = new DOMParser().parseFromString(str, "text/html");
				return doc.head;

			default:
				let con = document.createElement("dom-parser");
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
		return html
			.replaceAll("&", "&amp")
			.replaceAll("<", "&lt")
			.replaceAll(">", "&gt;")
			.replaceAll("'", "&#39;")
			.replaceAll('"', "&quot;");
	}

	function cssPath(node, container) {
		let pathSplits = [];
		do {
			if (!node || !node.tagName) return false;
			let pathSplit = node.tagName.toLowerCase();

			if (node.id) {
				pathSplit += "#" + node.id;
				node = "";
			} else {
				let eid = node.getAttribute("eid");
				if (eid && !/{{\s*([\w\W]+)\s*}}/g.test(eid)) {
					pathSplit += `[eid="${eid}"]`;
					node = "";
				}
				// if (node.classList.length) {
				//     node.classList.forEach((item) => {
				//         if (item.indexOf(":") === -1) pathSplit += "." + item;
				//     });
				// }
				else if (
					node.parentNode &&
					node.parentNode.children.length > 1
				) {
					// TODO: improve array logic so ignores javascript generated html??
					let children = [];
					for (let child of node.parentNode.children) {
						if (child.tagName == node.tagName) children.push(child);
					}
					let index = Array.prototype.indexOf.call(children, node);

					pathSplit += `:nth-of-type(${index + 1})`;
				}

				node = node.parentNode;
				if (
					node == null ||
					node.tagName == "HTML" ||
					node.tagName == "BODY" ||
					node.tagName == "DOM-PARSER" ||
					node.nodeName == "#document" ||
					node.hasAttribute("contenteditable")
				)
					node = "";
			}

			pathSplits.unshift(pathSplit);
		} while (node);
		let path = pathSplits.join(" > ");
		if (path && path.includes("<")) {
			let index = path.lastIndexOf(" >");
			if (index != -1) path = path.slice(0, index);
			else {
				index = path.lastIndexOf("<");
				path = path.slice(0, index);
			}
		}

		return path;
	}

	const queryTypes = [
		"$closest",
		"$parent",
		"$next",
		"$previous",
		"$document",
		"$frame",
		"$top"
	];

	// const queryTypesRegex = new RegExp(`\\$(?:${queryTypes.join("|")})\\b`); // Find the *first* match
	const regexPatternString = `(?:${queryTypes
		.map((type) => type.replace("$", "\\$"))
		.join("|")})\\b`;
	const queryTypesRegex = new RegExp(regexPatternString); // Find the *first* match

	function queryElements({ element = document, prefix, selector }) {
		let elements = new Set();

		if (!selector && element.nodeType === 1) {
			if (!prefix) {
				for (let attr of element.attributes) {
					if (attr.name.endsWith("-query")) {
						prefix = attr.name.slice(0, -6);
					}
				}
				if (!prefix) return false;
			}
			selector = element.getAttribute(prefix + "-" + "query");
			if (!selector) return false;
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

				// Process the part before the operator (if any)
				const part = remainingSelector
					.substring(0, matchIndex)
					.trim()
					.replace(/,$/, "");
				if (part) {
					queriedElement = querySelector(queriedElement, part);
					if (!queriedElement) break;
				}

				// Remove the processed part and operator from the remaining selector
				remainingSelector = remainingSelector
					.substring(matchIndex + operator.length)
					.trim();

				// Process the $closest operator
				if (operator === "$closest") {
					let [closest, remaining = ""] = remainingSelector.split(
						/\s+/,
						2
					);
					queriedElement = queriedElement.closest(closest);
					remainingSelector = remaining.trim();
				} else {
					// Process the operator
					queriedElement = queryType(queriedElement, operator);
				}

				if (!queriedElement) break;
			}

			if (!queriedElement) continue;

			// Process the remaining part after the last operator (if any)
			if (remainingSelector) {
				queriedElement = querySelector(
					queriedElement,
					remainingSelector
				);
			}

			if (
				Array.isArray(queriedElement) ||
				queriedElement instanceof HTMLCollection ||
				queriedElement instanceof NodeList
			) {
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
	}

	function queryType(element, type) {
		if (!element) return null;

		switch (type) {
			case "$top":
				return window.top.document;
			case "$frame":
				// If element is a document, return the iframe element containing it
				if (element.nodeType === 9) return window.frameElement;
				// If element is an iframe, return it as is
				return element;
			case "$document":
				// If element is a document, return itself, else return `ownerDocument`
				return element.nodeType === 9 ? element : element.ownerDocument;
			case "$closest":
				// If closest find the first selector seperated by space

				return element.nodeType === 9 ? element : element.ownerDocument;
			case "$parent":
				// If it's a document, return the parent document (if inside an iframe)
				if (element.nodeType === 9) {
					return element.defaultView !== window.top
						? element.defaultView.parent.document
						: null;
				}
				// Otherwise, return parent element
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
		return selector.endsWith("[]")
			? element.querySelectorAll(selector.slice(0, -2))
			: element.querySelector(selector);
	}

	const mediaRanges = {
		xs: [0, 575],
		sm: [576, 768],
		md: [769, 992],
		lg: [993, 1200],
		xl: [1201, 0]
	};

	function checkMediaQueries(selector) {
		if (selector && selector.includes("@")) {
			let screenSizes = selector.split("@");
			selector = screenSizes.shift();
			for (let screenSize of screenSizes) {
				const viewportWidth = window.innerWidth;
				let mediaViewport = false;

				// Check if screenSize is a valid range in the 'ranges' object
				if (mediaRanges.hasOwnProperty(screenSize)) {
					const [minWidth, maxWidth] = mediaRanges[screenSize];
					if (
						viewportWidth >= minWidth &&
						viewportWidth <= maxWidth
					) {
						mediaViewport = true;
						break;
					}
				}

				if (!mediaViewport) return false;
			}
		}

		return selector;
	}

	function queryData(data, query) {
		if (query.$and) {
			for (let i = 0; i < query.$and.length; i++) {
				if (!queryData(data, query.$and[i])) return false;
			}
		}

		if (query.$nor) {
			for (let i = 0; i < query.$nor.length; i++) {
				if (queryData(data, query.$nor[i])) return false;
			}
		}

		for (let key of Object.keys(query)) {
			if (key === "$and" || key === "$or") continue;
			if (!queryMatch(data, { [key]: query[key] })) return false;
		}

		if (query.$or) {
			for (let i = 0; i < query.$or.length; i++) {
				if (queryData(data, query.$or[i])) return true;
			}
		}

		return true;
	}

	function queryMatch(data, query) {
		for (let key of Object.keys(query)) {
			// if (!data.hasOwnProperty(key))
			//     return false

			let dataValue;
			try {
				dataValue = getValueFromObject(data, key, true);
			} catch (error) {
				return false;
			}

			if (
				typeof query[key] === "string" ||
				typeof query[key] === "number" ||
				typeof query[key] === "boolean"
			) {
				if (Array.isArray(dataValue))
					return dataValue.includes(query[key]);
				else return dataValue === query[key];
			} else if (Array.isArray(query[key])) {
				if (Array.isArray(dataValue)) {
					return isEqualArray(dataValue, query[key]);
				} else {
					return false;
				}
			} else {
				for (let property of Object.keys(query[key])) {
					if (property === "$options") continue;
					if (!property.startsWith("$")) {
						if (typeof dataValue !== "object") {
							return false;
						} else
							return queryMatch(
								{
									[property]: getValueFromObject(
										dataValue,
										property
									)
								},
								{ [property]: query[key][property] }
							);
					} else {
						let queryValue = query[key][property];
						if (isValidDate(queryValue) && isValidDate(dataValue)) {
							queryValue = new Date(queryValue);
							dataValue = new Date(dataValue);
						}
						let queryStatus = false;
						switch (property) {
							case "$eq":
								if (
									Array.isArray(dataValue) &&
									Array.isArray(queryValue)
								) {
									queryStatus = isEqualArray(
										dataValue,
										queryValue
									);
								} else {
									queryStatus = dataValue === queryValue;
								}
								break;
							case "$ne":
								if (
									Array.isArray(dataValue) &&
									Array.isArray(queryValue)
								) {
									queryStatus = !isEqualArray(
										dataValue,
										queryValue
									);
								} else {
									queryStatus = dataValue !== queryValue;
								}
								break;
							case "$not":
								queryStatus = !queryMatch(data, {
									[key]: query[key]["$not"]
								});
								break;
							case "$lt":
								queryStatus = dataValue < queryValue;
								break;
							case "$lte":
								queryStatus = dataValue <= queryValue;
								break;
							case "$gt":
								queryStatus = dataValue > queryValue;
								break;
							case "$gte":
								queryStatus = dataValue >= queryValue;
								break;
							case "$in":
								if (Array.isArray(dataValue)) {
									queryStatus = dataValue.some((element) =>
										queryValue.includes(element)
									);
								} else {
									queryStatus =
										queryValue.includes(dataValue);
								}
								break;
							case "$nin":
								if (Array.isArray(dataValue)) {
									queryStatus = !dataValue.some((element) =>
										queryValue.includes(element)
									);
								} else {
									queryStatus =
										!queryValue.includes(dataValue);
								}
								break;
							case "$all":
								if (
									Array.isArray(dataValue) &&
									Array.isArray(queryValue)
								) {
									queryStatus = queryValue.every((element) =>
										dataValue.includes(element)
									);
								}
								break;
							case "$elemMatch":
								if (Array.isArray(data[key])) {
									queryStatus = data[key].some((element) =>
										queryMatch(
											element,
											query[key][property]
										)
									);
								}
								break;
							case "$size":
								if (Array.isArray(dataValue)) {
									queryStatus =
										dataValue.length === queryValue;
								}
								break;
							case "$exists":
								queryStatus = queryValue
									? data.hasOwnProperty(key)
									: !data.hasOwnProperty(key);
								break;
							case "$regex":
								if (typeof dataValue === "string") {
									let regexFlag =
										query[key]["$options"] || "";
									let regex = new RegExp(
										queryValue,
										regexFlag
									);
									queryStatus = regex.test(dataValue);
								}
								break;
							case "$type":
								let dataType = typeof dataValue;
								if (Array.isArray(dataValue)) {
									dataType = "array";
								}
								queryStatus = dataType === queryValue;
								break;
							case "$mod":
								if (
									typeof dataValue === "number" &&
									Array.isArray(queryValue) &&
									queryValue.length === 2
								) {
									const [divisor, remainder] = queryValue;
									queryStatus =
										dataValue % divisor === remainder;
								}
								break;
							case "$where":
								if (typeof queryValue === "function") {
									try {
										// queryStatus = queryValue.call(data);
									} catch (error) {
										console.error(
											"Error in queryData $where function:",
											error
										);
									}
								}
								break;

							default:
								console.log("unknown operator");
								break;
						}
						if (!queryStatus) return false;
					}
				}
				return true;
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
		if (!search) return true;
		if (!Array.isArray(search)) search = [search];
		for (let i = 0; i < search.length; i++) {
			let searchValue = search[i].value;
			if (!Array.isArray(searchValue)) searchValue = [searchValue];
			for (let key in data) {
				let value = data[key];
				let status = false;
				switch (typeof value) {
					case "number":
						value = value.toString();
						break;
					case "object":
						value = JSON.stringify(value);
						break;
					case "function":
						value = value.toString();
						break;
				}
				if (
					search[i].caseSensitive != "true" ||
					search[i].caseSensitive != true
				)
					value = value.toLowerCase();

				for (let i = 0; i < searchValue.length; i++) {
					let searchString = searchValue[i];
					if (
						search[i].caseSensitive != "true" ||
						search[i].caseSensitive != true
					)
						searchString = searchString.toLowerCase();

					if (searchString === "" && search[i].operator === "and") {
						if (value !== "") return false;
					}

					if (value.indexOf(searchString) > -1) status = true;

					if (status) return true;
					else if (search[i].operator == "and") return false;
				}
			}
			if (search[i].value.length && search[i].operator == "or")
				return false;
		}
		return true;
	}

	function sortData(data, sort) {
		return data.sort((a, b) => {
			for (let i = 0; i < sort.length; i++) {
				let key = sort[i].key;
				if (a[key] == null && b[key] == null) continue;
				if (a[key] == null)
					return sort[i].direction === "desc" ? -1 : 1;
				if (b[key] == null)
					return sort[i].direction === "desc" ? 1 : -1;

				if (typeof a[key] !== typeof b[key]) {
					return typeof a[key] < typeof b[key] ? -1 : 1;
				}

				if (a[key] !== b[key]) {
					if (typeof a[key] === "string") {
						return sort[i].direction === "desc"
							? b[key].localeCompare(a[key])
							: a[key].localeCompare(b[key]);
					} else {
						// Assuming numeric or other comparable types
						return sort[i].direction === "desc"
							? b[key] - a[key]
							: a[key] - b[key];
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
			let variable = attributes[attribute.name];
			if (variable) {
				object[variable] = el.getAttribute(attribute.name);
			}
		}

		return object;
	}

	function getAttributeNames(variables) {
		let reversedObject = {};
		for (const key of Object.keys(CoCreateConfig.attributes)) {
			reversedObject[CoCreateConfig.attributes[key]] = key;
		}

		let attributes = [];
		for (const variable of variables) {
			let attribute = reversedObject[variable];
			if (attribute) attributes.push(attribute);
		}
		return attributes;
	}

	function setAttributeNames(attributes, overWrite) {
		let reversedObject = {};
		for (const key of Object.keys(CoCreateConfig.attributes)) {
			reversedObject[CoCreateConfig.attributes[key]] = key;
		}

		for (const attribute of Object.keys(attributes)) {
			const variable = attributes[attribute];
			if (!reversedObject[variable] || overWrite != false)
				reversedObject[variable] = attribute;
		}

		let revertObject = {};
		for (const key of Object.keys(reversedObject)) {
			revertObject[reversedObject[key]] = key;
		}
		CoCreateConfig.attributes = revertObject;
	}

	if (isBrowser) clickedElement();

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
	};
});
