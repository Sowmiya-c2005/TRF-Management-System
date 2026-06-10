from fastapi import FastAPI
from pydantic import BaseModel
import os

app = FastAPI()

class TRF(BaseModel):
    trf_number: str
    project_name: str

@app.get("/")
def home():
    return {
        "message": "TRF Management System Running Successfully"
    }

@app.post("/create-trf")
def create_trf(trf: TRF):

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
            "message": "TRF Folder Created Successfully",
            "trf_number": trf.trf_number
        }

    return {
        "message": "TRF Folder Already Exists"
    }