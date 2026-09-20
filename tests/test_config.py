import pytest
from pydantic import ValidationError
from pydantic_settings import SettingsConfigDict

from app.core.config import LOCAL_DATABASE_URL, Settings


class IsolatedSettings(Settings):
    model_config = SettingsConfigDict(env_file=None, extra="ignore")


def test_local_uses_development_database_default(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("APP_ENV", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    settings = IsolatedSettings()
    assert settings.app_env == "local"
    assert settings.database_url == LOCAL_DATABASE_URL


def test_production_requires_explicit_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(ValidationError, match="DATABASE_URL must be explicitly configured"):
        IsolatedSettings()


def test_production_rejects_development_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("DATABASE_URL", LOCAL_DATABASE_URL)
    with pytest.raises(ValidationError, match="DATABASE_URL must be explicitly configured"):
        IsolatedSettings()


def test_production_accepts_configured_database_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("DATABASE_URL", "postgresql+asyncpg://user:pass@db.example:5432/product")
    settings = IsolatedSettings()
    assert settings.database_url == "postgresql+asyncpg://user:pass@db.example:5432/product"
