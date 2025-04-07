import logging

from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import delete

from db.models import Game_Record
from utils.wordle_utils import set_word_to_cache

logger = logging.getLogger(__name__)


def delete_old_data(db: Session):
    try:
        # Delete old game records
        db.execute(delete(Game_Record).where(Game_Record.date < date.today()))
        db.commit()
        # Clear the cache
        set_word_to_cache.cache_clear()
        logger.info(f"Old game data deleted successfully. (Date: {date.today()})")
    except Exception as e:
        logger.error(f"Error deleting old game data: {e}")
        db.rollback()
    finally:
        db.close()
