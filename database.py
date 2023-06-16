from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from model import Base


engine = create_engine("sqlite:///database.db", echo=True)
Base.metadata.create_all(engine)


def get_session():
    return Session(bind=engine)
