from fastapi import FastAPI
from pydantic import BaseModel
from database import SessionLocal
from models import TRFRecord, User
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

import shutil
import os

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TRF(BaseModel):
    trf_number: str
    project_name: str

@app.get("/")
def home():
    return {"message": "TRF Management System Running Successfully"}


@app.get("/search-trf/{trf_number}")
def search_trf(trf_number: str):

    db = SessionLocal()

    trf = db.query(TRFRecord).filter(
        TRFRecord.trf_number == trf_number
    ).first()

    if not trf:
        return {
            "message": "TRF Not Found"
        }

    return {
        "trf_number": trf.trf_number,
        "project_name": trf.project_name,
        "created_at": trf.created_at
    }
@app.post("/create-trf")
def create_trf(trf: TRF):

    db = SessionLocal()

    existing_trf = db.query(TRFRecord).filter(
        TRFRecord.trf_number == trf.trf_number
    ).first()

    if existing_trf:
        return {
            "message": "TRF Already Exists In Database"
        }

    new_trf = TRFRecord(
        trf_number=trf.trf_number,
        project_name=trf.project_name
    )

    db.add(new_trf)
    db.commit()

    root_folder = trf.trf_number

    subfolders = [
        "Documents",
        "Reports",
        "Drawings",
        "Approvals",
        "Final Submission"
    ]

    if not os.path.exists(root_folder):

        os.mkdir(root_folder)

        for folder in subfolders:
            os.mkdir(os.path.join(root_folder, folder))

    return {
        "message": "TRF Created Successfully",
        "trf_number": trf.trf_number
    }
@app.get("/all-trfs")
def get_all_trfs():

    db = SessionLocal()

    trfs = db.query(TRFRecord).all()

    result = []

    for trf in trfs:
        result.append({
            "id": trf.id,
            "trf_number": trf.trf_number,
            "project_name": trf.project_name,
            "created_at": trf.created_at
        })

    return result
@app.delete("/delete-trf/{trf_number}")
def delete_trf(trf_number: str):

    db = SessionLocal()

    trf = db.query(TRFRecord).filter(
        TRFRecord.trf_number == trf_number
    ).first()

    if not trf:
        return {
            "message": "TRF Not Found"
        }

    db.delete(trf)
    db.commit()

    return {
        "message": "TRF Deleted Successfully"
    }
@app.post("/upload-file/{trf_number}/{folder_name}")
def upload_file(
    trf_number: str,
    folder_name: str,
    file: UploadFile = File(...)
):

    folder_path = os.path.join(
        trf_number,
        folder_name
    )

    if not os.path.exists(folder_path):
        return {
            "message": "Folder Not Found"
        }

    file_path = os.path.join(
        folder_path,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    return {
        "message": "File Uploaded Successfully",
        "file_name": file.filename
    }
@app.get("/files/{trf_number}/{folder_name}")
def get_files(
    trf_number: str,
    folder_name: str
):

    folder_path = os.path.join(
        trf_number,
        folder_name
    )

    if not os.path.exists(folder_path):
        return {
            "message": "Folder Not Found"
        }

    files = os.listdir(folder_path)

    return {
        "trf_number": trf_number,
        "folder_name": folder_name,
        "files": files
    }
@app.put("/update-trf/{trf_number}")
def update_trf(
    trf_number: str,
    project_name: str
):

    db = SessionLocal()

    trf = db.query(TRFRecord).filter(
        TRFRecord.trf_number == trf_number
    ).first()

    if not trf:
        return {
            "message": "TRF Not Found"
        }

    trf.project_name = project_name

    db.commit()

    return {
        "message": "TRF Updated Successfully"
    }
@app.delete("/delete-file/{trf_number}/{folder_name}/{file_name}")
def delete_file(
    trf_number: str,
    folder_name: str,
    file_name: str
):

    file_path = os.path.join(
        trf_number,
        folder_name,
        file_name
    )

    if not os.path.exists(file_path):
        return {
            "message": "File Not Found"
        }

    os.remove(file_path)

    return {
        "message": "File Deleted Successfully"
    }
@app.get("/download-file/{trf_number}/{folder_name}/{file_name}")
def download_file(
    trf_number: str,
    folder_name: str,
    file_name: str
):

    file_path = os.path.join(
        trf_number,
        folder_name,
        file_name
    )

    if not os.path.exists(file_path):
        return {
            "message": "File Not Found"
        }

    return FileResponse(
        path=file_path,
        filename=file_name
    )
@app.get("/dashboard-stats")
def dashboard_stats():

    db = SessionLocal()

    total_trfs = db.query(TRFRecord).count()

    return {
        "total_trfs": total_trfs
    }

@app.post("/register")
def register(
    username: str,
    password: str
):

    db = SessionLocal()

    existing_user = db.query(User).filter(
        User.username == username
    ).first()

    if existing_user:
        return {
            "message": "User Already Exists"
        }

    new_user = User(
        username=username,
        password=password,
        role="Engineer"
    )

    db.add(new_user)
    db.commit()


    return {
        "message": "User Created Successfully"
    }
    return {
        "message": "User Created"
    }
@app.post("/login")
def login(
    username: str,
    password: str
):

    db = SessionLocal()

    user = db.query(User).filter(
        User.username == username
    ).first()

    if not user:
        return {
            "message": "User Not Found"
        }

    if user.password != password:
        return {
            "message": "Invalid Password"
        }

    return {
        "message": "Login Successful",
        "username": user.username,
        "role": user.role
    }