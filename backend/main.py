from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request
from fastapi.responses import Response
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import FileMetadata, User
import os
import httpx
from services.auth_service import verify_token
from services.metadata_service import create_metadata
from services.distributed_storage import distribute_file, retrieve_file, delete_distributed_file

Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?|https?://.*\.ngrok-free\.dev",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cross-Origin-Opener-Policy"] = "same-origin-allow-popups"
    return response

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

@app.get("/")
def root():
    return {"message": "HopeDrive API Online"}

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...), user: User = Depends(verify_token), db: Session = Depends(get_db)):
    content = await file.read()
    existing = db.query(FileMetadata).filter(FileMetadata.filename == file.filename, FileMetadata.user_id == user.id).order_by(FileMetadata.version.desc()).first()
    new_version = 1 if not existing else existing.version + 1
    try:
        # Calling with exactly 4 arguments as defined in distributed_storage.py
        shard1_path = await distribute_file(content, file.filename, user.id, new_version)
        create_metadata(db, file.filename, new_version, shard1_path, user.id)
        return {"message": "Success", "version": new_version}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/files/")
def list_files(user: User = Depends(verify_token), db: Session = Depends(get_db)):
    files = db.query(FileMetadata).filter(FileMetadata.user_id == user.id).all()
    result = []
    for f in files:
        if f.path and os.path.exists(f.path):
            result.append({
                "id": f.id, "filename": f.filename, "version": f.version,
                "uploaded_at": f.uploaded_at.isoformat() if hasattr(f.uploaded_at, 'isoformat') else str(f.uploaded_at)
            })
        else:
            db.delete(f)
    db.commit()
    return result

@app.get("/download/{file_id}")
async def download_file(file_id: int, user: User = Depends(verify_token), db: Session = Depends(get_db)):
    file = db.query(FileMetadata).filter(FileMetadata.id == file_id, FileMetadata.user_id == user.id).first()
    if not file: raise HTTPException(status_code=404)
    try:
        decrypted_data = await retrieve_file(file.path)
        return Response(content=decrypted_data, media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{file.filename}"'})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/delete/{file_id}")
async def delete_file(file_id: int, user: User = Depends(verify_token), db: Session = Depends(get_db)):
    file = db.query(FileMetadata).filter(FileMetadata.id == file_id, FileMetadata.user_id == user.id).first()
    if not file: raise HTTPException(status_code=404)
    await delete_distributed_file(file.path)
    db.delete(file)
    db.commit()
    return {"message": "Deleted"}

@app.get("/editor/file/{file_id}")
async def get_file_for_editor(file_id: int, db: Session = Depends(get_db)):
    file = db.query(FileMetadata).filter(FileMetadata.id == file_id).first()
    if not file: raise HTTPException(status_code=404)
    try:
        decrypted_data = await retrieve_file(file.path)
        return Response(content=decrypted_data, media_type="application/octet-stream")
    except Exception: raise HTTPException(status_code=500)

@app.post("/editor/save/{file_id}")
async def save_from_editor(file_id: int, request: Request, db: Session = Depends(get_db)):
    body = await request.json()
    print("ONLYOFFICE CALLBACK:", body)

    # Save only when document is ready or autosave
    if body.get("status") in [2, 6]:
        file_meta = db.query(FileMetadata).filter(FileMetadata.id == file_id).first()
        if not file_meta:
            return {"error": 1}

        try:
            # 1. Download updated file from OnlyOffice
            async with httpx.AsyncClient() as client:
                response = await client.get(body.get("url"))
                updated_file = response.content

            # 🔥 DELETE OLD FILE FIRST
                await delete_distributed_file(file_meta.path)

                # 🔥 STORE NEW FILE (same version)
                new_path = await distribute_file(
                    updated_file,
                    file_meta.filename,
                    file_meta.user_id,
                    file_meta.version
                )

                # Update path
                file_meta.path = new_path

            db.commit()

            print(f"File {file_id} saved successfully")

        except Exception as e:
            print("SAVE ERROR:", str(e))
            return {"error": 1}

    return {"error": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
