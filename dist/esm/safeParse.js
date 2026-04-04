const constants = { PI: Math.PI, E: Math.E };
const functions = {
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
  tan: Math.tan
};
function safeParse(expression, context = {}) {
  if (typeof expression !== "string") {
    expression = String(expression);
  }
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
    return parseTernary();
  }
  function parseTernary() {
    let left = parseLogical();
    if (peek() === "?") {
      consume();
      let trueExpr = parseTernary();
      if (peek() === ":") {
        consume();
        let falseExpr = parseTernary();
        return left ? trueExpr : falseExpr;
      }
    }
    return left;
  }
  function parseLogical() {
    let left = parseComparison();
    while (peek() === "&&" || peek() === "||") {
      let op = consume();
      let right = parseComparison();
      if (op === "&&") left = left && right;
      if (op === "||") left = left || right;
    }
    return left;
  }
  function parseComparison() {
    let left = parseAdditive();
    while ([">", "<", ">=", "<=", "===", "!==", "==", "!="].includes(peek())) {
      let op = consume();
      let right = parseAdditive();
      if (op === ">") left = left > right;
      if (op === "<") left = left < right;
      if (op === ">=") left = left >= right;
      if (op === "<=") left = left <= right;
      if (op === "===") left = left === right;
      if (op === "!==") left = left !== right;
      if (op === "==") left = left == right;
      if (op === "!=") left = left != right;
    }
    return left;
  }
  function parseAdditive() {
    let left = parseMultiplicative();
    while (["+", "-"].includes(peek())) {
      let op = consume();
      let right = parseMultiplicative();
      if (op === "+") left = left + right;
      if (op === "-") left = left - right;
    }
    return left;
  }
  function parseMultiplicative() {
    let left = parsePrimary();
    while (["*", "/", "%"].includes(peek())) {
      let op = consume();
      let right = parsePrimary();
      if (op === "*") left = left * right;
      if (op === "/") left = left / right;
      if (op === "%") left = left % right;
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
      let expr = parse();
      if (peek() === ")") consume();
      return expr;
    }
    if (token === "-") return -parsePrimary();
    if (token === "!") return !parsePrimary();
    if (constants.hasOwnProperty(token)) {
      return constants[token];
    }
    if (peek() === "(" && functions.hasOwnProperty(token)) {
      consume();
      let args = [];
      if (peek() !== ")") {
        args.push(parse());
        while (peek() === ",") {
          consume();
          args.push(parse());
        }
      }
      if (peek() === ")") consume();
      return functions[token](...args);
    }
    let path = token.split(".");
    let val = context;
    for (let part of path) {
      if (val !== null && typeof val === "object" && part in val) {
        val = val[part];
      } else {
        return void 0;
      }
    }
    return val;
  }
  try {
    const result = parse();
    return result !== void 0 ? result : null;
  } catch (error) {
    console.warn(
      `Unexpected parsing error: ${error.message} (Expression context: "${expression}")`,
      error
    );
    return null;
  }
}
export {
  safeParse
};
