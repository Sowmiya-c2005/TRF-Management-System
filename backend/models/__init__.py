# Register all models so SQLAlchemy sees them when create_all() is called
from backend.models.trf_model import TRFRecord  # noqa: F401
from backend.models.user_model import User       # noqa: F401
from backend.models.folder_model import Folder  # noqa: F401
from backend.models.file_model import FileRecord  # noqa: F401
from backend.models.audit_log_model import AuditLog  # noqa: F401
from backend.models.notification_model import Notification  # noqa: F401
