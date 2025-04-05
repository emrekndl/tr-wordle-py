import logging

from datetime import date
from models import Game_Record
from sqlalchemy.orm import Session
from sqlalchemy import delete


logger = logging.getLogger(__name__)


def delete_old_game_records(db: Session):
    try:
        db.execute(delete(Game_Record).where(Game_Record.date < date.today()))
        # r = db.execute(
        #     select(Word_Of_The_Day).where(Word_Of_The_Day.date < date.today())
        # )
        # for i in r.scalars():
        #     logger.debug(f"--{i.word}--")
        db.commit()
        logger.info(f"Old game records deleted successfully. (Date: {date.today()})")
    except Exception as e:
        logger.error(f"Error deleting old game records: {e}")
        db.rollback()
    finally:
        db.close()
