import logging

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from datetime import date
from sqlalchemy import select

from db.models import Game_Record


logger = logging.getLogger(__name__)


def get_gamerecord_or_create_gamerecord_with_token(db: Session, token: str):
    """Get a game record or create game record wirh token."""
    try:
        game_record = db.execute(
            select(Game_Record).where(
                Game_Record.token == token and Game_Record.date == date.today()
            )
        ).scalars().first()

        if not game_record:
            game_record = Game_Record(token=token)
            db.add(game_record)
            db.commit()
            db.refresh(game_record)

            logger.debug(
                f"Game_Record created(guess_count: {game_record.guess_count}, "
                f"token: {game_record.token}, date: {game_record.date})"
            )

        return game_record

    except SQLAlchemyError:
        db.rollback()
        logger.error(
            "Database error in get_or_create_gamerecord", exc_info=True)
        raise
