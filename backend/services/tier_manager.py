import os

HOT_STORAGE = "storage/hot"
COLD_STORAGE = "storage/cold"

os.makedirs(HOT_STORAGE, exist_ok=True)
os.makedirs(COLD_STORAGE, exist_ok=True)


def select_storage_tier(file_size: int):
    """
    Small files -> hot storage
    Large files -> cold storage
    """
    if file_size < 5 * 1024 * 1024:  # 5MB threshold
        return HOT_STORAGE
    return COLD_STORAGE
