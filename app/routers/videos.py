from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.deps import get_current_user, get_owned_class, get_owned_video
from app.models import User, Video, VideoStatus
from app.schemas import AnalyzeResponse, VideoRead, VideoStatusRead
from app.services.analyzer import run_mock_analysis


router = APIRouter(tags=["videos"])


@router.post("/api/classes/{class_id}/videos", response_model=VideoRead, status_code=201)
def upload_video(
    class_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    get_owned_class(db, class_id, user)

    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    original_name = Path(file.filename or "class-video").name
    stored_name = f"{uuid4().hex}_{original_name}"
    file_path = settings.upload_dir / stored_name

    with file_path.open("wb") as buffer:
        copyfileobj(file.file, buffer)

    video = Video(
        class_id=class_id,
        filename=original_name,
        file_path=str(file_path),
        content_type=file.content_type,
        size_bytes=file_path.stat().st_size,
        status=VideoStatus.uploaded,
    )
    db.add(video)
    db.commit()
    db.refresh(video)
    return video


@router.get("/api/videos/{video_id}", response_model=VideoRead)
def get_video(video_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_owned_video(db, video_id, user)


@router.post("/api/videos/{video_id}/analyze", response_model=AnalyzeResponse)
def analyze_video(video_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    video = get_owned_video(db, video_id, user)
    if video.status == VideoStatus.analyzing:
        raise HTTPException(status_code=409, detail="Video is already analyzing")

    try:
        report = run_mock_analysis(db, video)
    except Exception as exc:
        video.status = VideoStatus.failed
        db.commit()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc

    return AnalyzeResponse(video=video, report_id=report.id, message="Mock analysis completed")


@router.get("/api/videos/{video_id}/status", response_model=VideoStatusRead)
def get_video_status(video_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    video = get_owned_video(db, video_id, user)
    return VideoStatusRead(video_id=video.id, status=video.status, analyzed_at=video.analyzed_at)
