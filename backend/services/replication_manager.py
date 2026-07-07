import os
from services.chunk_service import split_into_chunks

NODE_1 = "storage/node1"
NODE_2 = "storage/node2"

os.makedirs(NODE_1, exist_ok=True)
os.makedirs(NODE_2, exist_ok=True)


def replicate_file(file_bytes: bytes, filename: str):
    chunks = split_into_chunks(file_bytes)
    stored_paths = []

    for index, chunk in enumerate(chunks):
        file_part_name = f"{filename}_chunk{index}"

        path1 = os.path.join(NODE_1, file_part_name)
        path2 = os.path.join(NODE_2, file_part_name)

        # Store in Node 1
        with open(path1, "wb") as f:
            f.write(chunk)

        # Replicate to Node 2
        with open(path2, "wb") as f:
            f.write(chunk)

        stored_paths.append(path1)

    return stored_paths
