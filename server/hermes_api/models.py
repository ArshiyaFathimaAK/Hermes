"""Base for every request and response model.

Python uses snake_case, the app uses camelCase: `review_count` is sent as `reviewCount`.
Field names must match the app's types in hermes/src/domain/, so the app can use them as-is.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        serialize_by_alias=True,
    )
