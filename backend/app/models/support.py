import uuid
from sqlalchemy import String, ForeignKey, Text, Enum
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("orders.id"))
    customer_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    issue_type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(
        Enum("open", "in_progress", "resolved", "escalated", name="ticket_status"),
        default="open",
    )
    owner_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    resolution_notes: Mapped[str | None] = mapped_column(Text)
