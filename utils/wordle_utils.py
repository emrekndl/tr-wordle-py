import logging
from functools import lru_cache
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.database import engine, Base
from db.models import Gusess_Response, Game_Record
from utils.check_word import check
from utils.random_word import get_wordle


logger = logging.getLogger(__name__)


def init_db(db: Session):
    Base.metadata.create_all(bind=engine)
    db.execute(text("PRAGMA auto_vacuum = FULL"))
    db.execute(text("VACUUM"))
    db.commit()


@lru_cache(maxsize=1)
def set_word_to_cache():
    return get_wordle()


def check_guessed_word(guessed_word: str, db: Session, game: Game_Record):
    logger.debug(f"check_guessed_word: {guessed_word} Word: {set_word_to_cache()}")
    res = Gusess_Response(**check(guessed_word, set_word_to_cache()))
    # res = Gusess_Response(**check(guessed_word, get_today_word(db)))
    if res.is_complete:
        game[0].guess_count = 6
        db.commit()
    logger.debug(f"Guesss_Response: {res}")
    return res
