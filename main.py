import logging
import logging.config
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Response, Cookie, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from random_word import get_wordlist
from check_word import check

from word_crud import create_word, get_today_word, get_game_by_token
from models import Word, Guess, Gusess_Response
from database import get_db
from utils import init_db

from log_config import LOGGING_CONFIG

from db_clear_task import delete_old_game_records

scheduler = BackgroundScheduler(timezone="Europe/Istanbul")


@asynccontextmanager
async def lifespan(app: FastAPI):
    db: Session = next(get_db())
    try:
        init_db(db)
        scheduler.add_job(
            delete_old_game_records, args=[db], trigger=CronTrigger(hour=0, minute=0)
        )
        scheduler.start()
    finally:
        db.close()
    yield
    scheduler.shutdown()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)


def word_of_the_day():
    return get_wordlist()


def check_guessed_word(guessed_word, db: Session):
    return Gusess_Response(**check(guessed_word, get_today_word(db)))


@app.get("/wordoftheday")
async def get_word(
    response: Response, db: Session = Depends(get_db), token: str = Cookie(None)
):
    if token is None:
        token = str(uuid.uuid4())
        response.set_cookie(key="token", value=token, httponly=True, samesite="lax")
    _ = get_game_by_token(db, token)
    word = word_of_the_day()
    return create_word(db, Word(word=word))


@app.post("/check", response_model=Gusess_Response)
async def check_guess(
    guess: Guess,
    response: Response,
    db: Session = Depends(get_db),
    token: str = Cookie(None),
):
    if token is None:
        raise HTTPException(status_code=401, detail="No token provided.")
    game = get_game_by_token(db, token)
    if game[0].guess_count >= 6:
        raise HTTPException(
            status_code=400, detail="You have reached the maximum number of guesses."
        )
    game[0].guess_count += 1
    db.commit()
    return check_guessed_word(guess.guess_word, db)


def main():
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()

## Checklist

# [x] check word
# [x] check guess
# [x] create word
# [x] get wordlist
# [ ] get random word( word list len mod)
# [ ] guess only 5 times
# [ ] is_complete not correct!!!
