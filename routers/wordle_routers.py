import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from crud.word_crud import get_gamerecord_or_create_gamerecord_with_token
from db.models import Word, Guess, Gusess_Response
from db.database import get_db
from utils.wordle_utils import (
    check_guessed_word,
    set_word_to_cache
)

logger = logging.getLogger(__name__)

wordle_router = APIRouter(prefix="/api/wordle")

GUESS_COUNT = 6


@wordle_router.get("/wordoftheday")
async def get_word(
    response: Response, db: Session = Depends(get_db), token: str = Cookie(None)
) -> dict:
    logger.debug(f"/wordoftheday token: {token}")
    if token is None:
        token = str(uuid.uuid4())
        response.set_cookie(
            key="token", value=token, httponly=True, samesite="none", secure=True
        )
        try:
            get_gamerecord_or_create_gamerecord_with_token(db, token)
            set_word_to_cache()
            logger.debug(f"Word of the day created. Word:"
                         f"{set_word_to_cache()}")
            return {"message": "The word of the day is created."}
        except SQLAlchemyError:
            db.rollback()
            logger.error("Database error in /wordoftheday ", exc_info=True)
            raise HTTPException(status_code=500, detail="Database error.")
        except Exception:
            logger.error("Unexpected error in /wordoftheday ", exc_info=True)
            raise HTTPException(
                status_code=500, detail="Internal server error.")

    return {"message": "The word of the day is already created."}


@wordle_router.post("/check", response_model=Gusess_Response | Word | dict)
async def check_guess(
    guess: Guess,
    response: Response,
    db: Session = Depends(get_db),
    token: str = Cookie(None),
) -> Gusess_Response | Word | dict:
    logger.debug(f"/check token: {token}")
    if token is None:
        raise HTTPException(status_code=401, detail="No token provided.")

    try:
        game = get_gamerecord_or_create_gamerecord_with_token(db, token)

        game.guess_count += 1
        db.commit()

        logger.debug(f"Guess count: {game.guess_count}")
        logger.debug(f"Guess word: {guess.guess_word}")
        logger.debug(f"Word: {set_word_to_cache()}")

        if game.guess_count <= GUESS_COUNT:
            return check_guessed_word(guess.guess_word, db, game)
        else:
            return {}
    except SQLAlchemyError:
        db.rollback()
        logger.error("Database error in /check ", exc_info=True)
        raise HTTPException(status_code=500, detail="Database error.")
    except Exception:
        logger.error("Unexpected error in /check ", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error.")
