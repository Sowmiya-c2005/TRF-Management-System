"""
Logging configuration.

LOG_LEVEL env var controls root level (default: INFO).
Noisy third-party loggers are set to WARNING to reduce console noise.
"""
import logging
import os
import sys


_FORMATTER = logging.Formatter(
    "[%(asctime)s] %(levelname)-8s [%(name)s] %(message)s",
    datefmt="%H:%M:%S"
)

# Third-party loggers that produce excessive output at INFO level
_QUIET_LOGGERS = [
    "uvicorn.access",      # per-request access logs  ← main source of noise
    "uvicorn.error",
    "sqlalchemy.engine",
    "sqlalchemy.pool",
    "httpx",
    "httpcore",
    "multipart",
]


def setup_logging() -> None:
    log_level = os.getenv("LOG_LEVEL", "INFO").upper()
    numeric_level = getattr(logging, log_level, logging.INFO)

    root = logging.getLogger()
    root.setLevel(numeric_level)

    # Remove any existing handlers
    root.handlers.clear()

    # Console handler
    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(_FORMATTER)
    console.setLevel(numeric_level)
    root.addHandler(console)

    # Optional file handler
    log_dir = "logs"
    os.makedirs(log_dir, exist_ok=True)
    fh = logging.FileHandler(os.path.join(log_dir, "app.log"), encoding="utf-8")
    fh.setFormatter(_FORMATTER)
    fh.setLevel(logging.DEBUG)   # capture everything to file
    root.addHandler(fh)

    # Silence noisy third-party loggers in console
    for name in _QUIET_LOGGERS:
        logging.getLogger(name).setLevel(logging.WARNING)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
