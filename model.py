import sys
import inspect
from functools import cache
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    @classmethod
    @cache
    def pool(cls):
        return dict(inspect.getmembers(sys.modules[__name__], lambda obj: inspect.isclass(obj) and issubclass(obj, cls)))


class 병역지정업체정보(Base):
    __tablename__ = "병역지정업체정보"
    id: Mapped[int] = mapped_column(primary_key=True)
    업체명: Mapped[str] = mapped_column(String(32))
    업종: Mapped[str] = mapped_column(String(32))
    전화번호: Mapped[str] = mapped_column(String(32))
    주소: Mapped[str] = mapped_column(String(32))
    홈페이지: Mapped[str] = mapped_column(String(32))


class 근무조건(Base):
    __tablename__ = "근무조건"
    id: Mapped[int] = mapped_column(
        ForeignKey("병역지정업체정보.id"),
        primary_key=True
    )
    요원형태: Mapped[str] = mapped_column(String(32))
    고용형태: Mapped[str] = mapped_column(String(32))
    자격요원: Mapped[str] = mapped_column(String(32))
    급여조건: Mapped[str] = mapped_column(String(32))
    최종학력: Mapped[str] = mapped_column(String(32))
    전공계열: Mapped[str] = mapped_column(String(32))
    담당업무: Mapped[str] = mapped_column(String(32))
    전직자_채용가능: Mapped[str] = mapped_column(String(32))
    근무형태: Mapped[str] = mapped_column(String(32))
    출퇴근시간: Mapped[str] = mapped_column(String(32))
    특근_잔업: Mapped[str] = mapped_column(String(32))
    교대근무: Mapped[str] = mapped_column(String(32))
    수습기간: Mapped[str] = mapped_column(String(32))
    군사훈련교육소집기간_급여: Mapped[str] = mapped_column(String(32))
    퇴직금지급: Mapped[str] = mapped_column(String(32))
    식사_비_지급: Mapped[str] = mapped_column(String(32))
    현역배정인원: Mapped[str] = mapped_column(String(32))
    현역편입인원: Mapped[str] = mapped_column(String(32))
    보충역배정인원: Mapped[str] = mapped_column(String(32))
    보충역편입인원: Mapped[str] = mapped_column(String(32))
    모집인원: Mapped[str] = mapped_column(String(32))
    지원보험: Mapped[str] = mapped_column(String(32))


class 우대사항_및_복리후생(Base):
    __tablename__ = "우대사항_및_복리후생"
    id: Mapped[int] = mapped_column(
        ForeignKey("병역지정업체정보.id"),
        primary_key=True
    )
    외국어: Mapped[str] = mapped_column(String(32))
    자격증: Mapped[str] = mapped_column(String(32))
    복리후생: Mapped[str] = mapped_column(String(32))


class 접수방법(Base):
    __tablename__ = "접수방법"
    id: Mapped[int] = mapped_column(
        ForeignKey("병역지정업체정보.id"),
        primary_key=True
    )
    접수기간: Mapped[str] = mapped_column(String(32))
    접수방법: Mapped[str] = mapped_column(String(32))


class 담당자정보(Base):
    __tablename__ = "담당자정보"
    id: Mapped[int] = mapped_column(
        ForeignKey("병역지정업체정보.id"),
        primary_key=True
    )
    담당자: Mapped[str] = mapped_column(String(32))
    참__고: Mapped[str] = mapped_column(String(32))
    전화번호: Mapped[str] = mapped_column(String(32))
    팩스번호: Mapped[str] = mapped_column(String(32))


class 비_고(Base):
    __tablename__ = "비_고"
    id: Mapped[int] = mapped_column(
        ForeignKey("병역지정업체정보.id"),
        primary_key=True
    )
    비_고: Mapped[str] = mapped_column(String(32))
