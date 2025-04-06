import logging
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import engine, Base
from models import Gusess_Response, Game_Record
from check_word import check
from random_word import get_wordlist
from word_crud import get_today_word


logger = logging.getLogger(__name__)


def init_db(db: Session):
    Base.metadata.create_all(bind=engine)
    db.execute(text("PRAGMA auto_vacuum = FULL"))
    db.execute(text("VACUUM"))
    db.commit()


def word_of_the_day():
    return get_wordlist()


def check_guessed_word(guessed_word: str, db: Session, game: Game_Record):
    res = Gusess_Response(**check(guessed_word, get_today_word(db)))
    if res.is_complete:
        game[0].guess_count = 6
        db.commit()
    logger.debug(f"Guesss_Response: {res}")
    return res
