from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import ClassroomState, VideoStatus


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserCreate(BaseModel):
    username: str = Field(min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)


class UserLogin(BaseModel):
    username: str
    password: str


class UserRead(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ClassCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    course_name: str | None = Field(default=None, max_length=120)
    teacher_name: str | None = Field(default=None, max_length=80)
    description: str | None = None


class ClassRead(BaseModel):
    id: int
    title: str
    course_name: str | None
    teacher_name: str | None
    description: str | None
    owner_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VideoRead(BaseModel):
    id: int
    class_id: int
    filename: str
    content_type: str | None
    size_bytes: int
    duration_seconds: float
    status: VideoStatus
    created_at: datetime
    analyzed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class AnalyzeResponse(BaseModel):
    video: VideoRead
    report_id: int
    message: str


class VideoStatusRead(BaseModel):
    video_id: int
    status: VideoStatus
    analyzed_at: datetime | None


class StateRecordRead(BaseModel):
    id: int
    video_id: int
    class_id: int
    state: ClassroomState
    start_second: float
    end_second: float
    duration_seconds: float
    confidence: float

    model_config = ConfigDict(from_attributes=True)


class ReportRead(BaseModel):
    id: int
    class_id: int
    total_duration_seconds: float
    listening_seconds: float
    note_taking_seconds: float
    interacting_seconds: float
    absent_seconds: float
    undetected_seconds: float
    summary: str
    suggestions: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChartItem(BaseModel):
    state: ClassroomState
    label: str
    seconds: float
    percentage: float


class ChartData(BaseModel):
    class_id: int
    total_seconds: float
    items: list[ChartItem]


class SuggestionsRead(BaseModel):
    class_id: int
    suggestions: list[str]


class Message(BaseModel):
    message: str
