from datetime import datetime

from sqlalchemy.orm import Session

from app.models import AnalysisReport, ClassroomState, StateRecord, Video, VideoStatus


STATE_LABELS = {
    ClassroomState.listening: "正常听课",
    ClassroomState.note_taking: "低头记录",
    ClassroomState.interacting: "互动状态",
    ClassroomState.absent: "离座",
    ClassroomState.undetected: "未检测",
}


def run_mock_analysis(db: Session, video: Video) -> AnalysisReport:
    video.status = VideoStatus.analyzing
    db.commit()
    db.refresh(video)

    db.query(StateRecord).filter(StateRecord.video_id == video.id).delete()

    segments = [
        (ClassroomState.listening, 0, 300, 0.92),
        (ClassroomState.note_taking, 300, 480, 0.88),
        (ClassroomState.interacting, 480, 660, 0.9),
        (ClassroomState.listening, 660, 1020, 0.91),
        (ClassroomState.undetected, 1020, 1080, 0.75),
        (ClassroomState.note_taking, 1080, 1320, 0.86),
        (ClassroomState.absent, 1320, 1380, 0.8),
        (ClassroomState.interacting, 1380, 1560, 0.89),
        (ClassroomState.listening, 1560, 1800, 0.93),
    ]

    totals = {state: 0.0 for state in ClassroomState}
    records = []
    for state, start, end, confidence in segments:
        duration = float(end - start)
        totals[state] += duration
        records.append(
            StateRecord(
                video_id=video.id,
                class_id=video.class_id,
                state=state,
                start_second=float(start),
                end_second=float(end),
                duration_seconds=duration,
                confidence=confidence,
            )
        )

    db.add_all(records)

    total_duration = sum(totals.values())
    video.duration_seconds = total_duration
    video.status = VideoStatus.completed
    video.analyzed_at = datetime.utcnow()

    report = db.query(AnalysisReport).filter(AnalysisReport.class_id == video.class_id).first()
    if not report:
        report = AnalysisReport(class_id=video.class_id)
        db.add(report)

    class_totals = calculate_class_totals(db, video.class_id, pending_records=records)
    fill_report(report, class_totals)

    db.commit()
    db.refresh(video)
    db.refresh(report)
    return report


def calculate_class_totals(
    db: Session, class_id: int, pending_records: list[StateRecord] | None = None
) -> dict[ClassroomState, float]:
    totals = {state: 0.0 for state in ClassroomState}
    existing = db.query(StateRecord).filter(StateRecord.class_id == class_id).all()
    for record in existing:
        totals[record.state] += record.duration_seconds
    for record in pending_records or []:
        totals[record.state] += record.duration_seconds
    return totals


def fill_report(report: AnalysisReport, totals: dict[ClassroomState, float]) -> None:
    total = sum(totals.values())
    listening = totals[ClassroomState.listening]
    note_taking = totals[ClassroomState.note_taking]
    interacting = totals[ClassroomState.interacting]
    absent = totals[ClassroomState.absent]
    undetected = totals[ClassroomState.undetected]

    active_ratio = (listening + note_taking + interacting) / total if total else 0
    interaction_ratio = interacting / total if total else 0

    suggestions = build_suggestions(active_ratio, interaction_ratio, absent, undetected, total)
    summary = (
        f"本次课堂有效分析时长 {round(total / 60, 1)} 分钟，"
        f"学生主要状态为{dominant_state_label(totals)}，"
        f"课堂投入度约 {round(active_ratio * 100, 1)}%。"
    )

    report.total_duration_seconds = total
    report.listening_seconds = listening
    report.note_taking_seconds = note_taking
    report.interacting_seconds = interacting
    report.absent_seconds = absent
    report.undetected_seconds = undetected
    report.summary = summary
    report.suggestions = "\n".join(suggestions)


def dominant_state_label(totals: dict[ClassroomState, float]) -> str:
    state = max(totals, key=lambda item: totals[item])
    return STATE_LABELS[state]


def build_suggestions(
    active_ratio: float, interaction_ratio: float, absent_seconds: float, undetected_seconds: float, total: float
) -> list[str]:
    suggestions = []
    if interaction_ratio < 0.12:
        suggestions.append("互动时长占比较低，建议在知识点讲解后加入提问、投票或小组讨论。")
    else:
        suggestions.append("课堂互动占比较好，可以继续保持讲解与互动交替的节奏。")

    if active_ratio < 0.75:
        suggestions.append("课堂投入度偏低，建议缩短连续讲授时长，并增加阶段性反馈。")
    else:
        suggestions.append("多数时间处于听课、记录或互动状态，整体课堂节奏较稳定。")

    if total and absent_seconds / total > 0.08:
        suggestions.append("离座状态占比偏高，建议关注课堂纪律或座位区域的参与情况。")

    if total and undetected_seconds / total > 0.08:
        suggestions.append("未检测时长较多，建议调整摄像头角度、光照或画面遮挡情况。")

    return suggestions


def split_suggestions(report: AnalysisReport | None) -> list[str]:
    if not report or not report.suggestions:
        return []
    return [line for line in report.suggestions.splitlines() if line.strip()]
