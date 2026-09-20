from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

LOCAL_DATABASE_URL = "postgresql+asyncpg://benyan:benyan_local@localhost:5432/benyan"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "local"
    service_name: str = "benyan-webapp-starter"
    log_json: bool = False
    database_url: str = LOCAL_DATABASE_URL

    @model_validator(mode="after")
    def require_production_database_url(self) -> "Settings":
        if self.app_env == "production" and self.database_url == LOCAL_DATABASE_URL:
            raise ValueError("DATABASE_URL must be explicitly configured in production")
        return self


settings = Settings()
