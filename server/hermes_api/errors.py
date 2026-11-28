"""Errors that reach the app. Raise these from providers; the app shows `message` to people.

Every error response is {"error": "<message>"}, which src/services/api-client.ts expects.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class ApiError(Exception):
    status_code = 400

    def __init__(self, message: str):
        super().__init__(message)
        self.message = message


class NotFound(ApiError):
    status_code = 404


class UpstreamUnavailable(ApiError):
    """An outside service (Google, Open-Meteo, ...) failed or timed out."""

    status_code = 503


def add_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def api_error(_request: Request, error: ApiError) -> JSONResponse:
        return JSONResponse({"error": error.message}, status_code=error.status_code)

    @app.exception_handler(RequestValidationError)
    async def bad_request(_request: Request, error: RequestValidationError) -> JSONResponse:
        first = error.errors()[0] if error.errors() else {}
        where = ".".join(str(part) for part in first.get("loc", ())[1:])
        message = first.get("msg", "Invalid request.")
        return JSONResponse({"error": f"{where}: {message}" if where else message}, status_code=422)
