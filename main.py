import logging
import logging.config
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from db.database import get_db
from utils.wordle_utils import init_db
from routers.wordle_routers import wordle_router
from tasks.clear_task import delete_old_data
from log_config import LOGGING_CONFIG


scheduler = BackgroundScheduler(timezone="Europe/Istanbul")

logging.config.dictConfig(LOGGING_CONFIG)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db: Session = next(get_db())
    try:
        init_db(db)
        scheduler.add_job(
            delete_old_data, args=[db], trigger=CronTrigger(hour=0, minute=0)
        )
        scheduler.start()
    finally:
        db.close()
    yield
    scheduler.shutdown()


def get_app(lifespan=lifespan):
    app = FastAPI(lifespan=lifespan, title="Wordle API", version="1.0.0")
    app.mount("/wordle", StaticFiles(directory="wordle-ui", html=True), name="static")
    app.include_router(wordle_router)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_origin_regex=r"^https://.*\.ngrok-free\.app$",
        # allow_origins=[
        #     "http://localhost:8000",
        #     "http://127.0.0.1:8000",
        #     "http://0.0.0.0:8000",
        # ],
        # allow_credentials=False,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app


app = get_app(lifespan=lifespan)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return RedirectResponse(url="/wordle/favicon.ico")

@app.get("/api/.*", status_code=404, include_in_schema=False)
def invalid_api():
    return None

@app.get("/.*", include_in_schema=False)
def root():
    return HTMLResponse("wordle-ui/index.html")


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
# [X] is_complete not correct!!!(same letter in sets not counting)
# [X] guess only 6 times
# [X] get random word( word list len mod), web site crawler
# [X] project directory structure setup
# [X] word of the day save in cache -> need test!
# [X] /check not working correctly!!!
# [ ] check guessed word is valid turkish word (bloomfilter, wasm)
