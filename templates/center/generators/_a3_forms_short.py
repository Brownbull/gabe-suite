"""Element forms — the SHORT FORMS registry (amendment 1 §A2 Slice 4, later Slice 10): data only, each table citing the source
it was read from, so a reader can check a case against the framework instead of trusting this file.

Slice 4 reads pydantic request schemas into 422 CASES: which rule a field carries (``min_length``, an allow-list in a
validator, ``extra="forbid"``) and the error type pydantic reports when a request breaks it. The error-type names are the
``ErrorType`` literal of pydantic-core as pinned by gustify (pydantic 2.13.4 · ``pydantic_core/core_schema.py`` ErrorType);
the body-location and body-parse rows are FastAPI 0.136.3's (``fastapi/dependencies/utils.py`` ``_should_embed_body_fields`` ·
``fastapi/routing.py``). A rule this table does not know is never guessed — the case reads ``type: unknown`` with the keyword.
"""
from __future__ import annotations

PYDANTIC_SRC = "pydantic_core/core_schema.py ErrorType (pydantic 2.13.4)"

# a Field(...) / constr(...) / conint(...) keyword → the error type per annotation family
PYDANTIC_ERRORS: dict[str, dict[str, str]] = {
    "min_length": {"str": "string_too_short", "bytes": "bytes_too_short", "list": "too_short", "set": "too_short",
                   "tuple": "too_short", "dict": "too_short", "*": "too_short"},
    "max_length": {"str": "string_too_long", "bytes": "bytes_too_long", "list": "too_long", "set": "too_long",
                   "tuple": "too_long", "dict": "too_long", "*": "too_long"},
    "pattern": {"str": "string_pattern_mismatch", "*": "string_pattern_mismatch"},
    "gt": {"*": "greater_than"},
    "ge": {"*": "greater_than_equal"},
    "lt": {"*": "less_than"},
    "le": {"*": "less_than_equal"},
    "multiple_of": {"*": "multiple_of"},
    "max_digits": {"*": "decimal_max_digits"},
    "decimal_places": {"*": "decimal_max_places"},
    "allow_inf_nan": {"*": "finite_number"},
}

# what the model itself decides, not one field keyword
MODEL_ERRORS: dict[str, str] = {
    "extra_forbid": "extra_forbidden",        # model_config extra="forbid"
    "required": "missing",                    # a field with no default and no default_factory
    "literal": "literal_error",               # Literal["a", "b"]
    "enum": "enum",                           # a repo Enum annotation
}

# a validator body's raise → the error type pydantic reports (`PydanticCustomError(type, …)` carries its own type)
RAISE_ERRORS: dict[str, str | None] = {
    "ValueError": "value_error",
    "AssertionError": "assertion_error",
    "PydanticCustomError": None,
}

# the per-annotation TYPE error (a string where an int belongs) — one per field, collapsed to `types: "collapsed"` by default
TYPE_ERRORS: dict[str, str] = {
    "str": "string_type", "int": "int_parsing", "float": "float_parsing", "bool": "bool_parsing", "bytes": "bytes_type",
    "list": "list_type", "set": "set_type", "frozenset": "frozen_set_type", "tuple": "tuple_type", "dict": "dict_type",
    "UUID": "uuid_parsing", "date": "date_parsing", "datetime": "datetime_parsing", "time": "time_parsing",
    "timedelta": "time_delta_parsing", "Decimal": "decimal_parsing", "model": "model_type",
}

# the pydantic helpers that carry constraint keywords like Field does
CONSTRAINED_TYPES: dict[str, str] = {
    "constr": "str", "conbytes": "bytes", "conint": "int", "confloat": "float", "condecimal": "Decimal",
    "conlist": "list", "conset": "set", "confrozenset": "frozenset", "condate": "date",
}

# string normalisation a validator may apply before its rule — rides the case as `normalises`, never a case of its own
NORMALISERS: frozenset[str] = frozenset({"strip", "lstrip", "rstrip", "lower", "upper", "casefold", "title"})

# where a request parameter is read from (a bare BaseModel parameter is the body)
PARAM_LOCATIONS: dict[str, str] = {
    "Query": "query", "Path": "path", "Header": "header", "Cookie": "cookie", "Body": "body", "Form": "body", "File": "body",
}
BODY_EMBED_SRC = "fastapi/dependencies/utils.py _should_embed_body_fields (fastapi 0.136.3)"   # >1 body param · embed=True · a non-model Form

# what FastAPI answers before any dependency runs when an endpoint reads a body (fastapi 0.136.3)
FRAMEWORK_BODY_EXITS: tuple[dict, ...] = (
    {"phase": "body-parse", "status": 422, "state": "default", "form": "object", "code": "json_invalid",
     "detail": "JSON decode error", "source": "fastapi/routing.py:427"},
    {"phase": "body-parse", "status": 400, "state": "default", "form": "text",
     "detail": "There was an error parsing the body", "source": "fastapi/routing.py:447"},
)

# how deep nested models are read, and how many cases one schema may list before the rest is counted
OPTIONS: dict[str, object] = {"nest_depth": 6, "s_type_cases": "collapsed", "case_cap": 200}
