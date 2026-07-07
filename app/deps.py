from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models import ClassSession, User, Video


bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    username = decode_access_token(credentials.credentials)
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_owned_class(db: Session, class_id: int, user: User) -> ClassSession:
    class_session = (
        db.query(ClassSession)
        .filter(ClassSession.id == class_id, ClassSession.owner_id == user.id)
        .first()
    )
    if not class_session:
        raise HTTPException(status_code=404, detail="Class not found")
    return class_session


def get_owned_video(db: Session, video_id: int, user: User) -> Video:
    video = (
        db.query(Video)
        .join(ClassSession)
        .filter(Video.id == video_id, ClassSession.owner_id == user.id)
        .first()
    )
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return video
