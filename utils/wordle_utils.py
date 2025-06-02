import logging
from typing import Dict
from functools import lru_cache
from sqlalchemy import text
from sqlalchemy.orm import Session

from db.database import engine, Base
from db.models import Gusess_Response, Game_Record
from utils.check_word import check
from utils.random_word import get_wordle
from utils.word_definition import get_word_definition


logger = logging.getLogger(__name__)


def init_db(db: Session):
    Base.metadata.create_all(bind=engine)
    db.execute(text("PRAGMA auto_vacuum = FULL"))
    db.execute(text("VACUUM"))
    db.commit()


@lru_cache(maxsize=1)
def set_word_to_cache():
    return get_wordle()


@lru_cache(maxsize=1)
def set_word_definition_to_cache(word: str) -> Dict:
    """Word_Of_The_Day with definitions
    {
    "word_of_the_day": ["word_definition_1",...]
    }
    """
    return get_word_definition(word)


def check_guessed_word(guessed_word: str, db: Session, game: Game_Record):
    word = set_word_to_cache()
    logger.debug(f"check_guessed_word: {guessed_word} Word: {word}")
    res = Gusess_Response(**check(guessed_word, word))
    if res.is_complete:
        game[0].guess_count = 6
        db.commit()

        res.word_definition = set_word_definition_to_cache(word)
        logger.debug(f"word_definition: {res.word_definition}")
    if not res.is_complete and game[0].guess_count == 6:
        res.word_definition = set_word_definition_to_cache(word)
    logger.debug(f"Guesss_Response: {res}")
    return res
