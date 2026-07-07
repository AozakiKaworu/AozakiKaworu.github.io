from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, get_owned_class
from app.models import AnalysisReport, ClassSession, ClassroomState, StateRecord, User
from app.schemas import ChartData, ChartItem, ClassCreate, ClassRead, Message, ReportRead, StateRecordRead, SuggestionsRead
from app.services.analyzer import STATE_LABELS, split_suggestions


router = APIRouter(prefix="/api/classes", tags=["classes"])


@router.post("", response_model=ClassRead, status_code=201)
def create_class(payload: ClassCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    class_session = ClassSession(**payload.model_dump(), owner_id=user.id)
    db.add(class_session)
    db.commit()
    db.refresh(class_session)
    return class_session


@router.get("", response_model=list[ClassRead])
def list_classes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return (
        db.query(ClassSession)
        .filter(ClassSession.owner_id == user.id)
        .order_by(ClassSession.created_at.desc())
        .all()
    )


@router.get("/{class_id}", response_model=ClassRead)
def get_class(class_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return get_owned_class(db, class_id, user)


@router.delete("/{class_id}", response_model=Message)
def delete_class(class_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    class_session = get_owned_class(db, class_id, user)
    db.delete(class_session)
    db.commit()
    return Message(message="Class deleted")


@router.get("/{class_id}/report", response_model=ReportRead)
def get_report(class_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_owned_class(db, class_id, user)
    report = db.query(AnalysisReport).filter(AnalysisReport.class_id == class_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found. Please analyze a video first.")
    return report


@router.get("/{class_id}/timeline", response_model=list[StateRecordRead])
def get_timeline(class_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_owned_class(db, class_id, user)
    return (
        db.query(StateRecord)
        .filter(StateRecord.class_id == class_id)
        .order_by(StateRecord.video_id.asc(), StateRecord.start_second.asc())
        .all()
    )


@router.get("/{class_id}/chart-data", response_model=ChartData)
def get_chart_data(class_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_owned_class(db, class_id, user)
    report = db.query(AnalysisReport).filter(AnalysisReport.class_id == class_id).first()
    if not report:
        return ChartData(class_id=class_id, total_seconds=0, items=[])

    totals = {
        ClassroomState.listening: report.listening_seconds,
        ClassroomState.note_taking: report.note_taking_seconds,
        ClassroomState.interacting: report.interacting_seconds,
        ClassroomState.absent: report.absent_seconds,
        ClassroomState.undetected: report.undetected_seconds,
    }
    items = [
        ChartItem(
            state=state,
            label=STATE_LABELS[state],
            seconds=seconds,
            percentage=round(seconds / report.total_duration_seconds * 100, 2)
            if report.total_duration_seconds
            else 0,
        )
        for state, seconds in totals.items()
    ]
    return ChartData(class_id=class_id, total_seconds=report.total_duration_seconds, items=items)


@router.get("/{class_id}/suggestions", response_model=SuggestionsRead)
def get_suggestions(class_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    get_owned_class(db, class_id, user)
    report = db.query(AnalysisReport).filter(AnalysisReport.class_id == class_id).first()
    return SuggestionsRead(class_id=class_id, suggestions=split_suggestions(report))
