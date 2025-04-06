from sqlalchemy.orm import Session
from models import Word
from models import Word_Of_The_Day
from datetime import date
from sqlalchemy import select
from models import Game_Record

import logging

logger = logging.getLogger(__name__)


def check_word(db: Session):
    """Check if a word already exists in the database."""
    today = date.today()
    result = db.execute(
        select(Word_Of_The_Day).where(Word_Of_The_Day.date == today)
    ).first()
    return result


def create_word(db: Session, word: Word):
    """Create a new word in the database."""
    w = Word_Of_The_Day(word=word.word)
    if check_word(db):
        return None
    db.add(w)
    db.commit()
    db.refresh(w)
    logger.info(f"New word created: {word.word}")
    return w


def get_today_word(db: Session):
    today = date.today()
    result = db.execute(
        select(Word_Of_The_Day).where(Word_Of_The_Day.date == today)
    ).first()
    logger.debug(f"Today's word: {result[0].word}")
    return {"word": result[0].word}


def get_game_by_token(db: Session, token: str):
    """Get a game by token."""
    game = db.execute(
        select(Game_Record).where(
            Game_Record.token == token and Game_Record.date == date.today()
        )
    ).first()
    if not game:
        game = Game_Record(token=token)
        db.add(game)
        db.commit()
        db.refresh(game)

        logger.debug(
            f"Game_Record created(guess_count: {game[0].guess_count}, token: {game[0].token}, date: {game[0].date})"
        )

    logger.debug(
        f"Game_Record exists(guess_count: {game[0].guess_count}, token: {game[0].token}, date: {game[0].date})"
    )
    return game
