import logging

from sqlalchemy.orm import Session
from datetime import date
from sqlalchemy import select

from db.models import Game_Record


logger = logging.getLogger(__name__)


def get_game_by_token(db: Session, token: str):
    """Get a game by token."""
    game = db.execute(
        select(Game_Record).where(
            Game_Record.token == token and Game_Record.date == date.today()
        )
    ).first()
    if not game:
        game_record = Game_Record(token=token)
        db.add(game_record)
        db.commit()
        db.refresh(game_record)

        logger.debug(
            f"Game_Record created(guess_count: {game_record.guess_count}, token: {game_record.token}, date: {game_record.date})"
        )
        return game_record

    return game
