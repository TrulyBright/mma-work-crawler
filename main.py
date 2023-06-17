from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import get_db
import schema

app = FastAPI()

origins = [
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def get_job_list(db: Session = Depends(get_db)):
    return db.query(schema.병역지정업체정보).all()


@app.get("/last-update")
async def get_last_update(db: Session = Depends(get_db)):
    return db.query(schema.LastUpdate).first()
