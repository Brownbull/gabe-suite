from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from .models import Widget

router = APIRouter(prefix="/widgets")


def current_user() -> str:
    """The gate."""
    return "u"


@router.get("")
def list_widgets(session: Session, user: str = Depends(current_user)) -> list[Widget]:
    """List every widget."""
    return list(session.exec(select(Widget)))


@router.post("")
def create_widget(session: Session, user: str = Depends(current_user)) -> Widget:
    """Create one widget."""
    w = Widget(name="x")
    session.add(w)
    session.commit()
    return w
