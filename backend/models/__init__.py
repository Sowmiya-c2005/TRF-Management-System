# Register all models so SQLAlchemy sees them when create_all() is called
from backend.models.trf_model import TRFRecord  # noqa: F401
from backend.models.user_model import User       # noqa: F401
