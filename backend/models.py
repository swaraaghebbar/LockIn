from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# ---------------- USER MODEL ----------------
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # One-to-Many Relationship
    files = relationship("FileMetadata", back_populates="owner", cascade="all, delete")


# ---------------- FILE METADATA MODEL ----------------
class FileMetadata(Base):
    __tablename__ = "files"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    version = Column(Integer, default=1)
    path = Column(String)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    # Foreign Key to Users table
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationship back to User
    owner = relationship("User", back_populates="files")
