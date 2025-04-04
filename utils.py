from sqlalchemy import text
from database import engine, Base
from sqlalchemy.orm import Session


def init_db(db: Session):
    Base.metadata.create_all(bind=engine)
    db.execute(text("PRAGMA auto_vacuum = FULL"))
    db.execute(text("VACUUM"))
    db.commit()
