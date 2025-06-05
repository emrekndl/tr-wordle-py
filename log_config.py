import os
from dotenv import load_dotenv


load_dotenv()

log_level = os.getenv("LOG_LEVEL", "INFO").upper()

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "[%(levelname)s] - %(asctime)s - %(name)s - %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": log_level,
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "my_logger": {
            "handlers": ["console"],
            "level": log_level,
            "propagate": False,
        }
    },
    "root": {
        "level": log_level,
        "handlers": ["console"],
        "propagate": False,
    },
}
