import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.orm import Session

from word_crud import create_word, get_today_word, get_game_by_token
from models import Word, Guess, Gusess_Response
from database import get_db
from wordle_utils import check_guessed_word, word_of_the_day

logger = logging.getLogger(__name__)

wordle_router = APIRouter(prefix="/api/wordle")


@wordle_router.get("/wordoftheday")
async def get_word(
    response: Response, db: Session = Depends(get_db), token: str = Cookie(None)
):
    if token is None:
        token = str(uuid.uuid4())
        response.set_cookie(key="token", value=token, httponly=True, samesite="lax")
        _ = get_game_by_token(db, token)
        word = word_of_the_day()
        # TODO: Retrun response: "the word of the day is created."
        return create_word(db, Word(word=word))
    # TODO: Retrun response: "the word of the day is already created."
    return get_today_word(db)


@wordle_router.post("/check", response_model=Gusess_Response | Word)
async def check_guess(
    guess: Guess,
    response: Response,
    db: Session = Depends(get_db),
    token: str = Cookie(None),
) -> Gusess_Response | Word:
    if token is None:
        raise HTTPException(status_code=401, detail="No token provided.")
    game = get_game_by_token(db, token)
    if game[0].guess_count >= 6:
        return get_today_word(db)
    game[0].guess_count += 1
    db.commit()
    return check_guessed_word(guess.guess_word, db, game)
