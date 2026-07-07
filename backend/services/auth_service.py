from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import HTTPException, Depends, Header
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os

from models import User
from database import SessionLocal

# Load environment variables
load_dotenv()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# ---------------- DATABASE DEPENDENCY ----------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------- VERIFY GOOGLE TOKEN ----------------
def verify_token(token: str = Header(None), db: Session = Depends(get_db)):

    if not token:
        raise HTTPException(status_code=401, detail="Token missing")

    try:
        # Verify token with Google
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            GOOGLE_CLIENT_ID
        )

        # Extract user info
        email = idinfo.get("email")
        name = idinfo.get("name")

        if not email:
            raise HTTPException(status_code=401, detail="Invalid Google token")

        # Check if user exists
        user = db.query(User).filter(User.email == email).first()

        # Create user if first login
        if not user:
            user = User(
                email=email,
                name=name
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return user

    except Exception as e:
        print("Google Auth Error:", str(e))
        raise HTTPException(
            status_code=401,
            detail=f"Google Auth Error: {str(e)}"
        )

