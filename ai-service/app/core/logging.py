import logging
import sys


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """Configures structured application logging."""
    logger_instance = logging.getLogger("examind_ai")
    logger_instance.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    if not logger_instance.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger_instance.addHandler(handler)

    return logger_instance


logger = setup_logging()

