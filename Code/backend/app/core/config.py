import secrets
from typing import List, Optional, Union

from pydantic import AnyHttpUrl, field_validator, ValidationInfo
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8080,http://127.0.0.1:8080"

    @property
    def BACKEND_CORS_ORIGINS(self) -> List[str]:
        return [i.strip() for i in self.CORS_ORIGINS.split(",")]

    PROJECT_NAME: str = "Address Agent Central Backend"

    # Database
    DATABASE_TYPE: str = "postgresql"  # Options: sqlite, postgresql
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "address_agent"
    POSTGRES_PORT: int = 5432
    SQLITE_DATABASE_URI: str = "sqlite:///./app.db"

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        if self.DATABASE_TYPE == "postgresql":
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        else:
            return self.SQLITE_DATABASE_URI

    # External APIs
    IPGEOLOCATION_API_KEY: Optional[str] = None

    model_config = {
        "env_file": ".env"
    }


settings = Settings()