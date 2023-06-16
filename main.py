import asyncio
import updater
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import get_db
import uvicorn
import schema

app = FastAPI()


@app.get("/")
async def get_job_list(db: Session = Depends(get_db)):
    fields = (
        schema.병역지정업체정보.id,
        schema.병역지정업체정보.업체명,
        schema.병역지정업체정보.업종,
        schema.병역지정업체정보.자격요원,
        schema.병역지정업체정보.전직자채용가능,
        schema.병역지정업체정보.최종학력,
    )
    fetched = db.query(schema.병역지정업체정보).values(*fields)
    return [{field.name: value for field, value in zip(fields, row)} for row in fetched]


@app.get("/{id}")
async def get_job(id: int, db: Session = Depends(get_db)):
    return db.query(schema.병역지정업체정보).filter(schema.병역지정업체정보.id == id).first()
