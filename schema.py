import sys
import inspect
from functools import cache
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class 병역지정업체정보(Base):
    __tablename__ = "병역지정업체정보"
    id: Mapped[int] = mapped_column(primary_key=True)
    업체명: Mapped[str] = mapped_column(String(32))
    업종: Mapped[str] = mapped_column(String(32))
    전화번호: Mapped[str] = mapped_column(String(32))
    주소: Mapped[str] = mapped_column(String(32))
    홈페이지: Mapped[str] = mapped_column(String(32))
    요원형태: Mapped[str] = mapped_column(String(32))
    고용형태: Mapped[str] = mapped_column(String(32))
    자격요원: Mapped[str] = mapped_column(String(32))
    급여조건: Mapped[str] = mapped_column(String(32))
    최종학력: Mapped[str] = mapped_column(String(32))
    전공계열: Mapped[str] = mapped_column(String(32))
    담당업무: Mapped[str] = mapped_column(String(32))
    전직자채용가능: Mapped[str] = mapped_column(String(32))
    근무형태: Mapped[str] = mapped_column(String(32))
    출퇴근시간: Mapped[str] = mapped_column(String(32))
    특근잔업: Mapped[str] = mapped_column(String(32))
    교대근무: Mapped[str] = mapped_column(String(32))
    수습기간: Mapped[str] = mapped_column(String(32))
    군사훈련교육소집기간급여: Mapped[str] = mapped_column(String(32))
    퇴직금지급: Mapped[str] = mapped_column(String(32))
    식사비지급: Mapped[str] = mapped_column(String(32))
    현역배정인원: Mapped[str] = mapped_column(String(32))
    현역편입인원: Mapped[str] = mapped_column(String(32))
    보충역배정인원: Mapped[str] = mapped_column(String(32))
    보충역편입인원: Mapped[str] = mapped_column(String(32))
    모집인원: Mapped[str] = mapped_column(String(32))
    지원보험: Mapped[str] = mapped_column(String(32))
    외국어: Mapped[str] = mapped_column(String(32))
    자격증: Mapped[str] = mapped_column(String(32))
    복리후생: Mapped[str] = mapped_column(String(32))
    접수기간: Mapped[str] = mapped_column(String(32))
    접수방법: Mapped[str] = mapped_column(String(32))
    담당자: Mapped[str] = mapped_column(String(32))
    참고: Mapped[str] = mapped_column(String(32))
    담당자전화번호: Mapped[str] = mapped_column(String(32))
    팩스번호: Mapped[str] = mapped_column(String(32))
    비고: Mapped[str] = mapped_column(String(32))
