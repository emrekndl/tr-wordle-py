from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from random_word import get_wordlist
from check_word import check

from word_crud import create_word, get_today_word
from models import Word, Guess, Gusess_Response
from database import get_db
from utils import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    db: Session = next(get_db())
    try:
        init_db(db)
    finally:
        db.close()
    yield


app = FastAPI(lifespan=lifespan)


def word_of_the_day():
    return get_wordlist()


def check_guessed_word(guessed_word, db: Session):
    return Gusess_Response(**check(guessed_word, get_today_word(db)))


@app.get("/wordoftheday")
async def get_word(db: Session = Depends(get_db)):
    word = word_of_the_day()
    return create_word(db, Word(word=word))


@app.post("/check", response_model=Gusess_Response)
async def check_guess(guess: Guess, db: Session = Depends(get_db)):
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
