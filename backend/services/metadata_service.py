from models import FileMetadata


def create_metadata(db, filename: str, version: int, path: str):
    metadata = FileMetadata(
        filename=filename,
        version=version,
        path=path
    )
    db.add(metadata)
    db.commit()
    db.refresh(metadata)
    return metadata


def get_file_by_id(db, file_id: int):
    return db.query(FileMetadata).filter(FileMetadata.id == file_id).first()


def delete_metadata(db, file):
    db.delete(file)
    db.commit()


def list_all_files(db):
    return db.query(FileMetadata).all()
