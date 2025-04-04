from sqlalchemy import Column, Date, Integer, String
from pydantic.types import StringConstraints
from typing_extensions import Annotated
from database import Base
from datetime import date

from pydantic import BaseModel


class Word_Of_The_Day(Base):
    __tablename__ = "word_of_the_day"

    id = Column(Integer, primary_key=True, index=True)
    word = Column(String, index=True)
    date = Column(Date, default=date.today)


class Word(BaseModel):
    word: str


class Guess(BaseModel):
    guess_word: Annotated[str, StringConstraints(min_length=5, max_length=5)]


class Gusess_Response(BaseModel):
    correct_letters: list[str]
    incorrect_letters: list[str]
    correct_letters_in_not_correct_position: list[str]
    is_complete: bool = False
