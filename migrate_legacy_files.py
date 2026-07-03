"""
migrate_legacy_files.py
────────────────────────────────────────────────────────────────────────────
One-time migration that:

1.  Copies files from  backend/TRF-*/  →  uploads/TRF-*/   (if not already there)
2.  Registers every physical file found in uploads/TRF-*/  into the DB
    (creates FileRecord + FileVersion v1 when not already tracked)
3.  Reports what was done

Run from the project root:
    python migrate_legacy_files.py
"""
import os
import shutil
import sys

sys.path.insert(0, ".")

from backend.database.database import SessionLocal
from backend.models.trf_model import TRFRecord
from backend.models.folder_model import Folder
from backend.models.file_model import FileRecord, FileVersion
from backend.repositories.file_repository import FileRepository
from backend.repositories.folder_repository import FolderRepository

UPLOADS_ROOT = "uploads"
BACKEND_OLD  = "backend"
SUBFOLDERS   = ["Documents", "Reports", "Drawings", "Approvals", "Final Submission"]

file_repo   = FileRepository()
folder_repo = FolderRepository()


def migrate():
    db = SessionLocal()
    try:
        # ── Step 1: copy files from old backend/TRF-*/ to uploads/TRF-*/ ─────
        print("\n── Step 1: copy legacy backend/TRF-*/ files → uploads/ ──")
        for item in sorted(os.listdir(BACKEND_OLD)):
            if not item.startswith("TRF-"):
                continue
            for folder_name in SUBFOLDERS:
                src_dir = os.path.join(BACKEND_OLD, item, folder_name)
                dst_dir = os.path.join(UPLOADS_ROOT, item, folder_name)
                if not os.path.isdir(src_dir):
                    continue
                os.makedirs(dst_dir, exist_ok=True)
                for fname in os.listdir(src_dir):
                    src_file = os.path.join(src_dir, fname)
                    dst_file = os.path.join(dst_dir, fname)
                    if os.path.isfile(src_file) and not os.path.exists(dst_file):
                        shutil.copy2(src_file, dst_file)
                        print(f"  Copied: {item}/{folder_name}/{fname}")

        # ── Step 2: register every file under uploads/ in the DB ─────────────
        print("\n── Step 2: register uploads/ files in database ──")
        total_registered = 0

        for trf_dir in sorted(os.listdir(UPLOADS_ROOT)):
            trf_path = os.path.join(UPLOADS_ROOT, trf_dir)
            if not os.path.isdir(trf_path):
                continue

            # Find or skip TRF record
            trf = db.query(TRFRecord).filter(TRFRecord.trf_number == trf_dir).first()
            if not trf:
                print(f"  SKIP {trf_dir}: not in database")
                continue

            for folder_name in SUBFOLDERS:
                folder_path = os.path.join(trf_path, folder_name)
                os.makedirs(folder_path, exist_ok=True)

                # Ensure DB folder record exists
                db_folder = folder_repo.get_by_trf_number_and_name(db, trf_dir, folder_name)
                if not db_folder:
                    db_folder = Folder(name=folder_name, trf_id=trf.id)
                    db.add(db_folder)
                    db.flush()
                    print(f"  Created folder record: {trf_dir}/{folder_name}")

                # Register files in that directory
                for fname in sorted(os.listdir(folder_path)):
                    fpath = os.path.join(folder_path, fname)
                    if not os.path.isfile(fpath):
                        continue

                    existing = file_repo.get_by_folder_and_name(db, db_folder.id, fname)
                    if existing:
                        continue  # already tracked

                    size = os.path.getsize(fpath)
                    new_rec = FileRecord(
                        filename=fname,
                        file_path=os.path.abspath(fpath),
                        folder_id=db_folder.id,
                        size_bytes=size,
                        sharepoint_id=f"local-{trf_dir}-{folder_name}-{fname}".replace(" ", "_"),
                    )
                    db.add(new_rec)
                    db.flush()

                    v1 = FileVersion(
                        file_record_id=new_rec.id,
                        version_number=1,
                        filename=fname,
                        file_path=os.path.abspath(fpath),
                        size_bytes=size,
                        sharepoint_id=new_rec.sharepoint_id,
                    )
                    db.add(v1)
                    total_registered += 1
                    print(f"  Registered: {trf_dir}/{folder_name}/{fname} ({size} bytes)")

        db.commit()
        print(f"\n✅  Migration complete — {total_registered} file(s) registered in database.")

    except Exception as e:
        db.rollback()
        print(f"\n❌  Migration failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate()
