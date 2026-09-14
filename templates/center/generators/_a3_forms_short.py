"""Element forms — the SHORT FORMS registry (amendment 1 §A2 Slice 4, later Slice 10): data only, each table citing the source
it was read from, so a reader can check a case against the framework instead of trusting this file.

Slice 4 reads pydantic request schemas into 422 CASES: which rule a field carries (``min_length``, an allow-list in a
validator, ``extra="forbid"``) and the error type pydantic reports when a request breaks it. The error-type names are the
``ErrorType`` literal of pydantic-core as pinned by gustify (pydantic 2.13.4 · ``pydantic_core/core_schema.py`` ErrorType);
the parameter-location, body-location and body-parse rows are FastAPI 0.136.3's (``fastapi/dependencies/utils.py``
``analyze_param`` · ``_should_embed_body_fields`` · ``fastapi/routing.py``) over starlette 1.3.1. A constraint keyword this
table does not know is never guessed — the case reads ``type: unknown`` with the keyword.
"""
from __future__ import annotations

PYDANTIC_SRC = "pydantic_core/core_schema.py ErrorType (pydantic 2.13.4)"

# a Field(...) / Query(...) / constr(...) keyword → the error type per annotation family
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
    "allow_inf_nan": {"*": "finite_number"},   # a rule only when it is False
}
# with max_digits AND decimal_places both set, too many digits before the point is its own type
DECIMAL_WHOLE_DIGITS = "decimal_whole_digits"
# pydantic v1 keywords pydantic 2 still honours (deprecated) → the v2 keyword they stand for
V1_KEYWORDS: dict[str, str] = {"min_items": "min_length", "max_items": "max_length", "regex": "pattern"}
# Field / Query / Body / Form keywords that carry no rule a request can break
NON_RULE_KEYWORDS: frozenset[str] = frozenset({
    "default", "default_factory", "alias", "validation_alias", "serialization_alias", "alias_priority", "title",
    "description", "examples", "example", "openapi_examples", "json_schema_extra", "deprecated", "exclude", "include",
    "discriminator", "frozen", "validate_default", "repr", "init", "init_var", "kw_only", "field_title_generator",
    "union_mode", "fail_fast", "strict", "coerce_numbers_to_str", "embed", "media_type", "convert_underscores",
    "include_in_schema", "annotation", "exclude_if"})

# what the model itself decides, not one field keyword
MODEL_ERRORS: dict[str, str] = {
    "extra_forbid": "extra_forbidden",        # model_config extra="forbid" · class X(BaseModel, extra="forbid")
    "required": "missing",                    # a field with no default and no default_factory
    "literal": "literal_error",               # Literal["a", "b"]
    "enum": "enum",                           # a repo Enum annotation
}
# the classes a request body model derives from (a SQLModel is a pydantic model; RootModel validates its `root`)
MODEL_BASES: frozenset[str] = frozenset({"BaseModel", "SQLModel", "RootModel"})
# `model_config = ConfigDict(alias_generator=…)` from pydantic.alias_generators → how a field name becomes its alias
ALIAS_GENERATORS: dict[str, str] = {"to_camel": "camel", "to_pascal": "pascal", "to_snake": "snake"}

# a validator body's raise (or a subclass of one) → the error type pydantic reports (`PydanticCustomError(type, …)`
# carries its own type); a bare `assert` is assertion_error
RAISE_ERRORS: dict[str, str | None] = {
    "ValueError": "value_error",
    "AssertionError": "assertion_error",
    "PydanticCustomError": None,
}

# the per-annotation TYPE error (a string where an int belongs) — collapsed to `types: "collapsed"` unless s_type_cases is "each"
TYPE_ERRORS: dict[str, str] = {
    "str": "string_type", "int": "int_parsing", "float": "float_parsing", "bool": "bool_parsing", "bytes": "bytes_type",
    "list": "list_type", "set": "set_type", "frozenset": "frozen_set_type", "tuple": "tuple_type", "dict": "dict_type",
    "UUID": "uuid_parsing", "date": "date_parsing", "datetime": "datetime_parsing", "time": "time_parsing",
    "timedelta": "time_delta_parsing", "Decimal": "decimal_parsing", "model": "model_type",
}

# the pydantic helpers that carry constraint keywords like Field does (Annotated metadata included)
CONSTRAINED_TYPES: dict[str, str] = {
    "constr": "str", "conbytes": "bytes", "conint": "int", "confloat": "float", "condecimal": "Decimal",
    "conlist": "list", "conset": "set", "confrozenset": "frozenset", "condate": "date",
}
CONSTRAINT_METADATA: frozenset[str] = frozenset({"Field", "StringConstraints"})

# string normalisation a validator may apply before its rule — rides the case as `normalises`, never a case of its own
NORMALISERS: frozenset[str] = frozenset({"strip", "lstrip", "rstrip", "lower", "upper", "casefold", "title"})

# where a request parameter is read from when it says so (fastapi params.*); `form` is the body of a form request
PARAM_LOCATIONS: dict[str, str] = {
    "Query": "query", "Path": "path", "Header": "header", "Cookie": "cookie", "Body": "body", "Form": "form", "File": "form",
}
# an unmarked parameter: a path name → Path · UploadFile (or a sequence of them) → File · a non-scalar annotation → Body ·
# anything else → Query (fastapi/dependencies/utils.py analyze_param · fastapi/_compat/shared.py field_annotation_is_scalar)
UPLOAD_TYPES: frozenset[str] = frozenset({"UploadFile"})
BODY_EMBED_SRC = "fastapi/dependencies/utils.py _should_embed_body_fields (fastapi 0.136.3)"   # >1 body name · embed=True · one non-model Form field

# what FastAPI answers before any dependency runs when an endpoint reads a body — gated on the framework version it was read on
FRAMEWORK_MIN = "0.136.3"
FRAMEWORK_BODY_EXITS: tuple[dict, ...] = (                # a JSON body (routing.py: request.json())
    {"phase": "body-parse", "status": 422, "state": "default", "form": "object", "code": "json_invalid",
     "detail": "JSON decode error", "source": "fastapi/routing.py:427"},
    {"phase": "body-parse", "status": 400, "state": "default", "form": "text",
     "detail": "There was an error parsing the body", "source": "fastapi/routing.py:447"},
)
FRAMEWORK_FORM_EXITS: tuple[dict, ...] = (                # a form or multipart body (routing.py: request.form()) never decodes JSON
    {"phase": "body-parse", "status": 400, "state": "default", "form": "text", "detail": None, "detail_state": "variable",
     "source": "starlette/requests.py _get_form (starlette 1.3.1): MultiPartException → HTTPException(400, exc.message)"},
    {"phase": "body-parse", "status": 400, "state": "default", "form": "text",
     "detail": "There was an error parsing the body", "source": "fastapi/routing.py:447"},
)

# how deep nested models are read, how many cases one validation row lists before the rest is counted, the type cases
OPTIONS: dict[str, object] = {"nest_depth": 6, "s_type_cases": "collapsed", "case_cap": 200}
# what the spec names for this part that is not built here, said in the arm's stats
DEFERRED: tuple[str, ...] = ("S11 · a test's construction of the schema (pytest.raises(ValidationError)) — the tests arm, Slice 9",)
