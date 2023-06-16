import asyncio
import updater
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import get_db
import uvicorn
import model

app = FastAPI()


@app.get("/")
async def get_job_list(db: Session = Depends(get_db)):
    return db.query(model.병역지정업체정보).all()


@app.get("/{id}")
async def get_job(id: int, db: Session = Depends(get_db)):
    return db.query(model.병역지정업체정보).filter(model.병역지정업체정보.id == id).first()
