import os
from collections.abc import AsyncIterator, Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.db.session import get_session
from app.main import app

TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", "postgresql+asyncpg://benyan:benyan_local@localhost:5432/benyan_test"
)
assert TEST_DATABASE_URL.endswith("/benyan_test"), "tests must never target a non-test database"


def test_engine():  # type: ignore[no-untyped-def]
    """测试引擎使用 NullPool：每个会话独立连接，测试结束即释放，无需跨事件循环清理。"""
    return create_async_engine(TEST_DATABASE_URL, poolclass=NullPool)


@pytest.fixture
def client() -> Iterator[TestClient]:
    engine = test_engine()
    maker = async_sessionmaker(engine, expire_on_commit=False)

    async def test_session() -> AsyncIterator[AsyncSession]:
        async with maker() as session:
            yield session

    app.dependency_overrides[get_session] = test_session
    with TestClient(app) as result:
        yield result
    app.dependency_overrides.clear()
