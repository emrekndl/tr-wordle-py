from sqlalchemy import Column, Date, Integer, String
from pydantic.types import StringConstraints
from typing_extensions import Annotated
from datetime import date
from pydantic import BaseModel, Field

from db.database import Base


# class Word_Of_The_Day(Base):
#     __tablename__ = "word_of_the_day"
#
#     id = Column(Integer, primary_key=True, index=True)
#     word = Column(String, index=True)
#     date = Column(Date, default=date.today)


class Game_Record(Base):
    __tablename__ = "game_record"

    token = Column(String, primary_key=True, index=True)
    date = Column(Date, default=date.today)
    guess_count = Column(Integer, default=0)


class Word(BaseModel):
    word: str


class Guess(BaseModel):
    guess_word: Annotated[str, StringConstraints(min_length=5, max_length=5)]


class Gusess_Response(BaseModel):
    """Guess Response
    correct_letters: dict
    incorrect_letters: list
    correct_letters_in_not_correct_position: list
    is_complete: bool
    word_definition: dict
    """

    correct_letters: dict[int, str]
    incorrect_letters: list[str]
    correct_letters_in_not_correct_position: list[str]
    is_complete: bool = False
    word_definition: dict[str, list[str]] = Field(default_factory=dict)
