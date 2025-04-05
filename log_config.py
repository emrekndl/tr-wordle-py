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
            "level": "DEBUG",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "my_logger": {
            "handlers": ["console"],
            "level": "DEBUG",
            "propagate": False,
        }
    },
    "root": {
        "level": "DEBUG",
        "handlers": ["console"],
        "propagate": False,
    },
}
