from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, scoped_session
from model import Base


engine = create_engine("sqlite:///database.db", echo=True)
Base.metadata.create_all(engine)


def get_session():
    return Session(bind=engine)


def get_db():
    db = scoped_session(sessionmaker(
        autocommit=False, autoflush=False, bind=engine))
    try:
        yield db
    finally:
        db.close()
