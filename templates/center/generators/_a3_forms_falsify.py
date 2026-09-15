"""Element forms — the shared FALSIFICATION leaf (amendment 1 §A4, root cause RC-A).

A generated row is only real when the branch it sits in can run. Four arms asked that question and none could answer
it: the endpoint pass lifts every raise a callee can make — ``escape-500`` and ``reason-lost`` — without reading the
arguments the handler actually passed; the walker enumerates arm × exit with no consistency test; the effects reach
books writes on a refusal the call site made unreachable. This leaf answers it once, in two moves. ``bind`` pairs the
callee's parameters with what the call site passes (``caller``) or what the callee defaults to (``callee``).
``truth`` then folds the guard STRING the walk already recorded (``_a3_paths_read._where``'s ``pred``, whose else arm
arrives negated) against those bindings.

The leaf is deliberately timid: a predicate it cannot decide is ``None``, never ``False``, so a row is dropped only
when the call site PROVES its branch dead. Two floors follow from that. A parameter bound to ``(None, "callee")`` is
a keyword-only argument with NO default that this call site did not pass — an impossible call, not the value
``None`` — so only the ``is``/``is not None`` comparison reads it (the rule the schema part has always used, kept
verbatim so its rules do not move); every other fold requires a real expression. And a name the leaf cannot resolve
to a literal abstains, which is why ``dead`` asks for proof rather than the absence of doubt.
"""
from __future__ import annotations

import ast

_UNSET = object()


def bind(fn, call: ast.Call | None) -> dict:
    """The callee's parameters → ``(expression, origin)``: its own defaults (``callee``, an expression read in the
    callee's module) and what the call site passes (``caller``, read in the CALLER's module). The origin is the key
    to resolving a name: the same identifier means different things on the two sides of a call."""
    args = fn.args
    params = [a.arg for a in args.posonlyargs + args.args]
    out = {p: (d, "callee") for p, d in zip(params[len(params) - len(args.defaults):], args.defaults)}
    out.update({a.arg: (d, "callee") for a, d in zip(args.kwonlyargs, args.kw_defaults) if d is not None})
    for a in args.kwonlyargs:
        out.setdefault(a.arg, (None, "callee"))
    if call is not None:
        pos = params[1:] if isinstance(call.func, ast.Attribute) and params and params[0] in ("cls", "self") else params
        out.update({p: (v, "caller") for p, v in zip(pos, call.args)})
        out.update({k.arg: (k.value, "caller") for k in call.keywords if k.arg})
    return out


def _literal(expr, origin, value):
    """The python value of a bound expression, or ``_UNSET``. A literal is read here; anything else goes to the
    caller's own resolver, which knows the two modules the two origins name."""
    if expr is None:
        return _UNSET
    if isinstance(expr, ast.Constant):
        return expr.value
    if isinstance(expr, (ast.Tuple, ast.List, ast.Set)) and all(isinstance(e, ast.Constant) for e in expr.elts):
        return [e.value for e in expr.elts]
    if value is None:
        return _UNSET
    got = value(expr, origin)
    return _UNSET if got is None else got


def truth(pred: str, bound: dict, value=None):
    """``True`` / ``False`` / ``None`` of a guard once the bindings are known. ``value(expr, origin)`` is the optional
    resolver for a non-literal expression (a module constant, say); without it only literals fold."""
    try:
        node = ast.parse(pred, mode="eval").body
    except SyntaxError:
        return None

    def val(name):
        if name not in bound:
            return _UNSET
        expr, origin = bound[name]
        return _literal(expr, origin, value)

    def ev(n):
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.Not):
            v = ev(n.operand)
            return None if v is None else not v
        if isinstance(n, ast.BoolOp):
            vals = [ev(x) for x in n.values]
            hit, miss = (True, False) if isinstance(n.op, ast.Or) else (False, True)
            return hit if hit in vals else (miss if all(v is miss for v in vals) else None)
        if isinstance(n, ast.Constant):
            return bool(n.value)
        if isinstance(n, ast.Name):                          # `if flag:` with flag bound to a literal
            got = val(n.id)
            return None if got is _UNSET else bool(got)
        if isinstance(n, ast.Compare) and len(n.ops) == 1 and isinstance(n.left, ast.Name):
            op, right = n.ops[0], n.comparators[0]
            if isinstance(op, (ast.Is, ast.IsNot)) and isinstance(right, ast.Constant) and right.value is None \
                    and n.left.id in bound:                  # the schema part's rule, kept verbatim: an unpassed
                expr = bound[n.left.id][0]                   # keyword-only argument reads as None here and only here
                is_none = expr is None or (isinstance(expr, ast.Constant) and expr.value is None)
                return is_none if isinstance(op, ast.Is) else not is_none
            left = val(n.left.id)
            if left is _UNSET:
                return None
            other = _literal(right, "caller", None)
            if other is _UNSET:
                return None
            try:
                if isinstance(op, ast.Eq):
                    return left == other
                if isinstance(op, ast.NotEq):
                    return left != other
                if isinstance(op, ast.In):
                    return left in other
                if isinstance(op, ast.NotIn):
                    return left not in other
                if isinstance(op, ast.Lt):
                    return left < other
                if isinstance(op, ast.LtE):
                    return left <= other
                if isinstance(op, ast.Gt):
                    return left > other
                if isinstance(op, ast.GtE):
                    return left >= other
            except TypeError:                                # comparing what python itself will not compare
                return None
        return None
    return ev(node)


def dead(where: dict, bound: dict, value=None) -> bool:
    """``True`` when the call site PROVES this row's branch cannot run — one of its guards, or one of the conditions it
    sits after, folds to False. Silence (``None``) is never proof."""
    preds = [where["pred"]] if where.get("pred") else []
    preds += list(where.get("after") or [])
    return any(truth(p, bound, value) is False for p in preds)
