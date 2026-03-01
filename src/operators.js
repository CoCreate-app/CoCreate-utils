import { ObjectId } from "./ObjectId.js";
import { uid } from "./uid.js";
import { queryElements } from "./queryElements.js";
import { getValueFromObject } from "./getValueFromObject.js";

// Operators handled directly for simple, synchronous value retrieval
const customOperators = new Map(
	Object.entries({
		$organization_id: () => localStorage.getItem("organization_id"),
		$user_id: () => localStorage.getItem("user_id"),
		$clientId: () => localStorage.getItem("clientId"),
		$session_id: () => localStorage.getItem("session_id"),
		$value: (element) => element.getValue() || "",
		// TODO: get length of value
		// $length: (element) => {element.getValue() || ""},
		$innerWidth: () => window.innerWidth,
		$innerHeight: () => window.innerHeight,
		$href: () => window.location.href.replace(/\/$/, ""),
		$origin: () => window.location.origin,
		$protocol: () => window.location.protocol,
		$hostname: () => window.location.hostname,
		$host: () => window.location.host,
		$port: () => window.location.port,
		$pathname: () => window.location.pathname.replace(/\/$/, ""),
		$hash: () => window.location.hash,
		$subdomain: () => getSubdomain() || "",
		$object_id: () => ObjectId().toString(),
		"ObjectId()": () => ObjectId().toString(),
		$relativePath: () => {
			let currentPath = window.location.pathname.replace(/\/[^\/]*$/, ""); // Remove file or last segment from path
			let depth = currentPath.split("/").filter(Boolean).length; // Count actual directory levels
			return depth > 0 ? "../".repeat(depth) : "./";
		},
		$path: () => {
			let path = window.location.pathname;
			if (path.split("/").pop().includes(".")) {
				path = path.replace(/\/[^\/]+$/, "/");
			}
			return path === "/" ? "" : path;
		},
		$param: (element, args) => args,
		$getObjectValue: (element, args) => {
			if (Array.isArray(args) && args.length >= 2) {
				return getValueFromObject(args[0], args[1]);
			}
			return "";
		},
		$setValue: (element, args) => element.setValue(...args) || "",
		$true: () => true,
		$false: () => false,
		// TODO: Handle uuid generation
		// $uid: () => uid.generate(6),
		$parse: (element, args) => {
			let value = args || "";
			try {
				return JSON.parse(value);
			} catch (e) {
				return value;
			}
		},
		// TODO: Implement number formatting
		$numberFormat: (element, args) => {
			let number = parseFloat(args[0]);
			// Simple, fixed arg mapping:
			// args[0] = locale (internationalization)
			// args[1] = options (object)
			// args[2] = number (if provided). If not provided, fall back to legacy behavior where args[0] might be the number.
			if (!Array.isArray(args)) args = [args];

			const locale = args[0] || undefined;
			const options = args[1] || {};
			const numCandidate = args[2] !== undefined ? args[2] : args[0];

			number = parseFloat(numCandidate);

			if (isNaN(number)) return String(numCandidate ?? "");

			return new Intl.NumberFormat(locale, options).format(number);
		},
		$uid: (element, args) => uid(args[0]) || "",

	})
);

// Operators that access a specific property of a target element
const propertyOperators = new Set([
	"$scrollWidth",
	"$scrollHeight",
	"$offsetWidth",
	"$offsetHeight",
	"$id",
	"$tagName",
	"$className",
	"$textContent",
	"$innerHTML",
	"$getValue",
	"$reset"
]);

// Combine all known operator keys for the main parsing regex
const knownOperatorKeys = [
	...customOperators.keys(),
	...propertyOperators
].sort((a, b) => b.length - a.length);

/**
 * Helper function to check if a string path starts with a known bare operator.
 * This logic is necessary to separate '$value' from '[0].src' when no parentheses remain.
 */
const findBareOperatorInPath = (path, knownOperatorKeys) => {
    const trimmedPath = path.trim();
    for (const key of knownOperatorKeys) {
        if (trimmedPath.startsWith(key)) {
            const remaining = trimmedPath.substring(key.length);
            // Edge Case Fix: Ensure the operator is followed by a space, bracket, dot, or end-of-string.
            // This prevents "valueThing" from being incorrectly split into "$value" + "Thing".
            if (remaining.length === 0 || /^\s|\[|\./.test(remaining)) {
                return key;
            }
        }
    }
    return null;
}

/**
 * Finds the innermost function call (operator + its balanced parentheses argument)
 * in the expression. This is the core logic for iterative parsing.
 * * @param {string} expression The full expression string.
 * @returns {{operator: string, args: string, fullMatch: string} | null} Details of the innermost function call, or null.
 */
const findInnermostFunctionCall = (expression) => {
    let balance = 0;
    let deepestStart = -1;
    let deepestEnd = -1;
    let deepestBalance = -1;
    let inSingleQuote = false;
    let inDoubleQuote = false;

    // First pass: Find the indices of the DEEPEST balanced parenthesis pair.
    for (let i = 0; i < expression.length; i++) {
        const char = expression[i];

        if (char === '"' && !inSingleQuote) {
            inDoubleQuote = !inDoubleQuote;
            continue;
        } else if (char === "'" && !inDoubleQuote) {
            inSingleQuote = !inDoubleQuote;
            continue;
        }

        if (inSingleQuote || inDoubleQuote) {
            continue;
        }

        if (char === '(') {
            balance++;
            // Track the index of the open parenthesis that belongs to the deepest balance level
            if (balance > deepestBalance) {
                deepestBalance = balance;
                deepestStart = i;
                deepestEnd = -1; // Reset end until match is found
            }
        } else if (char === ')') {
            if (balance === deepestBalance) {
                // This is the closing parenthesis that matches the deepest open parenthesis found
                deepestEnd = i;
            }
            balance--;
        }
    }
    
    // If we didn't find a balanced pair, or the match is invalid, exit.
    if (deepestStart === -1 || deepestEnd === -1 || deepestEnd <= deepestStart) {
        return null;
    }

    // Now we have the innermost argument content indices (deepestStart + 1 to deepestEnd - 1)
    const rawArgs = expression.substring(deepestStart + 1, deepestEnd).trim();
    
    // Step 2: Find the operator name backward from the deepestStart index.
    let operatorStart = -1;
    let nonWhitespaceFound = false;

    for (let i = deepestStart - 1; i >= 0; i--) {
        const char = expression[i];
        
        // Skip trailing whitespace between operator and '('
        if (!nonWhitespaceFound) {
            if (/\s/.test(char)) {
                continue;
            }
            nonWhitespaceFound = true;
        }
        
        // Find the start of the operator name
        // This regex captures letters, numbers, hyphens, and the required $
        let isOperatorChar = /[\w\-\$]/.test(char);
        
        if (!isOperatorChar) {
            operatorStart = i + 1;
            break;
        }
        operatorStart = i;
    }
    
    if (operatorStart === -1) operatorStart = 0;
    
    const operatorNameCandidate = expression.substring(operatorStart, deepestStart).trim();

    // Step 3: Validate the operator name
    if (knownOperatorKeys.includes(operatorNameCandidate)) {
        // Construct the full match string: operatorNameCandidate(rawArgs)
        const fullMatch = expression.substring(operatorStart, deepestEnd + 1);
        
        return {
            operator: operatorNameCandidate,
            args: rawArgs,
            fullMatch: fullMatch
        };
    }
    
    return null; // Operator name invalid or not found
};

/**
 * Main function to find the innermost operator.
 * * Logic flow is updated to prioritize finding the innermost FUNCTION CALL,
 * then fall back to finding a BARE OPERATOR if no function calls remain.
 * * @param {string} expression The expression to parse.
 * @returns {{operator: string, args: string, rawContent: string, fullMatch?: string} | {operator: null, args: string, rawContent: string}}
 */
const findInnermostOperator = (expression) => {
    	// Helper function to strip leading and trailing parentheses from a string
	function stripParentheses(str) {
		let result = str;
		if (result.startsWith("(")) {
			result = result.substring(1);
		}
		if (result.endsWith(")")) {
			result = result.substring(0, result.length - 1);
		}
		return result;
	}
	let args;

    // --- 1. PRIORITY: Find Innermost FUNCTION CALL (Operator with Parentheses) ---
    const functionCall = findInnermostFunctionCall(expression);

    if (functionCall) {
		// Return the full function expression details, including the full string section
		args = stripParentheses(functionCall.args);
		return {
			operator: functionCall.operator,
			args, // Arguments without parentheses
			rawContent: functionCall.args, // The content inside the parentheses (arguments)
			fullMatch: functionCall.fullMatch // The operator(args) string (the complete section to replace)
		};
	}
    
    // --- 2. FALLBACK: Find BARE OPERATOR (e.g., $value path) ---
    
    // If no function calls are found, the entire expression is treated as the raw content
    const rawContent = expression.trim();

    // Now check the raw content to see if it starts with a bare operator ($value)
    const innermostOperator = findBareOperatorInPath(rawContent, knownOperatorKeys);

    if (innermostOperator) {
		const operatorArgs = rawContent.substring(innermostOperator.length).trim();
		args = stripParentheses(operatorArgs);
		return {
			operator: innermostOperator,
			args, // Arguments without parentheses
			rawContent: rawContent,
		};
	}


	args = stripParentheses(rawContent);
	
    // Fallback if no known operator is found
    return {
        operator: null,
        args,
        rawContent: rawContent
    };
};

function escapeRegexKey(key) {
	if (key.startsWith("$")) {
		return "\\" + key; // Escape the leading $
	} else if (key === "ObjectId()") {
		return "ObjectId\\(\\)"; // Escape the parentheses
	}
	return key; // Should not happen with current keys, but fallback
}

/**
 * Synchronously processes a string, finding and replacing operators recursively.
 * Assumes ALL underlying operations (getValue, queryElements) are synchronous.
 * @param {Element | null} element - Context element.
 * @param {string} value - String containing operators.
 * @param {string[]} [exclude=[]] - Operator prefixes to ignore.
 * @returns {string | {value: string, params: Promise[]}} - Processed string or an object containing the partially processed string and unresolved Promises.
 */
function processOperators(
	element,
	value,
	exclude = [],
	parent,
	params = []
) {
	// Early exit if no operators are possible or value is not a string
	if (typeof value !== "string" || !value.includes("$")) {
		return value;
	}

	let processedValue = value;
	let hasPromise = false;
	let parsedValue = null

	while (processedValue.includes("$")) {
        
        // --- PROMISE TOKEN RESOLUTION ---
        // If the processedValue starts with a resolved parameter token from the previous async step,
        // substitute the token with its actual (now resolved) value from the params array.
        const paramMatch = processedValue.match(/^\$\$PARAM_(\d+)\$\$/);
        if (paramMatch && Array.isArray(params) && params.length > 0) {
            const index = parseInt(paramMatch[1], 10);
            if (index < params.length) {
                const resolvedTokenValue = params[index];
                processedValue = processedValue.replace(paramMatch[0], resolvedTokenValue);
                // After replacement, we restart the loop to find the *next* innermost operator
                continue; 
            }
        }
        // --- END TOKEN RESOLUTION ---

		const { operator, args, rawContent, fullMatch } = findInnermostOperator(processedValue);

		if (!operator) {
			break; // No more operators found
		}

		if (operator === "$param" && !args) {
			break;
		}

		if (operator && !exclude.includes(operator)) {
            
            // --- Determine textToReplace ---
            // The fullMatch property from findInnermostOperator ensures we correctly replace 
            // the whole expression (e.g., "$param(...)") or just the bare operator ($value path).
            const textToReplace = fullMatch || rawContent;
            // --- END textToReplace CALCULATION ---

			let resolvedValue = resolveOperator(element, operator, args, parent, params);

			if (resolvedValue instanceof Promise) {
				const paramIndex = params.length; // Get the index *before* push
				params.push(resolvedValue); // Store the Promise
                
                // CRITICAL FIX: Replace the matched expression with a unique token, then break.
                processedValue = processedValue.replace(textToReplace, `$$PARAM_${paramIndex}$$`);
				hasPromise = true;
				break; // Stop processing and yield
			}

			if (params.some((p) => p instanceof Promise)) {
				hasPromise = true;
				break; // A nested call found a promise, stop and yield
			}

			let replacement = "";
			if (operator === "$param") {
				params.push(resolvedValue);
			} else {
				replacement = resolvedValue ?? "";
			}

			if (processedValue === textToReplace) {
				processedValue = replacement;
				break;
			}
				
			processedValue = processedValue.replace(textToReplace, replacement);

			if (!processedValue.includes("$")) {
				// If there are still unresolved operators, we need to continue processing
				break;
			}

		} else {
			// If operator is excluded, we need to advance past it to avoid infinite loop
			break;
		}
	}

	if (hasPromise) {
		return { value: processedValue, params };
	}

	if (params.length) {
		if (processedValue.trim() === "") {
			return params;
		}
	}

	return processedValue;
}

async function processOperatorsAsync(
	element,
	value,
	exclude = [],
	parent,
	params = []
) {
	let result = processOperators(element, value, exclude, parent, params);

	while (typeof result === "object" && result.params) {
		const resolvedParams = await Promise.all(result.params);
		// Note: The second argument passed to processOperators here is the partially processed string (result.value)
		// which now contains the PARAM tokens. The third argument is the array of resolved values (resolvedParams)
		// which will be used to replace those tokens in the subsequent processOperators call.
		result = processOperators(
			element,
			result.value,
			exclude,
			parent,
			resolvedParams
		);
	}

	if (result instanceof Promise) {
		return await result;
	}

	return result;
}

/**
 * Synchronously determines and executes the action for processing a single operator token.
 * @param {HTMLElement|null} element - The context element from which to derive values or execute methods.
 * @param {string} operator - The operator to apply, indicating what actions or property/method to evaluate.
 * @param {string|Array} args - Arguments that may be used by the operator, which could be further processed if they contain a nested operator.
 * @param {string} parent - Context in which the function is called, potentially affecting behavior or processing.
 * @returns {string} The final resolved value after applying the operator to the given elements.
 */
function resolveOperator(element, operator, args, parent, params) {
	// If a promise is already in the params, we must stop and wait for it to be resolved.
	if (params.some((p) => p instanceof Promise)) {
		return "";
	}

	// If args contain any operators (indicated by '$'), process them recursively
	if (args && typeof args === "string" && args.includes("$")) {
		// Reprocess args to resolve any nested operators
		args = processOperators(element, args, "", operator, params);
	}

	if (params.some((p) => p instanceof Promise)) {
		return operator;
	}

	// Initialize an array of elements to operate on, starting with the single element reference if provided
	let targetElements = element ? [element] : [];
    
	// If the argument is a string and the operator is NOT a custom utility that expects raw data
    // (like $param, $parse), we assume the argument is a selector.
	if (args && typeof args === "string" && !customOperators.has(operator)) {
		targetElements = queryElements({
			element, // Use the context element as the base for querying
			selector: args // Selector from args to find matching elements
		});

		// If no elements are found matching the selector in args, return args unmodified
		if (!targetElements.length) return args;
	}

	// Generate a processed value by applying the operator to each of the target elements
	let value = processValues(targetElements, operator, args, parent);

	// If the result is a string and still contains unresolved operators, process them further
	if (value && typeof value === "string" && value.includes("$")) {
		// Resolve any remaining operators within the value string
		value = processOperators(element, value, parent, params);
	}

	// Return the final processed value, fully resolved
	return value;
}

/**
 * Synchronously processes and aggregates values from a set of elements based on a specified operator.
 * @param {Array<HTMLElement>} elements - Array of elements to be processed.
 * @param {string} operator - The operator to apply to each element, indicating which property or method to use.
 * @param {string|Array} args - Arguments that may be passed to the method if the operator corresponds to a function.
 * @param {string} parent - Context in which the function is called, possibly influencing behavior (e.g., special handling for "$param").
 * @returns {string} The combined string value obtained by processing elements with the specified operator.
 */
function processValues(elements, operator, args, parent) {
	// Attempt to fetch a custom operator function associated with the operator
	let customOp = customOperators.get(operator);

	// Initialize an empty string to accumulate results from processing each element
	let aggregatedString = "";

	// Iterate over each element in the provided elements array
	for (const el of elements) {
		// If the element is null or undefined, skip to the next iteration
		if (!el) continue;

		// Determine the raw value from the custom operator or by accessing a property/method directly on the element
		let rawValue = customOp || el?.[operator.substring(1)];

		// Check if the rawValue is a function and process it using provided arguments
		if (typeof rawValue === "function") {
			// If arguments are provided as an array
			if (Array.isArray(args)) {
				// If the custom operator is NOT $param and has arguments, something is wrong with the flow.
				// However, if it's a generic method on an element (like $setValue), the args are passed via spread.
				if (customOperators.has(operator) && operator !== "$setValue" && operator !== "$getObjectValue" && args.length) {
					// For simple custom operators that don't take multiple args, return an empty string.
					return "";
				}
				// Invoke the function using the element and spread array arguments
				rawValue = rawValue(el, ...args);
			} else {
				// Otherwise, invoke the function using the element and direct arguments
				rawValue = rawValue(el, args);
			}
		}

		// If the parent context requires parameter resolution
		if (parent === "$param") {
			// Return the first evaluated rawValue that is not null or undefined
			if (rawValue) {
				return rawValue;
			}
		} else {
			if (
				rawValue instanceof Promise ||
				(typeof rawValue === "object" && rawValue !== null)
			) {
				return rawValue;
			}
			// Otherwise, append the stringified rawValue to the aggregated result, defaulting to an empty string if it's nullish
			aggregatedString += String(rawValue ?? "");
		}
	}

	// Return the final aggregated string containing all processed values
	return aggregatedString;
}

/**
 * Extracts the subdomain from the current window's hostname.
 * @returns {string|null} - The subdomain part of the hostname if it exists, or null if there is none.
 */
function getSubdomain() {
	// Retrieve the hostname from the current window's location
	const hostname = window.location.hostname;

	// Split the hostname into parts divided by dots ('.')
	const parts = hostname.split(".");

	// Check if the hostname has more than two parts and ensure the last part isn't a number (a common TLD check)
	// A typical domain structure might look like "sub.domain.com",
	// where "sub" is the subdomain, "domain" is the second-level domain, and "com" is the top-level domain.
	if (parts.length > 2 && isNaN(parseInt(parts[parts.length - 1]))) {
		// Join all parts except the last two (which are assumed to be the domain and TLD) to get the subdomain
		return parts.slice(0, parts.length - 2).join(".");
	}

	// Return null if there's no valid subdomain structure
	return null;
}

export { processOperators, processOperatorsAsync };
