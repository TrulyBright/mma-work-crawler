from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from schema import Base


engine = create_engine("sqlite:///database.db",
                       connect_args={"check_same_thread": False})
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_session():
    return Session(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
