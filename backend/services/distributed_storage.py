import os
import httpx
from services.encryption_service import encrypt_data, decrypt_data
from dotenv import load_dotenv

load_dotenv()

PC_NODE_URL = os.getenv("PC_NODE_URL", "http://localhost:8001")
PI_STORAGE_DIR = "storage/pi_storage"
os.makedirs(PI_STORAGE_DIR, exist_ok=True)

async def distribute_file(file_bytes: bytes, filename: str, user_id: str):
    """
    Encrypts, splits 50/50, and distributes to Pi and PC Node.
    """
    # 1. Encrypt
    encrypted_data = encrypt_data(file_bytes)
    
    # 2. Split 50/50
    mid = len(encrypted_data) // 2
    shard1 = encrypted_data[:mid]
    shard2 = encrypted_data[mid:]
    
    # 3. Store Shard 1 on Pi
    shard1_name = f"{filename}_shard1"
    shard1_path = os.path.join(PI_STORAGE_DIR, shard1_name)
    with open(shard1_path, "wb") as f:
        f.write(shard1)
        
    # 4. Store Shard 2 on PC
    shard2_name = f"{filename}_shard2"
    try:
        async with httpx.AsyncClient() as client:
            files = {'file': (shard2_name, shard2)}
            response = await client.post(f"{PC_NODE_URL}/upload-chunk/", files=files)
            response.raise_for_status()
    except Exception as e:
        # If PC storage fails, we have an issue. In a real system, we'd roll back.
        raise Exception(f"Failed to store shard on PC Node: {str(e)}")
        
    return shard1_path

async def retrieve_file(shard1_path: str, filename: str, user_id: str):
    """
    Fetches shards from Pi and PC, combines and decrypts.
    """
    # 1. Read Shard 1 from Pi
    if not os.path.exists(shard1_path):
        raise FileNotFoundError("Local shard not found on Pi")
        
    with open(shard1_path, "rb") as f:
        shard1 = f.read()
        
    # 2. Read Shard 2 from PC
    shard2_name = f"{filename}_shard2"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{PC_NODE_URL}/download-chunk/{shard2_name}")
            response.raise_for_status()
            shard2 = response.content
    except Exception as e:
        raise Exception(f"Failed to retrieve shard from PC Node: {str(e)}")
        
    # 3. Combine and Decrypt
    encrypted_data = shard1 + shard2
    return decrypt_data(encrypted_data)

async def delete_distributed_file(shard1_path: str, filename: str):
    """
    Deletes shards from both Pi and PC.
    """
    # Delete local
    if os.path.exists(shard1_path):
        os.remove(shard1_path)
        
    # Delete remote
    shard2_name = f"{filename}_shard2"
    try:
        async with httpx.AsyncClient() as client:
            await client.delete(f"{PC_NODE_URL}/delete-chunk/{shard2_name}")
    except:
        pass # Best effort deletion
