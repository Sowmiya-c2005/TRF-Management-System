"""End-to-end test for configurable storage service. Run: python test_storage_api.py"""
import sys, os, shutil
sys.path.insert(0, ".")

from backend.database.init_db import SessionLocal
from backend.services.storage_service import (
    get_config,
    set_storage_root,
    get_storage_root,
)

print("\n=== Configurable Storage Service Verification ===\n")

db = SessionLocal()
try:
    # 1. Get current config
    cfg = get_config(db)
    print(f"GET storage config:")
    print(f"  active_root  = {cfg.get('active_root')}")
    print(f"  is_custom    = {cfg.get('is_custom')}")
    print(f"  env_default  = {cfg.get('env_default')}")

    # 2. Set custom path
    test_path = os.path.abspath("test_storage_tmp")
    c2 = set_storage_root(db, test_path)
    print(f"\nSet custom path: active={c2.get('active_root')}")
    assert os.path.isdir(test_path), "Custom dir was not created!"
    print(f"  Directory created on disk: YES")

    # 3. Reset to default
    c3 = set_storage_root(db, "")
    print(f"\nReset to default: is_custom={c3.get('is_custom')}")

    # Cleanup
    if os.path.isdir(test_path):
        shutil.rmtree(test_path)
        print(f"  Cleaned up test dir.")

    print("\nAll storage API tests PASSED!")
finally:
    db.close()
