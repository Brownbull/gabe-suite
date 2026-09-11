from sqlmodel import Field, SQLModel


class Widget(SQLModel, table=True):
    """A widget."""
    id: int | None = Field(default=None, primary_key=True)
    name: str
