import { ObjectId } from "./ObjectId.js";
import { uid } from "./uid.js";
import { queryElements } from "./queryElements.js";
import { getValueFromObject } from "./getValueFromObject.js";
const mathConstants = { PI: Math.PI, E: Math.E };
const mathFunctions = {
  abs: Math.abs,
  ceil: Math.ceil,
  floor: Math.floor,
  round: Math.round,
  max: Math.max,
  min: Math.min,
  pow: Math.pow,
  sqrt: Math.sqrt,
  log: Math.log,
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  Number: (v) => Number(v)
  // Explicit numeric casting
};
class Ref {
  constructor(obj, prop) {
    this.obj = obj;
    this.prop = prop;
    let isList = Array.isArray(obj) || typeof NodeList !== "undefined" && obj instanceof NodeList || typeof HTMLCollection !== "undefined" && obj instanceof HTMLCollection;
    this.isArrayContext = isList && !(prop in obj);
    if (this.isArrayContext && !Array.isArray(this.obj)) {
      this.obj = Array.from(this.obj);
    }
  }
  get() {
    if (this.isArrayContext) {
      let res2 = this.obj.map((item) => item ? item[this.prop] : void 0);
      return res2;
    }
    let res = this.obj ? this.obj[this.prop] : void 0;
    return res;
  }
  set(val) {
    if (this.isArrayContext) {
      this.obj.forEach((item) => {
        if (item) item[this.prop] = val;
      });
      return val;
    }
    if (this.obj) this.obj[this.prop] = val;
    return val;
  }
}
function unref(val) {
  return val instanceof Ref ? val.get() : val;
}
function safeParse(expression, registry = /* @__PURE__ */ new Map()) {
  if (typeof expression !== "string") return expression;
  let currentExpr = expression.trim();
  if (!currentExpr) return null;
  const tokenizerRegex = /('[^']*'|"[^"]*"|\d+(?:\.\d+)?|>=|<=|===|!==|==|!=|&&|\|\||[a-zA-Z_][a-zA-Z0-9_\.]*|[\+\-\*\/\%\(\)\?\:\>\<\!\,\=])/g;
  const tokens = currentExpr.match(tokenizerRegex) || [];
  let pos = 0;
  function peek() {
    return tokens[pos];
  }
  function consume() {
    return tokens[pos++];
  }
  function parse() {
    return parseAssignment();
  }
  function parseAssignment() {
    let left = parseTernary();
    if (peek() === "=") {
      consume();
      let right = unref(parseAssignment());
      if (left instanceof Ref) {
        return left.set(right);
      }
      return right;
    }
    return left;
  }
  function parseTernary() {
    let left = parseLogical();
    if (peek() === "?") {
      consume();
      let trueExpr = parseTernary();
      if (peek() === ":") {
        consume();
        let falseExpr = parseTernary();
        return unref(left) ? unref(trueExpr) : unref(falseExpr);
      }
    }
    return left;
  }
  function parseLogical() {
    let left = parseComparison();
    while (peek() === "&&" || peek() === "||") {
      let op = consume();
      let right = parseComparison();
      if (op === "&&") left = unref(left) && unref(right);
      if (op === "||") left = unref(left) || unref(right);
    }
    return left;
  }
  function parseComparison() {
    let left = parseAdditive();
    while ([">", "<", ">=", "<=", "===", "!==", "==", "!="].includes(peek())) {
      let op = consume();
      let right = parseAdditive();
      let l = unref(left), r = unref(right);
      if (op === ">") left = l > r;
      if (op === "<") left = l < r;
      if (op === ">=") left = l >= r;
      if (op === "<=") left = l <= r;
      if (op === "===") left = l === r;
      if (op === "!==") left = l !== r;
      if (op === "==") left = l == r;
      if (op === "!=") left = l != r;
    }
    return left;
  }
  function parseAdditive() {
    let left = parseMultiplicative();
    while (["+", "-"].includes(peek())) {
      let op = consume();
      let right = parseMultiplicative();
      if (op === "+") left = unref(left) + unref(right);
      if (op === "-") left = unref(left) - unref(right);
    }
    return left;
  }
  function parseMultiplicative() {
    let left = parsePrimary();
    while (["*", "/", "%"].includes(peek())) {
      let op = consume();
      let right = parsePrimary();
      if (op === "*") left = unref(left) * unref(right);
      if (op === "/") left = unref(left) / unref(right);
      if (op === "%") left = unref(left) % unref(right);
    }
    return left;
  }
  function parsePrimary() {
    let token = consume();
    if (!token) return void 0;
    if (/^\d/.test(token)) return parseFloat(token);
    if (token.startsWith("'") || token.startsWith('"')) {
      return token.slice(1, -1);
    }
    if (token === "true") return true;
    if (token === "false") return false;
    if (token === "(") {
      let expr = unref(parse());
      if (peek() === ")") consume();
      return expr;
    }
    if (token === "-") return -unref(parsePrimary());
    if (token === "!") return !unref(parsePrimary());
    if (mathConstants.hasOwnProperty(token)) return mathConstants[token];
    if (peek() === "(" && mathFunctions.hasOwnProperty(token)) {
      consume();
      let args = [];
      if (peek() !== ")") {
        args.push(unref(parse()));
        while (peek() === ",") {
          consume();
          args.push(unref(parse()));
        }
      }
      if (peek() === ")") consume();
      return mathFunctions[token](...args);
    }
    let path = token.split(".");
    let baseToken = path[0];
    let val;
    if (registry.has(baseToken)) {
      val = registry.get(baseToken);
    } else if (typeof window !== "undefined" && window[baseToken]) {
      val = window[baseToken];
    } else {
      val = void 0;
    }
    if (path.length === 1) {
      if (peek() === "(" && typeof val === "function") {
        consume();
        let args = [];
        if (peek() !== ")") {
          args.push(unref(parse()));
          while (peek() === ",") {
            consume();
            args.push(unref(parse()));
          }
        }
        if (peek() === ")") consume();
        return val(...args);
      }
      return val;
    }
    for (let i = 1; i < path.length - 1; i++) {
      if (val !== null && val !== void 0) {
        let isList = Array.isArray(val) || typeof NodeList !== "undefined" && val instanceof NodeList || typeof HTMLCollection !== "undefined" && val instanceof HTMLCollection;
        if (isList && !(path[i] in val)) {
          val = Array.from(val).map((item) => item ? item[path[i]] : void 0);
        } else {
          val = val[path[i]];
        }
      } else {
        return void 0;
      }
    }
    let ref = new Ref(val, path[path.length - 1]);
    if (peek() === "(") {
      consume();
      let args = [];
      if (peek() !== ")") {
        args.push(unref(parse()));
        while (peek() === ",") {
          consume();
          args.push(unref(parse()));
        }
      }
      if (peek() === ")") consume();
      if (ref.isArrayContext) {
        let results = ref.obj.map((item) => {
          let func = item ? item[ref.prop] : void 0;
          if (func !== void 0 && typeof func !== "function") {
            console.warn(`Operator Engine: '${ref.prop}' is not a valid function on the target element.`);
          }
          let res = typeof func === "function" ? func.apply(item, args) : void 0;
          return res;
        });
        return results;
      } else {
        let func = ref.obj ? ref.obj[ref.prop] : void 0;
        if (typeof func === "function") {
          let res = func.apply(ref.obj, args);
          return res;
        } else {
          console.warn(`Operator Engine: Method '${ref.prop}' does not exist on the target object.`);
        }
      }
    }
    return ref;
  }
  try {
    const result = parse();
    return unref(result);
  } catch (error) {
    console.warn(`safeParse error: ${error.message} (Expr: "${expression}")`, error);
    return null;
  }
}
const customOperators = new Map(
  Object.entries({
    $organization_id: () => localStorage.getItem("organization_id"),
    $user_id: () => localStorage.getItem("user_id"),
    $client_id: () => localStorage.getItem("clientId"),
    $session_id: () => localStorage.getItem("session_id"),
    $this: (element) => element,
    $value: (element) => element && element.getValue ? element.getValue() : "",
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
    // Unwrap query results correctly: Returns only the single first item
    $query: (element, args) => {
      let selector = args;
      if (typeof selector === "string") {
        selector = selector.trim();
        if (selector.startsWith("'") && selector.endsWith("'") || selector.startsWith('"') && selector.endsWith('"')) {
          selector = selector.slice(1, -1);
        }
        if (selector.includes("$document")) return void 0;
      }
      try {
        let results = queryElements({ element, selector });
        if (!results || results.length === 0) return void 0;
        return results[0];
      } catch (error) {
        console.warn(`Operator Engine: Invalid $query selector => "${selector}"`, error);
        return void 0;
      }
    },
    // Unwrap query results correctly: Always returns an array 
    $queryAll: (element, args) => {
      let selector = args;
      if (typeof selector === "string") {
        selector = selector.trim();
        if (selector.startsWith("'") && selector.endsWith("'") || selector.startsWith('"') && selector.endsWith('"')) {
          selector = selector.slice(1, -1);
        }
        if (selector.includes("$document")) return [];
      }
      try {
        let results = queryElements({ element, selector });
        if (!results || results.length === 0) return [];
        return Array.from(results);
      } catch (error) {
        console.warn(`Operator Engine: Invalid $queryAll selector => "${selector}"`, error);
        return [];
      }
    },
    $eval: (element, args, context) => safeParse(args, context.registry),
    $relativePath: () => {
      let currentPath = window.location.pathname.replace(/\/[^\/]*$/, "");
      let depth = currentPath.split("/").filter(Boolean).length;
      return depth > 0 ? "../".repeat(depth) : "./";
    },
    $path: () => {
      let path = window.location.pathname;
      if (path.split("/").pop().includes(".")) path = path.replace(/\/[^\/]+$/, "/");
      return path === "/" ? "" : path;
    },
    $param: (element, args) => args,
    $getObjectValue: (element, args) => {
      if (Array.isArray(args) && args.length >= 2) return getValueFromObject(args[0], args[1]);
      return "";
    },
    $setValue: (element, args) => element.setValue(...args) || "",
    $true: () => true,
    $false: () => false,
    $parse: (element, args) => {
      let value = args || "";
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    },
    $numberFormat: (element, args) => {
      let number = parseFloat(args[0]);
      if (!Array.isArray(args)) args = [args];
      const locale = args[0] || void 0;
      const options = args[1] || {};
      const numCandidate = args[2] !== void 0 ? args[2] : args[0];
      number = parseFloat(numCandidate);
      if (isNaN(number)) return String(numCandidate != null ? numCandidate : "");
      return new Intl.NumberFormat(locale, options).format(number);
    },
    $uid: (element, args) => uid(args[0]) || ""
  })
);
const isConstructor = (func, name) => {
  try {
    if (typeof func !== "function") return false;
    if (/^\s*class\s+/.test(func.toString())) return true;
    if (!func.prototype) return false;
    const n = name || func.name;
    if (n && /^[A-Z]/.test(n)) return true;
  } catch (e) {
  }
  return false;
};
const findInnermostOperator = (expression) => {
  let parens = [];
  let stack = [];
  let inSQ = false, inDQ = false;
  for (let i = 0; i < expression.length; i++) {
    const char = expression[i];
    if (char === "\\") {
      i++;
      continue;
    }
    if (char === '"' && !inSQ) inDQ = !inDQ;
    if (char === "'" && !inDQ) inSQ = !inSQ;
    if (inSQ || inDQ) continue;
    if (char === "(") {
      stack.push(i);
    } else if (char === ")") {
      if (stack.length > 0) {
        const start = stack.pop();
        parens.push({ start, end: i, depth: stack.length });
      }
    }
  }
  parens.sort((a, b) => b.depth - a.depth || b.start - a.start);
  function stripParentheses(str) {
    let result = str.trim();
    if (result.startsWith("(") && result.endsWith(")")) {
      let balance = 0;
      let isMatchedPair = true;
      for (let i = 0; i < result.length - 1; i++) {
        if (result[i] === "(") balance++;
        else if (result[i] === ")") balance--;
        if (balance === 0) {
          isMatchedPair = false;
          break;
        }
      }
      if (isMatchedPair && balance === 1) {
        return result.substring(1, result.length - 1);
      }
    }
    return result;
  }
  for (const p of parens) {
    const insideParens = expression.substring(p.start + 1, p.end).trim();
    const leftPart = expression.substring(0, p.start);
    const match = leftPart.match(/(?:^|[^\w\$])(\$[\w\-]+|ObjectId\b)\s*$/);
    if (match) {
      let opName = match[1] === "ObjectId" ? "ObjectId()" : match[1];
      if (customOperators.has(opName) || /^\$[\w\-]+$/.test(opName)) {
        const spacesMatch = leftPart.match(/\s*$/);
        const spacesAtEnd = spacesMatch ? spacesMatch[0].length : 0;
        const fullMatchStart = match.index + match[0].length - match[1].length - spacesAtEnd;
        const resultBlock = {
          operator: opName,
          args: insideParens,
          // Perfectly isolated arguments, handling nested chains
          fullMatch: expression.substring(fullMatchStart, p.end + 1),
          rawContent: expression.substring(fullMatchStart, p.end + 1)
        };
        return resultBlock;
      }
    }
  }
  const bareRegex = /(?:^|[^\w\$])(\$[\w\-]+|ObjectId\b)/g;
  let bareMatch;
  let bareCandidates = [];
  while ((bareMatch = bareRegex.exec(expression)) !== null) {
    let possibleOp = bareMatch[1];
    let opName = possibleOp === "ObjectId" ? "ObjectId()" : possibleOp;
    let remainder = expression.substring(bareMatch.index + bareMatch[0].length);
    if (!/^\s*\(/.test(remainder)) {
      if (customOperators.has(opName) || /^\$[\w\-]+$/.test(opName)) {
        bareCandidates.push({
          operator: opName,
          args: "",
          rawContent: possibleOp,
          fullMatch: possibleOp,
          start: bareMatch.index + (bareMatch[0].length - possibleOp.length)
        });
      }
    }
  }
  if (bareCandidates.length > 0) {
    bareCandidates.sort((a, b) => b.start - a.start);
    return bareCandidates[0];
  }
  const defaultFallback = { operator: null, args: stripParentheses(expression), rawContent: expression.trim() };
  return defaultFallback;
};
function processOperators(element, value, exclude = [], parent, params = [], objectRegistry = /* @__PURE__ */ new Map()) {
  if (typeof value !== "string" || !value.includes("$") && !value.includes("ObjectId()")) return value;
  let processedValue = value, hasPromise = false, unresolvedTokens = /* @__PURE__ */ new Map();
  while (processedValue.includes("$") || processedValue.includes("ObjectId()")) {
    const paramMatch = processedValue.match(/^\$\$PARAM_(\d+)\$\$/);
    if (paramMatch && Array.isArray(params) && params.length > 0) {
      const index = parseInt(paramMatch[1], 10);
      if (index < params.length) {
        processedValue = processedValue.replace(paramMatch[0], params[index]);
        continue;
      }
    }
    const { operator, args, rawContent, fullMatch } = findInnermostOperator(processedValue);
    if (!operator || operator === "$param" && !args) break;
    const textToReplace = fullMatch || rawContent;
    if (exclude.includes(operator)) {
      const token = `__UNRESOLVED_${unresolvedTokens.size}__`;
      unresolvedTokens.set(token, textToReplace);
      processedValue = processedValue.replace(textToReplace, token);
      continue;
    }
    let resolvedValue = resolveOperator(element, operator, args, parent, params, objectRegistry);
    if (resolvedValue === void 0) {
      const token = `__UNRESOLVED_${unresolvedTokens.size}__`;
      unresolvedTokens.set(token, textToReplace);
      processedValue = processedValue.replace(textToReplace, token);
      continue;
    }
    if (resolvedValue instanceof Promise) {
      const paramIndex = params.length;
      params.push(resolvedValue);
      processedValue = processedValue.replace(textToReplace, `$$PARAM_${paramIndex}$$`);
      hasPromise = true;
      break;
    }
    if (params.some((p) => p instanceof Promise)) {
      hasPromise = true;
      break;
    }
    let replacement = "";
    if (operator === "$param") params.push(resolvedValue);
    else if (resolvedValue !== null && (typeof resolvedValue === "object" || typeof resolvedValue === "function")) {
      const token = `__OBJ_${objectRegistry.size}__`;
      objectRegistry.set(token, resolvedValue);
      replacement = token;
    } else replacement = resolvedValue != null ? resolvedValue : "";
    if (processedValue === textToReplace) {
      processedValue = replacement;
      break;
    }
    processedValue = processedValue.replace(textToReplace, replacement);
  }
  if (typeof processedValue === "string") {
    let keys = Array.from(unresolvedTokens.keys()).reverse();
    for (const token of keys) {
      processedValue = processedValue.replaceAll(token, unresolvedTokens.get(token));
    }
    const exactMethodMatch = processedValue.match(/^__OBJ_\d+__(?:\.[a-zA-Z0-9_]+)+(?:\(.*\))?$/);
    if (exactMethodMatch) {
      const parsed = safeParse(processedValue, objectRegistry);
      return parsed !== null && parsed !== void 0 ? parsed : "";
    }
    const exactMatch = processedValue.match(/^__OBJ_(\d+)__$/);
    if (exactMatch && objectRegistry.has(processedValue)) {
      processedValue = objectRegistry.get(processedValue);
    } else {
      const objRegex = /__OBJ_\d+__(?:\.[a-zA-Z0-9_]+)+(?:\([^)]*\))?/g;
      if (processedValue.includes("__OBJ_")) {
        processedValue = processedValue.replace(objRegex, (match) => {
          const parsed = safeParse(match, objectRegistry);
          return parsed !== null && parsed !== void 0 ? parsed : "";
        });
      }
    }
  }
  if (hasPromise) return { value: processedValue, params, objectRegistry };
  return processedValue;
}
async function processOperatorsAsync(element, value, exclude = [], parent, params = [], objectRegistry = /* @__PURE__ */ new Map()) {
  let result = processOperators(element, value, exclude, parent, params, objectRegistry);
  while (typeof result === "object" && result.params) {
    const resolvedParams = await Promise.all(result.params);
    result = processOperators(element, result.value, exclude, parent, resolvedParams, result.objectRegistry || objectRegistry);
  }
  return result;
}
function resolveOperator(element, operator, args, parent, params, objectRegistry) {
  if (params.some((p) => p instanceof Promise)) return "";
  if (args && typeof args === "string" && args.includes("$")) {
    args = processOperators(element, args, [], operator, params, objectRegistry);
  }
  let targetElements = element ? [element] : [];
  if (args && typeof args === "string") {
    const objMatch = args.match(/^__OBJ_(\d+)__$/);
    if (objMatch && objectRegistry.has(args)) {
      let registeredVal = objectRegistry.get(args);
      let isList = Array.isArray(registeredVal) || typeof NodeList !== "undefined" && registeredVal instanceof NodeList || typeof HTMLCollection !== "undefined" && registeredVal instanceof HTMLCollection;
      targetElements = isList ? Array.from(registeredVal) : [registeredVal];
    } else if (!customOperators.has(operator) && operator === "$query") {
      let qResults = queryElements({ element, selector: args });
      if (!qResults) {
        targetElements = [];
      } else {
        let isList = Array.isArray(qResults) || typeof NodeList !== "undefined" && qResults instanceof NodeList || typeof HTMLCollection !== "undefined" && qResults instanceof HTMLCollection;
        targetElements = isList ? Array.from(qResults) : [qResults];
      }
      if (!targetElements.length) return void 0;
    }
  }
  let value = processValues(targetElements, operator, args, parent, objectRegistry);
  if (value && typeof value === "string" && value.includes("$")) {
    value = processOperators(element, value, [], parent, params, objectRegistry);
  }
  return value;
}
function processValues(elements, operator, args, parent, objectRegistry) {
  let customOp = customOperators.get(operator);
  let results = [];
  let hasValidProperty = customOp ? true : false;
  const context = { registry: objectRegistry, element: elements[0] };
  for (const el of elements) {
    if (!el) continue;
    let rawValue = customOp;
    const propName = customOp ? null : operator.substring(1);
    if (!customOp) {
      if (propName in el) {
        hasValidProperty = true;
        rawValue = el[propName];
      } else {
        continue;
      }
    }
    if (typeof rawValue === "function") {
      try {
        if (customOp) rawValue = Array.isArray(args) ? rawValue(el, ...args, context) : rawValue(el, args, context);
        else {
          if (isConstructor(rawValue, propName)) rawValue = Array.isArray(args) ? new rawValue(...args) : new rawValue(args);
          else rawValue = Array.isArray(args) ? rawValue.apply(el, args) : rawValue.call(el, args);
        }
      } catch (err) {
        console.warn(`Operator Engine: Failed to execute method or operator "${operator}"`, err);
        continue;
      }
    }
    if (rawValue !== void 0 && rawValue !== null) {
      results.push(rawValue);
    }
  }
  if (!hasValidProperty) return void 0;
  if (results.length === 0) return "";
  if (results.length === 1) return results[0];
  return results;
}
function getSubdomain() {
  const hostname = window.location.hostname, parts = hostname.split(".");
  if (parts.length > 2 && isNaN(parseInt(parts[parts.length - 1]))) return parts.slice(0, parts.length - 2).join(".");
  return null;
}
export {
  customOperators,
  processOperators,
  processOperatorsAsync
};
