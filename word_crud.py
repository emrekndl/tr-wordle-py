from sqlalchemy.orm import Session
from models import Word
from models import Word_Of_The_Day
from datetime import date
from sqlalchemy import select, text


def check_word(db: Session):
    today = date.today()
    result = db.execute(
        select(Word_Of_The_Day).where(Word_Of_The_Day.date == today)
    ).first()
    return result


def create_word(db: Session, word: Word):
    w = Word_Of_The_Day(word=word.word)
    if check_word(db):
        return None
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


# get word of the day


def get_today_word(db: Session):
    today = date.today()
    result = db.execute(
        select(Word_Of_The_Day).where(Word_Of_The_Day.date == today)
    ).first()
    return result[0].word
