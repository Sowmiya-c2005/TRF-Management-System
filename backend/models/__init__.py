# Register all models so SQLAlchemy sees them when create_all() is called
from backend.models.trf_model import TRFRecord  # noqa: F401
from backend.models.user_model import User       # noqa: F401
from backend.models.folder_model import Folder  # noqa: F401
from backend.models.file_model import FileRecord, FileVersion  # noqa: F401
from backend.models.audit_log_model import AuditLog  # noqa: F401
from backend.models.notification_model import Notification  # noqa: F401
from backend.models.trf_assignment_model import TRFEngineerAssignment  # noqa: F401
from backend.models.comment_model import Comment  # noqa: F401
from backend.models.activity_model import Activity  # noqa: F401
