import os

STORAGE_DIR = "storage"

os.makedirs(STORAGE_DIR, exist_ok=True)

def save_file(file_content, filename, version):
    versioned_name = f"{filename}_v{version}"
    file_path = os.path.join(STORAGE_DIR, versioned_name)

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

    return file_path
