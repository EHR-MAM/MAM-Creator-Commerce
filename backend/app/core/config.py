from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "EHR Creator Commerce Platform"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str  # postgresql+asyncpg://user:pass@host/db

    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000"]

    # Commission rates (defaults, can be overridden per campaign)
    DEFAULT_CREATOR_COMMISSION_RATE: float = 0.18   # 18%
    DEFAULT_PLATFORM_COMMISSION_RATE: float = 0.12  # 12%

    # Frontend base URL (for tracking link redirects)
    FRONTEND_URL: str = "http://localhost:3000"

    # WhatsApp (Twilio or Meta Business API)
    WHATSAPP_API_KEY: str = ""
    WHATSAPP_FROM_NUMBER: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
