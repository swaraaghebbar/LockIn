# LOCKIN

LOCKIN is a self-hosted distributed file storage platform that enables secure, scalable, and efficient file management using chunk-based storage, hybrid architecture, and real-time document editing.

## Features

- Configurable 4–8 MB file chunking for efficient storage and transfer
- Hybrid storage architecture combining distributed server storage and local client storage
- Google OAuth authentication for secure access
- Real-time document editing using ONLYOFFICE
- AES/Fernet encryption for secure file storage
- Metadata management and chunk replication for improved reliability
- Support for large files and multiple document formats

## Tech Stack

**Frontend:** React, Vite, JavaScript

**Backend:** FastAPI, Python, Node.js, SQLite

**Authentication:** Google OAuth

**Document Editing:** ONLYOFFICE API

## Project Structure

```text
LOCKIN/
├── backend/
├── frontend/
├── package.json
├── requirements.txt
└── README.md
```

## Getting Started

### Backend

```bash
pip install -r requirements.txt
python backend/main.py
```

### Frontend

```bash
cd frontend/frontend
npm install
npm run dev
```

## Future Enhancements

- Load balancing across storage nodes
- Version control for stored files
- End-to-end encryption
- Role-based access control
