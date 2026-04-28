"""
Centralized Logging Configuration
===================================
Provides a single ``get_logger(name)`` factory that every module in the
project should use.  All loggers share the same configuration:

* **Console handler** — coloured, concise format for development.
* **File handler**    — detailed format with timestamps, written to
  ``logs/app.log`` (auto-rotated at 5 MB, keeps 5 backups).

Usage::

    from services.logger import get_logger
    logger = get_logger(__name__)

    logger.info("Something happened")
    logger.error("Something broke", exc_info=True)
"""

import os
import logging
from logging.handlers import RotatingFileHandler

# ---------------------------------------------------------------------------
# Log directory & file (project-root/logs/app.log)
# ---------------------------------------------------------------------------
_LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
_LOG_FILE = os.path.join(_LOG_DIR, "app.log")

os.makedirs(_LOG_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Formatters
# ---------------------------------------------------------------------------
_CONSOLE_FMT = logging.Formatter(
    fmt="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%H:%M:%S",
)

_FILE_FMT = logging.Formatter(
    fmt="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(funcName)s:%(lineno)d │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

# ---------------------------------------------------------------------------
# Shared handlers (created once, reused by every logger)
# ---------------------------------------------------------------------------
_console_handler = logging.StreamHandler()
_console_handler.setLevel(logging.DEBUG)
_console_handler.setFormatter(_CONSOLE_FMT)

_file_handler = RotatingFileHandler(
    _LOG_FILE,
    maxBytes=5 * 1024 * 1024,   # 5 MB per file
    backupCount=5,
    encoding="utf-8",
)
_file_handler.setLevel(logging.DEBUG)
_file_handler.setFormatter(_FILE_FMT)

# ---------------------------------------------------------------------------
# Public factory
# ---------------------------------------------------------------------------

def get_logger(name: str) -> logging.Logger:
    """
    Return a logger configured with console + rotating-file handlers.

    Args:
        name: Usually ``__name__`` of the calling module.

    Returns:
        A ``logging.Logger`` instance ready to use.
    """
    logger = logging.getLogger(name)

    # Avoid adding duplicate handlers if called more than once
    if not logger.handlers:
        logger.setLevel(logging.DEBUG)
        logger.addHandler(_console_handler)
        logger.addHandler(_file_handler)
        logger.propagate = False

    return logger
