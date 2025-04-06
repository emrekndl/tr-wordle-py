import logging
from functools import lru_cache
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import engine, Base
from models import Gusess_Response, Game_Record
from check_word import check
from random_word import get_wordlist


logger = logging.getLogger(__name__)


def init_db(db: Session):
    Base.metadata.create_all(bind=engine)
    db.execute(text("PRAGMA auto_vacuum = FULL"))
    db.execute(text("VACUUM"))
    db.commit()


@lru_cache(maxsize=1)
def set_word_to_cache():
    return get_word_of_the_day()


def get_word_of_the_day():
    return get_wordlist()


def check_guessed_word(guessed_word: str, db: Session, game: Game_Record):
    logger.debug(f"check_guessed_word: {guessed_word} Word: {set_word_to_cache()}")
    res = Gusess_Response(**check(guessed_word, set_word_to_cache()))
    # res = Gusess_Response(**check(guessed_word, get_today_word(db)))
    if res.is_complete:
        game[0].guess_count = 6
        db.commit()
    logger.debug(f"Guesss_Response: {res}")
    return res
