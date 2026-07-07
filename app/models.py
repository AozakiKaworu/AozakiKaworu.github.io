from datetime import datetime
from enum import Enum

from sqlalchemy import DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class VideoStatus(str, Enum):
    uploaded = "uploaded"
    analyzing = "analyzing"
    completed = "completed"
    failed = "failed"


class ClassroomState(str, Enum):
    listening = "listening"
    note_taking = "note_taking"
    interacting = "interacting"
    absent = "absent"
    undetected = "undetected"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    classes: Mapped[list["ClassSession"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class ClassSession(Base):
    __tablename__ = "classes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    course_name: Mapped[str | None] = mapped_column(String(120))
    teacher_name: Mapped[str | None] = mapped_column(String(80))
    description: Mapped[str | None] = mapped_column(Text)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    owner: Mapped[User] = relationship(back_populates="classes")
    videos: Mapped[list["Video"]] = relationship(back_populates="class_session", cascade="all, delete-orphan")
    report: Mapped["AnalysisReport | None"] = relationship(
        back_populates="class_session", cascade="all, delete-orphan", uselist=False
    )


class Video(Base):
    __tablename__ = "videos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    content_type: Mapped[str | None] = mapped_column(String(120))
    size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    duration_seconds: Mapped[float] = mapped_column(Float, default=0)
    status: Mapped[VideoStatus] = mapped_column(SqlEnum(VideoStatus), default=VideoStatus.uploaded)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    analyzed_at: Mapped[datetime | None] = mapped_column(DateTime)

    class_session: Mapped[ClassSession] = relationship(back_populates="videos")
    state_records: Mapped[list["StateRecord"]] = relationship(back_populates="video", cascade="all, delete-orphan")


class StateRecord(Base):
    __tablename__ = "state_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    video_id: Mapped[int] = mapped_column(ForeignKey("videos.id"), nullable=False)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), nullable=False)
    state: Mapped[ClassroomState] = mapped_column(SqlEnum(ClassroomState), nullable=False)
    start_second: Mapped[float] = mapped_column(Float, nullable=False)
    end_second: Mapped[float] = mapped_column(Float, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.9)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    video: Mapped[Video] = relationship(back_populates="state_records")


class AnalysisReport(Base):
    __tablename__ = "analysis_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    class_id: Mapped[int] = mapped_column(ForeignKey("classes.id"), unique=True, nullable=False)
    total_duration_seconds: Mapped[float] = mapped_column(Float, default=0)
    listening_seconds: Mapped[float] = mapped_column(Float, default=0)
    note_taking_seconds: Mapped[float] = mapped_column(Float, default=0)
    interacting_seconds: Mapped[float] = mapped_column(Float, default=0)
    absent_seconds: Mapped[float] = mapped_column(Float, default=0)
    undetected_seconds: Mapped[float] = mapped_column(Float, default=0)
    summary: Mapped[str] = mapped_column(Text, default="")
    suggestions: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class_session: Mapped[ClassSession] = relationship(back_populates="report")
