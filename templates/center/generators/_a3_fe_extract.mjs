// _a3_fe_extract.mjs — the FRONTEND arm's compiler pass (READ-ONLY). Runs the twin's OWN
// `typescript` (the one dependency every TS frontend ships) over its tsconfig and emits, per
// source file: resolved imports, exported symbols (kind · JSX · hook), per-export body REFS
// (jsx tags · calls · type refs · identifiers) and the import BINDINGS that resolve each local
// name to the file+symbol that declares it (barrels followed by the checker, not by us).
// _a3_fe.py classifies + wires on top of this. Nothing here writes to the tree.
//
//   node _a3_fe_extract.mjs <web_root> [out.json] [repo_root]   (one summary line on stderr)
//   repo_root = the root every path is emitted RELATIVE to (the caller's REPO_ROOT, so ids join
//   _a3_web's `web:<rel>` screens + graft's node paths); default = the nearest .git ancestor.
//
// Determinism: files sorted, refs deduped + sorted, no wallclock. Honest-empty is the
// CALLER's job — a missing typescript exits 3 with a reason on stderr; a missing tsconfig 4.
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const WEB = path.resolve(process.argv[2] || '.');
const OUT = process.argv[3] || null;
const TS_DIR = process.env.GABE_TS_DIR || null;          // override: where `typescript` lives (batteries)
let ts;
try {
  const req = createRequire(path.join(WEB, 'package.json'));
  ts = TS_DIR ? createRequire(path.join(TS_DIR, 'package.json'))('typescript') : req('typescript');
} catch (e) {
  process.stderr.write('fe-extract: typescript not resolvable from ' + (TS_DIR || WEB) + ' (' + e.message.split('\n')[0] + ')\n');
  process.exit(3);
}
const cfgPath = ts.findConfigFile(WEB, ts.sys.fileExists, 'tsconfig.json');
if (!cfgPath) { process.stderr.write('fe-extract: no tsconfig.json at or above ' + WEB + '\n'); process.exit(4); }
const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile);
const parsed = ts.parseJsonConfigFileContent(cfg.config || {}, ts.sys, path.dirname(cfgPath));
// PROJECT REFERENCES: the default Vite React+TS root tsconfig is a stub — files:[] + references to
// tsconfig.app.json/tsconfig.node.json, no include. Its own fileNames is empty, so expand the
// referenced configs and union their fileNames, else the WHOLE frontend silently drops (147 files → 0).
let fileNames = parsed.fileNames || [];
let options = parsed.options;
if (fileNames.length === 0 && parsed.projectReferences && parsed.projectReferences.length) {
  const seen = new Set(); const merged = [];
  for (const ref of parsed.projectReferences) {
    let rp = ref && ref.path; if (!rp) continue;
    if (ts.sys.directoryExists && ts.sys.directoryExists(rp)) rp = ts.findConfigFile(rp, ts.sys.fileExists, 'tsconfig.json');
    if (!rp || !ts.sys.fileExists(rp)) continue;
    const rcfg = ts.readConfigFile(rp, ts.sys.readFile);
    const rparsed = ts.parseJsonConfigFileContent(rcfg.config || {}, ts.sys, path.dirname(rp));
    for (const fn of (rparsed.fileNames || [])) { if (!seen.has(fn)) { seen.add(fn); merged.push(fn); } }
    options = Object.assign({}, rparsed.options, options);   // root options keep precedence
  }
  if (merged.length) fileNames = merged;
}
const program = ts.createProgram({ rootNames: fileNames, options });
const checker = program.getTypeChecker();

// the repo root = nearest ancestor of WEB holding .git (else WEB's grandparent); paths are
// emitted RELATIVE to it so they join _a3_web's screen ids and graft's node paths.
let ROOT = process.argv[4] ? path.resolve(process.argv[4]) : WEB;
if (!process.argv[4]) {
  while (ROOT !== path.dirname(ROOT) && !fs.existsSync(path.join(ROOT, '.git'))) ROOT = path.dirname(ROOT);
  if (ROOT === path.dirname(ROOT)) ROOT = path.resolve(WEB, '..', '..');
}
const rel = f => path.relative(ROOT, f).split(path.sep).join('/');
const SRC = fs.existsSync(path.join(WEB, 'src')) ? path.join(WEB, 'src') + path.sep : WEB + path.sep;
const NOISE = /\/(node_modules|dist|build|storybook-static|coverage|\.next|\.turbo)\//;
const isTest = f => /\.(test|spec)\.(ts|tsx|js|jsx)$|\/__tests__\/|\/__mocks__\/|\/test\/|\/__regression__\/|\/e2e\/|\.e2e\./.test(f);

const leftmost = n => { while (n && (ts.isPropertyAccessExpression(n) || ts.isQualifiedName(n))) n = ts.isPropertyAccessExpression(n) ? n.expression : n.left; return n && ts.isIdentifier(n) ? n.text : null; };
const declKind = d => {
  if (!d) return 'other';
  if (ts.isFunctionDeclaration(d) || ts.isFunctionExpression(d) || ts.isArrowFunction(d) || ts.isMethodDeclaration(d)) return 'function';
  if (ts.isClassDeclaration(d)) return 'class';
  if (ts.isInterfaceDeclaration(d)) return 'interface';
  if (ts.isTypeAliasDeclaration(d)) return 'type';
  if (ts.isEnumDeclaration(d)) return 'enum';
  if (ts.isVariableDeclaration(d)) {
    const init = d.initializer;
    if (!init) return 'const';
    if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) return 'function';
    if (ts.isCallExpression(init)) {
      // unwrap `create<S>()(...)` (zustand curried) + `memo(...)`/`forwardRef(...)`
      let c = init; while (ts.isCallExpression(c.expression)) c = c.expression;
      return 'call:' + (leftmost(c.expression) || c.expression.getText(d.getSourceFile()).slice(0, 30));
    }
    return 'const';
  }
  return 'other';
};
// the innermost call's FIRST argument when it is a string literal: `createFileRoute("/login")({…})` · `createContext("x")`.
// Idiom-free here — the Python generator decides what a literal means (a file-router literal becomes the route's label).
const callArg0 = d => {
  if (!d || !ts.isVariableDeclaration(d) || !d.initializer || !ts.isCallExpression(d.initializer)) return null;
  let c = d.initializer; while (ts.isCallExpression(c.expression)) c = c.expression;
  const a = c.arguments[0];
  return a && (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) ? a.text : null;
};
// CLIENT-STATE KEYS (2026-09-07): the string a piece names when it reaches Web Storage or a query cache.
// RAW capture, per this file's stated split — the extractor takes the LITERAL, `_a3_fe.py`'s rosters decide
// which object/method is storage and which direction it runs. `LITS` is the current file's module-level
// `const NAME = '<literal>'` map, so a key passed as an identifier resolves without guessing.
let LITS = {};
const litOf = a => !a ? null
  : (ts.isStringLiteral(a) || ts.isNoSubstitutionTemplateLiteral(a)) ? a.text
  : (ts.isIdentifier(a) && Object.prototype.hasOwnProperty.call(LITS, a.text)) ? LITS[a.text] : null;
const collectLits = sf => {   // module scope only — a const inside a function is not a shared key
  const out = {};
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const d of st.declarationList.declarations)
      if (ts.isIdentifier(d.name) && d.initializer && (ts.isStringLiteral(d.initializer) || ts.isNoSubstitutionTemplateLiteral(d.initializer)))
        out[d.name.text] = d.initializer.text;
  }
  return out;
};
const refsOf = node => {
  const jsx = new Set(), calls = new Set(), types = new Set(), idents = new Set(), ctxArgs = new Set();
  const storage = new Set(), qkeys = new Set();
  let hasJsx = false;
  const walk = n => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) { hasJsx = true; const t = leftmost(n.tagName); if (t && /^[A-Z]/.test(t)) jsx.add(t); }
    else if (ts.isJsxFragment(n)) hasJsx = true;
    else if (ts.isCallExpression(n)) {
      const c = leftmost(n.expression); if (c) calls.add(c);
      if (c && /^use(Context|Store|Atom|Selector|AtomValue|SetAtom|Reducer)$/.test(c) && n.arguments[0] && ts.isIdentifier(n.arguments[0])) ctxArgs.add(n.arguments[0].text);
      // `<obj>.<method>('<key>')` — the object, the method and the key, verbatim. No roster here.
      if (ts.isPropertyAccessExpression(n.expression) && ts.isIdentifier(n.expression.expression) && ts.isIdentifier(n.expression.name)) {
        const k = litOf(n.arguments[0]);
        if (k != null) storage.add(n.expression.expression.text + '\u0000' + n.expression.name.text + '\u0000' + k);
      }
    }
    // a `queryKey: [<literal>, …]` property — the ROOT segment names the cache entry. A key built by a
    // factory call yields no literal here and is simply not captured (reported by absence, never guessed).
    else if (ts.isPropertyAssignment(n) && n.name && n.name.getText(n.getSourceFile()) === 'queryKey'
             && n.initializer && ts.isArrayLiteralExpression(n.initializer)) {
      const k = litOf(n.initializer.elements[0]); if (k != null) qkeys.add(k);
    }
    else if (ts.isTypeReferenceNode(n)) { const t = leftmost(n.typeName); if (t) types.add(t); }
    else if (ts.isIdentifier(n)) idents.add(n.text);
    ts.forEachChild(n, walk);
  };
  walk(node);
  const out = { hasJsx, jsx: [...jsx].sort(), calls: [...calls].sort(), types: [...types].sort(), idents: [...idents].sort(), ctxArgs: [...ctxArgs].sort() };
  if (storage.size) out.storage = [...storage].sort().map(x => x.split('\u0000'));   // [[obj, method, key], …]
  if (qkeys.size) out.queryKeys = [...qkeys].sort();
  return out;
};

// ── D5 (operator 2026-09-05): a TYPE's MEMBERS — the frontend's schema fields — and a STORE's SHAPE — the value
//    type on createContext<T>() / create<T>()(…), the frontend's table columns. A member = [name, type text];
//    a method signature = name(). The shape keeps the type text, the type-reference names inside it (the arm
//    resolves them to type pieces → fields + a typed wire) and, for an inline literal, its members directly.
const STORE_CALLEES = /^(create|createStore|createContext|createSlice|configureStore|atom|atomWithStorage|atomFamily|signal|observable|makeAutoObservable|proxy|createSignal|writable|readable)$/;
const typeText = (t, sf) => t ? t.getText(sf).replace(/\s+/g, ' ').slice(0, 80) : '';
const membersOfNodes = (ms, sf) => { const out = []; for (const m of ms) { if ((ts.isPropertySignature(m) || ts.isMethodSignature(m)) && m.name) { const nm = m.name.getText(sf); out.push([nm, ts.isMethodSignature(m) ? nm + '()' : typeText(m.type, sf)]); } } return out; };
// an object-like type: an object, or an INTERSECTION of objects (`type Store = State & Actions` — gastify's stores;
// review 2026-09-05: 3 of its 4 typed stores drew no columns). A union or a primitive stays honest-empty.
const objLike = t => !!t && (!!(t.flags & ts.TypeFlags.Object) || (!!(t.flags & ts.TypeFlags.Intersection) && (t.types || []).every(x => x.flags & ts.TypeFlags.Object)));
const propsOf = (t, at) => { const props = t.getProperties(); return props.length ? props.map(p => [p.name, checker.typeToString(checker.getTypeOfSymbolAtLocation(p, at)).replace(/\s+/g, ' ').slice(0, 80)]) : null; };
const membersOf = d => {
  if (!d) return null; const sf = d.getSourceFile();
  if (ts.isInterfaceDeclaration(d)) return membersOfNodes(d.members, sf);
  if (ts.isTypeAliasDeclaration(d) && ts.isTypeLiteralNode(d.type)) return membersOfNodes(d.type.members, sf);
  if (ts.isTypeAliasDeclaration(d) && ts.isIntersectionTypeNode(d.type)) {   // the checker merges the constituents' properties
    try { const t = checker.getTypeAtLocation(d.name); if (objLike(t)) return propsOf(t, d.name); } catch {}
  }
  return null;
};
const shapeOf = d => {
  if (!d || !ts.isVariableDeclaration(d) || !d.initializer || !ts.isCallExpression(d.initializer)) return null;
  let c = d.initializer; while (ts.isCallExpression(c.expression)) c = c.expression;   // create<S>()(…) — the inner call carries the type args
  const callee = leftmost(c.expression); if (!callee || !STORE_CALLEES.test(callee)) return null;
  const ta = c.typeArguments && c.typeArguments[0]; const sf = d.getSourceFile();
  if (!ta) return { text: '', refs: [], members: null };
  const refs = new Set(); const walk = n => { if (ts.isTypeReferenceNode(n)) { const t = leftmost(n.typeName); if (t) refs.add(t); } ts.forEachChild(n, walk); }; walk(ta);
  let members = ts.isTypeLiteralNode(ta) ? membersOfNodes(ta.members, sf) : null;
  if (!members) {                         // a named type — exported or NOT (useUiStore's local UiState): ask the checker for its properties
    try {
      let t = checker.getTypeAtLocation(ta); if (t.getNonNullableType) t = t.getNonNullableType();   // AuthContextValue | undefined → AuthContextValue
      if (objLike(t)) members = propsOf(t, ta);   // object / intersection-of-objects only — a primitive (string) would list its prototype methods
    } catch {}
  }
  return { text: typeText(ta, sf), refs: [...refs].sort(), members };
};

// ── FLOW (element forms Slice 11a, GABE_FE_FLOW=1 — a SECOND invocation, D21): raw control flow per body. Every
//    function-like module-level declaration, and every function-valued property of an object a declaration's call is
//    given (`createFileRoute(…)({ beforeLoad })`), becomes a body of ROWS — ret · throw · call · new · cmp · jsx — each
//    with the GUARDS above it, the earlier exits it PASSED (`after`), and the callback CONTEXT it sits in. Destructured
//    binds ride the call that feeds them; a name or property access resolves to its literal through the checker
//    (constants ≤ 3 hops: `PATHS.setup` → "/setup"). Route-config trees (object literals carrying path · element ·
//    children …) are captured as trees. Raw facts only — no roster: the Python forms decide what a navigation, a query
//    state or a guard is. Without the flag no `flow` key is emitted, so the structure run's bytes never depend on it.
const FLOW = process.env.GABE_FE_FLOW === '1';
const ROW_CAP = 600;
const LIT_DEPTH = 3;
const clip = (s, n = 120) => String(s).replace(/\s+/g, ' ').slice(0, n);
const lineOf = n => { const sf = n.getSourceFile(); return sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1; };
const isFn = n => !!n && (ts.isArrowFunction(n) || ts.isFunctionExpression(n) || ts.isFunctionDeclaration(n) || ts.isMethodDeclaration(n));
const isJsx = n => !!n && (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isJsxFragment(n));
const unparen = n => { while (n && (ts.isParenthesizedExpression(n) || ts.isAsExpression(n) || ts.isNonNullExpression(n) || (ts.isSatisfiesExpression && ts.isSatisfiesExpression(n)))) n = n.expression; return n; };
const resolveLit = (e, depth = 0) => {
  e = unparen(e);
  if (!e || depth > LIT_DEPTH) return null;
  if (ts.isStringLiteral(e) || ts.isNoSubstitutionTemplateLiteral(e)) return e.text;
  if (ts.isTemplateExpression(e)) {                          // `${PATHS.login}?${search}` → "/login?*" — an unreadable span is `*`
    let out = e.head.text, known = e.head.text.length > 0;
    for (const sp of e.templateSpans) { const v = resolveLit(sp.expression, depth + 1); if (v != null) known = true; out += (v != null ? String(v) : '*') + sp.literal.text; }
    return known ? out : null;
  }
  if (ts.isNumericLiteral(e)) return Number(e.text);
  if (e.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (e.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isIdentifier(e) || ts.isPropertyAccessExpression(e)) {
    let s;
    try { s = checker.getSymbolAtLocation(ts.isPropertyAccessExpression(e) ? e.name : e); if (s && s.flags & ts.SymbolFlags.Alias) s = checker.getAliasedSymbol(s); } catch { return null; }
    const d = s && (s.declarations || [])[0];
    if (!d) return null;
    if ((ts.isVariableDeclaration(d) || ts.isPropertyAssignment(d)) && d.initializer) return resolveLit(d.initializer, depth + 1);
    if (ts.isEnumMember(d) && d.initializer) return resolveLit(d.initializer, depth + 1);
  }
  return null;
};
const tagOf = n => ts.isJsxElement(n) ? n.openingElement.tagName.getText(n.getSourceFile()) : ts.isJsxSelfClosingElement(n) ? n.tagName.getText(n.getSourceFile()) : ts.isJsxFragment(n) ? '<>' : null;
const jsxTags = (n, cap = 6) => { const out = []; const w = x => { if (out.length >= cap) return; const t = isJsx(x) ? tagOf(x) : null; if (t && t !== '<>') out.push(t); ts.forEachChild(x, w); }; w(n); return out; };
const jsxProps = n => {
  const el = ts.isJsxElement(n) ? n.openingElement : n; const sf = n.getSourceFile(); const out = {};
  for (const a of (el.attributes && el.attributes.properties) || []) {
    if (!ts.isJsxAttribute(a) || !a.name) continue;
    const nm = a.name.getText(sf), init = a.initializer;
    if (!init) { out[nm] = true; continue; }
    const ex = ts.isJsxExpression(init) ? init.expression : init;
    const lit = resolveLit(ex);
    out[nm] = lit != null ? lit : (ex ? clip(ex.getText(sf), 60) : true);
  }
  return out;
};
const stmtList = s => ts.isBlock(s) ? s.statements : [s];
const exits = s => { const list = stmtList(s); const last = list[list.length - 1]; return !!last && (ts.isReturnStatement(last) || ts.isThrowStatement(last)); };
const CMP_OPS = new Set([ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken, ts.SyntaxKind.EqualsEqualsToken,
  ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken, ts.SyntaxKind.LessThanEqualsToken, ts.SyntaxKind.GreaterThanEqualsToken]);

const bodyRows = root => {
  const rows = []; let truncated = false;
  const push = (k, node, extra, guards, after, ctx) => {
    if (rows.length >= ROW_CAP) { truncated = true; return null; }
    const row = { k, line: lineOf(node) };
    if (guards.length) row.guards = guards.map(g => ({ ...g }));
    if (after.length) row.after = after.map(g => ({ ...g }));
    if (ctx.length) row.ctx = [...ctx];
    Object.assign(row, extra);
    rows.push(row);
    return row;
  };
  const pred = n => clip(n.getText(n.getSourceFile()));
  const expr = (n, guards, after, ctx) => {
    if (!n) return;
    const sf = n.getSourceFile();
    if (ts.isConditionalExpression(n)) {
      expr(n.condition, guards, after, ctx);
      expr(n.whenTrue, [...guards, { pred: pred(n.condition) }], after, ctx);
      expr(n.whenFalse, [...guards, { pred: pred(n.condition), neg: true }], after, ctx);
      return;
    }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && isJsx(unparen(n.right))) {
      expr(n.left, guards, after, ctx);
      expr(n.right, [...guards, { pred: pred(n.left) }], after, ctx);
      return;
    }
    if (isFn(n)) { fnBody(n, guards, after, [...ctx, 'callback']); return; }
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n)) push('jsx', n, { tag: tagOf(n), props: jsxProps(n) }, guards, after, ctx);
    else if (ts.isCallExpression(n) || ts.isNewExpression(n)) {
      const callee = clip(n.expression.getText(sf), 80);
      const lits = (n.arguments || []).slice(0, 3).map(a => resolveLit(a));
      const extra = { callee };
      if (lits.some(a => a != null)) extra.args = lits;
      const obj = (n.arguments || []).map(unparen).find(a => a && ts.isObjectLiteralExpression(a));   // `redirect({ to: "/items" })` — the literal properties
      if (obj) { const props = {}; for (const p of obj.properties) if (ts.isPropertyAssignment(p) && p.name) { const v = resolveLit(p.initializer); if (v != null) props[p.name.getText(sf)] = v; } if (Object.keys(props).length) extra.props = props; }
      push(ts.isCallExpression(n) ? 'call' : 'new', n, extra, guards, after, ctx);
      const cname = leftmost(n.expression) || callee;
      if (ts.isPropertyAccessExpression(n.expression)) expr(n.expression.expression, guards, after, ctx);
      for (const a of n.arguments || []) {
        if (isFn(a)) { fnBody(a, guards, after, [...ctx, 'callback:' + cname]); continue; }
        if (ts.isObjectLiteralExpression(a)) {
          for (const p of a.properties) {
            const v = ts.isPropertyAssignment(p) ? p.initializer : ts.isMethodDeclaration(p) ? p : ts.isShorthandPropertyAssignment(p) ? null : null;
            const key = p.name ? p.name.getText(sf) : '';
            if (isFn(v)) fnBody(v, guards, after, [...ctx, 'prop:' + cname + '.' + key]);
            else if (v) expr(v, guards, after, ctx);
          }
          continue;
        }
        expr(a, guards, after, ctx);
      }
      return;
    }
    else if (ts.isBinaryExpression(n) && CMP_OPS.has(n.operatorToken.kind)) {
      const r = resolveLit(n.right), l = resolveLit(n.left);
      push('cmp', n, { left: clip(n.left.getText(sf), 60), op: n.operatorToken.getText(sf), right: r != null ? r : clip(n.right.getText(sf), 60), ...(l != null ? { left_lit: l } : {}) }, guards, after, ctx);
    }
    ts.forEachChild(n, c => expr(c, guards, after, ctx));
  };
  const stmts = (list, guards, after, ctx) => {
    let passed = [...after];
    for (const st of list) {
      const sf = st.getSourceFile();
      if (ts.isIfStatement(st)) {
        const p = pred(st.expression);
        expr(st.expression, guards, passed, ctx);
        stmts(stmtList(st.thenStatement), [...guards, { pred: p }], passed, ctx);
        if (st.elseStatement) stmts(stmtList(st.elseStatement), [...guards, { pred: p, neg: true }], passed, ctx);
        if (exits(st.thenStatement) && !st.elseStatement) passed = [...passed, { pred: p, neg: true }];
      } else if (ts.isReturnStatement(st)) {
        const v = unparen(st.expression);
        const extra = { value: st.expression ? clip(st.expression.getText(sf), 80) : null };
        if (isJsx(v)) { extra.jsx = tagOf(v); extra.tags = jsxTags(v); }
        else if (v && v.kind === ts.SyntaxKind.NullKeyword) extra.null = true;
        push('ret', st, extra, guards, passed, ctx);
        if (st.expression) expr(st.expression, guards, passed, ctx);
      } else if (ts.isThrowStatement(st)) {
        const v = unparen(st.expression);
        push('throw', st, { value: clip(st.expression.getText(sf), 80), ...((ts.isCallExpression(v) || ts.isNewExpression(v)) ? { callee: clip(v.expression.getText(sf), 60) } : {}) }, guards, passed, ctx);
        expr(st.expression, guards, passed, ctx);
      } else if (ts.isTryStatement(st)) {
        stmts(st.tryBlock.statements, guards, passed, [...ctx, 'try']);
        if (st.catchClause) stmts(st.catchClause.block.statements, guards, passed, [...ctx, 'catch:' + (st.catchClause.variableDeclaration ? st.catchClause.variableDeclaration.name.getText(sf) : '')]);
        if (st.finallyBlock) stmts(st.finallyBlock.statements, guards, passed, [...ctx, 'finally']);
      } else if (ts.isVariableStatement(st)) {
        for (const d of st.declarationList.declarations) {
          if (!d.initializer) continue;
          const binds = ts.isObjectBindingPattern(d.name) ? d.name.elements.map(e => e.propertyName ? e.propertyName.getText(sf) + ':' + e.name.getText(sf) : e.name.getText(sf))
            : ts.isArrayBindingPattern(d.name) ? d.name.elements.map(e => ts.isOmittedExpression(e) ? '' : e.name.getText(sf)) : [d.name.getText(sf)];
          const before = rows.length;
          expr(d.initializer, guards, passed, ctx);
          const init = unparen(ts.isAwaitExpression(d.initializer) ? d.initializer.expression : d.initializer);
          const fed = ts.isCallExpression(init) ? rows.slice(before).find(r => r.k === 'call' && r.line === lineOf(init) && !r.ctx === !ctx.length) : null;
          if (fed) fed.binds = binds;
        }
      } else if (ts.isBlock(st)) stmts(st.statements, guards, passed, ctx);
      else if (ts.isForOfStatement(st) || ts.isForInStatement(st) || ts.isForStatement(st) || ts.isWhileStatement(st) || ts.isDoStatement(st)) {
        if (st.expression) expr(st.expression, guards, passed, ctx);
        stmts(stmtList(st.statement), guards, passed, [...ctx, 'loop']);
      } else if (ts.isSwitchStatement(st)) {
        expr(st.expression, guards, passed, ctx);
        for (const c of st.caseBlock.clauses)
          stmts(c.statements, [...guards, { pred: ts.isCaseClause(c) ? clip(st.expression.getText(sf), 60) + ' === ' + clip(c.expression.getText(sf), 40) : 'default' }], passed, ctx);
      } else expr(st, guards, passed, ctx);
    }
  };
  const fnBody = (fn, guards, after, ctx) => {
    const b = fn.body; if (!b) return;
    if (ts.isBlock(b)) { stmts(b.statements, guards, after, ctx); return; }
    const v = unparen(b);
    const extra = { value: clip(b.getText(b.getSourceFile()), 80), implicit: true };
    if (isJsx(v)) { extra.jsx = tagOf(v); extra.tags = jsxTags(v); }
    push('ret', b, extra, guards, after, ctx);
    expr(b, guards, after, ctx);
  };
  fnBody(root, [], [], []);
  return { rows, truncated };
};
const fnOfDecl = d => {
  if (!d || !d.initializer) return null;
  let i = unparen(d.initializer);
  while (i && ts.isCallExpression(i) && !isFn(i)) { const f = i.arguments.find(isFn); if (f) return f; i = unparen(i.arguments[0]); }   // memo(() => …) · forwardRef(function …)
  return isFn(i) ? i : null;
};
const ROUTE_KEYS = new Set(['path', 'element', 'children', 'index', 'Component', 'component', 'lazy', 'loader', 'beforeLoad', 'errorElement']);
const isRouteObj = o => ts.isObjectLiteralExpression(o) && o.properties.some(p => ts.isPropertyAssignment(p) && p.name && ROUTE_KEYS.has(p.name.getText(o.getSourceFile())));
const routeNode = o => {
  const sf = o.getSourceFile(); const out = { line: lineOf(o) };
  for (const p of o.properties) {
    if (!ts.isPropertyAssignment(p) || !p.name) continue;
    const key = p.name.getText(sf), v = unparen(p.initializer);
    if (key === 'path') { const l = resolveLit(v); out.path = l != null ? l : clip(v.getText(sf), 60); }
    else if (key === 'index') out.index = resolveLit(v) === true;
    else if (key === 'element' || key === 'errorElement') out[key] = jsxTags(v);
    else if (key === 'children' && ts.isArrayLiteralExpression(v)) out.children = v.elements.filter(isRouteObj).map(routeNode);
    else if (key === 'Component' || key === 'component') out.component = clip(v.getText(sf), 60);
    else if (key === 'beforeLoad' || key === 'loader' || key === 'lazy') out[key] = true;
  }
  return out;
};
const routesOf = sf => {
  const out = [];
  const walk = n => {
    if (ts.isArrayLiteralExpression(n) && n.elements.length && n.elements.some(e => isRouteObj(e) && e.properties.some(p => ts.isPropertyAssignment(p) && p.name && ['element', 'Component', 'children'].includes(p.name.getText(sf))))) {
      out.push({ line: lineOf(n), callee: n.parent && ts.isCallExpression(n.parent) ? clip(n.parent.expression.getText(sf), 60) : null, routes: n.elements.filter(isRouteObj).map(routeNode) });
      return;                                                  // the nested `children` arrays are read by routeNode
    }
    ts.forEachChild(n, walk);
  };
  walk(sf);
  return out;
};
const flowOf = sf => {
  const bodies = {};
  const add = (name, fn) => { if (!fn || bodies[name]) return; const got = bodyRows(fn); bodies[name] = { line: lineOf(fn), rows: got.rows, ...(got.truncated ? { truncated: true } : {}) }; };
  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name) add(st.name.text, st);
    else if (ts.isExportAssignment(st) && isFn(unparen(st.expression))) add('default', unparen(st.expression));
    else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue;
        const fn = fnOfDecl(d);
        if (fn) { add(d.name.text, fn); continue; }
        for (let c = unparen(d.initializer); c && ts.isCallExpression(c); c = unparen(c.expression))
          for (const a of c.arguments)
            if (ts.isObjectLiteralExpression(a))
              for (const p of a.properties) {
                const v = ts.isPropertyAssignment(p) ? unparen(p.initializer) : ts.isMethodDeclaration(p) ? p : null;
                if (p.name && isFn(v)) add(d.name.text + '.' + p.name.getText(sf), v);
              }
      }
    }
  }
  const routes = routesOf(sf);
  return { bodies: Object.fromEntries(Object.keys(bodies).sort().map(k => [k, bodies[k]])), ...(routes.length ? { routes } : {}) };
};

const files = {};
for (const sf of program.getSourceFiles()) {
  const f = sf.fileName;
  if (!f.startsWith(SRC) || sf.isDeclarationFile || f.endsWith('.d.ts') || NOISE.test(f) || isTest(f)) continue;
  const story = /\.stories\.(ts|tsx)$/.test(f);
  LITS = collectLits(sf);   // this file's module-level string consts — an identifier key resolves against them, and only them
  const rec = { story, imports: [], bindings: {}, exports: [] };
  // ── imports (static · re-export · dynamic) resolved by the compiler ──────────────────
  const seen = new Set();
  const addImport = (spec, flags) => {
    const r = ts.resolveModuleName(spec, f, parsed.options, ts.sys);
    const rm = r.resolvedModule;
    const to = rm && !rm.isExternalLibraryImport ? rel(rm.resolvedFileName) : null;
    const key = spec + '|' + (to || '');
    if (seen.has(key)) return; seen.add(key);
    rec.imports.push({ spec, to, external: !!(rm && rm.isExternalLibraryImport), ...flags });
  };
  const walkTop = n => {
    if ((ts.isImportDeclaration(n) || ts.isExportDeclaration(n)) && n.moduleSpecifier && ts.isStringLiteral(n.moduleSpecifier)) {
      addImport(n.moduleSpecifier.text, { typeOnly: !!(n.importClause && n.importClause.isTypeOnly) || !!n.isTypeOnly, dynamic: false, reexport: ts.isExportDeclaration(n) });
    }
    if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteral(n.arguments[0])) addImport(n.arguments[0].text, { typeOnly: false, dynamic: true, reexport: false });
    ts.forEachChild(n, walkTop);
  };
  walkTop(sf);
  // ── bindings: local name → the file+symbol that DECLARES it (checker follows barrels) ──
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !st.importClause) continue;
    const ic = st.importClause;
    const bind = (localId, imported) => {
      let s = checker.getSymbolAtLocation(localId); if (!s) return;
      try { if (s.flags & ts.SymbolFlags.Alias) s = checker.getAliasedSymbol(s); } catch { return; }
      const d = (s.declarations || [])[0]; if (!d) return;
      const df = d.getSourceFile().fileName;
      if (NOISE.test(df) || df.includes('/node_modules/')) { rec.bindings[localId.text] = { ext: true }; return; }
      const nm = (d.name && ts.isIdentifier(d.name)) ? d.name.text : (s.name === 'default' ? imported : s.name);
      rec.bindings[localId.text] = { file: rel(df), name: nm, kind: declKind(d) };
    };
    if (ic.name) bind(ic.name, 'default');
    if (ic.namedBindings) {
      if (ts.isNamespaceImport(ic.namedBindings)) { const r = rec.imports.find(i => i.spec === st.moduleSpecifier.text); rec.bindings[ic.namedBindings.name.text] = r && r.to ? { file: r.to, name: '*', kind: 'namespace' } : { ext: true }; }
      else for (const el of ic.namedBindings.elements) bind(el.name, (el.propertyName || el.name).text);
    }
  }
  // ── LAZY bindings (2026-09-03): `const X = lazy(() => import("spec").then(m => ({ default: m.NAME })))` — React
  //    code-splitting. A lazy() const is NOT an import declaration, so the checker binds nothing and every `<X/>`
  //    in the file resolves to no piece — a whole route file's renders edges vanish (gustify routes/screens.tsx:
  //    13 routes, 0 renders wires). Bind it like a named import: the dynamic import's resolved file (already in
  //    rec.imports) + the mapped export, else `default`. An idiom (the callee is named lazy), never a name-list. ──
  for (const st of sf.statements) {
    if (!ts.isVariableStatement(st)) continue;
    for (const dcl of st.declarationList.declarations) {
      if (!dcl.initializer || !ts.isIdentifier(dcl.name) || !ts.isCallExpression(dcl.initializer)) continue;
      const callee = dcl.initializer.expression;
      const cname = ts.isIdentifier(callee) ? callee.text : (ts.isPropertyAccessExpression(callee) ? callee.name.text : '');
      if (cname !== 'lazy') continue;
      let spec = null, mapped = null;
      const walkLazy = n => {
        if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteral(n.arguments[0])) spec = n.arguments[0].text;
        if (ts.isPropertyAssignment(n) && ts.isIdentifier(n.name) && n.name.text === 'default' && ts.isPropertyAccessExpression(n.initializer)) mapped = n.initializer.name.text;
        ts.forEachChild(n, walkLazy);
      };
      walkLazy(dcl.initializer);
      if (!spec) continue;
      const r = rec.imports.find(i => i.spec === spec);
      rec.bindings[dcl.name.text] = (r && r.to) ? { file: r.to, name: mapped || 'default', kind: 'lazy' } : { ext: true };
    }
  }
  // ── exports: the symbols this file OFFERS (+ their body refs) ─────────────────────────
  const msym = checker.getSymbolAtLocation(sf);
  const exps = msym ? checker.getExportsOfModule(msym) : [];
  for (const e of exps) {
    let s = e; try { if (s.flags & ts.SymbolFlags.Alias) s = checker.getAliasedSymbol(s); } catch {}
    const d = (s.declarations || [])[0];
    const df = d ? rel(d.getSourceFile().fileName) : null;
    const name = (d && d.name && ts.isIdentifier(d.name)) ? d.name.text : e.name;
    const local = df === rel(f);
    const ex = { name, isDefault: e.name === 'default', kind: declKind(d), reexport: local ? null : df };
    const a0 = local ? callArg0(d) : null; if (a0 != null) ex.arg0 = a0;   // the literal the call was given (a router's path) — absent when the first argument is not a string
    if (d && ts.isTypeAliasDeclaration(d) && /^components\s*\[/.test(d.type.getText(d.getSourceFile())))
      ex.apiAlias = true;                        // `type X = components["schemas"]["X"]` — a REFERENCE to the generated contract, not a shape
    if (local && d) {
      // the body = the whole declaration (a `const X = memo(() => <jsx/>)` keeps its JSX)
      const body = ts.isVariableDeclaration(d) ? d : d;
      Object.assign(ex, refsOf(body));
      const mem = membersOf(d); if (mem && mem.length) ex.members = mem;   // D5
      const sh = shapeOf(d); if (sh) ex.shape = sh;                       // D5
      ex.span = [sf.getLineAndCharacterOfPosition(d.getStart(sf)).line + 1, sf.getLineAndCharacterOfPosition(d.getEnd()).line + 1];
    }
    rec.exports.push(ex);
  }
  rec.exports.sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  // module-scope refs (calls outside any export — a side-effect module's wiring)
  const top = refsOf(sf);
  rec.file_refs = { calls: top.calls, jsx: top.jsx, hasJsx: top.hasJsx };
  if (top.storage) rec.file_refs.storage = top.storage;
  if (top.queryKeys) rec.file_refs.queryKeys = top.queryKeys;
  if (FLOW) rec.flow = flowOf(sf);
  files[rel(f)] = rec;
}
const keys = Object.keys(files).sort();
const out = { version: 1, web: rel(WEB) || '.', ts: ts.version, tsFrom: TS_DIR ? 'override' : 'project', files: keys.length, byFile: Object.fromEntries(keys.map(k => [k, files[k]])) };   // tsFrom: where `typescript` came from — the project's own tree, or a GABE_TS_DIR override (review 2026-09-06)
const text = JSON.stringify(out);
if (OUT) fs.writeFileSync(OUT, text); else process.stdout.write(text);
const all = keys.map(k => files[k]);
const imp = all.flatMap(r => r.imports);
process.stderr.write(`fe-extract: ${keys.length} files · ${imp.filter(i => i.to).length} internal import sites · ${imp.filter(i => i.external).length} external · ${all.flatMap(r => r.exports).length} exports · ts ${ts.version}\n`);
