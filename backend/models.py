
from sqlalchemy import Column, Integer, String, Numeric, DateTime
from sqlalchemy.sql import func

from database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    description = Column(String(200), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    category = Column(String(100), nullable=True)
    status = Column(String(20), default="pending", nullable=False)
    paypal_order_id = Column(String(100), nullable=True, unique=True)
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
