import os

CHUNK_SIZE = 1024 * 1024  # 1MB


def split_into_chunks(file_bytes: bytes):
    return [
        file_bytes[i:i + CHUNK_SIZE]
        for i in range(0, len(file_bytes), CHUNK_SIZE)
    ]


def save_chunks(file_id: str, chunks: list, base_dir: str):
    """
    Saves chunks to disk in correct order.
    Returns list of file paths.
    """
    os.makedirs(base_dir, exist_ok=True)

    chunk_paths = []

    for index, chunk in enumerate(chunks):
        chunk_filename = f"{file_id}_chunk_{index}"
        chunk_path = os.path.join(base_dir, chunk_filename)

        # CRITICAL: must use wb
        with open(chunk_path, "wb") as f:
            f.write(chunk)

        chunk_paths.append((index, chunk_path))

    return chunk_paths


def load_chunks(chunk_paths: list):
    """
    chunk_paths must be list of tuples:
    [(index, path), (index, path), ...]
    """

    # CRITICAL: sort by numeric index
    chunk_paths = sorted(chunk_paths, key=lambda x: x[0])

    chunks = []

    for _, path in chunk_paths:
        # CRITICAL: must use rb
        with open(path, "rb") as f:
            chunks.append(f.read())

    return chunks


def combine_chunks(chunks: list):
    return b"".join(chunks)
