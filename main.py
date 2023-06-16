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


@app.get("/{id}/근무조건")
async def get_job_condition(id: int, db: Session = Depends(get_db)):
    return db.query(model.근무조건).filter(model.근무조건.id == id).first()


@app.get("/{id}/우대사항_및_복리후생")
async def get_job_benefit(id: int, db: Session = Depends(get_db)):
    return db.query(model.우대사항_및_복리후생).filter(model.우대사항_및_복리후생.id == id).first()


@app.get("/{id}/접수방법")
async def get_job_application(id: int, db: Session = Depends(get_db)):
    return db.query(model.접수방법).filter(model.접수방법.id == id).first()


@app.get("/{id}/담당자정보")
async def get_job_contact(id: int, db: Session = Depends(get_db)):
    return db.query(model.담당자정보).filter(model.담당자정보.id == id).first()


@app.get("/{id}/비고")
async def get_job_etc(id: int, db: Session = Depends(get_db)):
    return db.query(model.비_고).filter(model.비_고.id == id).first()
