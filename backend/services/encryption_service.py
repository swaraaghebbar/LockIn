from cryptography.fernet import Fernet
import os

KEY_FILE = "fernet.key"

# Load or generate key (ONLY ONCE)
if os.path.exists(KEY_FILE):
    with open(KEY_FILE, "rb") as f:
        key = f.read()
else:
    key = Fernet.generate_key()
    with open(KEY_FILE, "wb") as f:
        f.write(key)

cipher = Fernet(key)


def encrypt_data(data: bytes) -> bytes:
    return cipher.encrypt(data)


def decrypt_data(data: bytes) -> bytes:
    return cipher.decrypt(data)
