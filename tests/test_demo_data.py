import asyncio
import os
import subprocess
from uuid import uuid4

import pytest
from sqlalchemy import func, insert, select
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import create_async_engine

from app.models import AudienceType, Course, Customer, Industry, Material, Session, Usage
from app.models.session import session_audiences
from scripts.demo_data import AUDIENCES, COURSES, CUSTOMERS, INDUSTRIES, MATERIALS, SESSIONS, USAGES
from tests.conftest import TEST_DATABASE_URL

TABLES = (Industry, AudienceType, Customer, Course, Material, Session, Usage)


def command(action: str, *, app_env: str = "local", url: str = TEST_DATABASE_URL,
            answer: str | None = "yes") -> subprocess.CompletedProcess[str]:
    env = {**os.environ, "APP_ENV": app_env, "DATABASE_URL": url}
    return subprocess.run([".venv/bin/python", "-m", "scripts.demo_data", action],
                          capture_output=True, text=True, env=env, check=False,
                          input=f"{answer}\n" if answer is not None else "")


async def table_counts() -> list[int]:
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with engine.connect() as db:
            counts = [int(await db.scalar(select(func.count()).select_from(model)) or 0)
                      for model in TABLES]
            counts.append(int(await db.scalar(
                select(func.count()).select_from(session_audiences)
            ) or 0))
            return counts
    finally:
        await engine.dispose()


async def add_preexisting_rows() -> None:
    engine = create_async_engine(TEST_DATABASE_URL)
    try:
        async with engine.begin() as db:
            await db.execute(insert(Industry).values(id=uuid4(), name="虚构教育服务"))
            await db.execute(insert(AudienceType).values(id=uuid4(), name="管理者"))
            await db.execute(insert(Material).values(id=uuid4(), title="本地旧素材",
                                                     type="故事", body="旧内容。"))
    finally:
        await engine.dispose()


def test_demo_replaces_all_business_data_and_clean_empties_it() -> None:
    assert command("clean").returncode == 0
    asyncio.run(add_preexisting_rows())
    expected = [len(INDUSTRIES), len(AUDIENCES), len(CUSTOMERS), len(COURSES),
                len(MATERIALS), len(SESSIONS), len(USAGES),
                sum(len(row[-1]) for row in SESSIONS)]
    for _ in range(2):
        result = command("seed")
        assert result.returncode == 0, result.stderr
        assert asyncio.run(table_counts()) == expected
    for _ in range(2):
        result = command("clean")
        assert result.returncode == 0, result.stderr
        assert asyncio.run(table_counts()) == [0] * len(expected)


def test_demo_rejects_production() -> None:
    production = command("seed", app_env="production")
    assert production.returncode != 0
    assert "production is forbidden" in production.stderr


def test_demo_shows_target_and_needs_confirmation_for_any_host() -> None:
    test_port = make_url(TEST_DATABASE_URL).port or 5432
    remote = command("seed", url=TEST_DATABASE_URL.replace("localhost", "db.example.com"),
                     answer="no")
    assert remote.returncode == 0, remote.stderr
    assert "loopback" not in remote.stderr
    assert f"host=db.example.com:{test_port}" in remote.stdout
    assert "database=benyan_test" in remote.stdout
    assert "benyan_local" not in remote.stdout
    assert "clears ALL existing business data" in remote.stdout
    assert "cancelled; no data changed" in remote.stdout


def test_cancelling_changes_no_data() -> None:
    assert command("clean").returncode == 0
    asyncio.run(add_preexisting_rows())
    before = asyncio.run(table_counts())
    for action in ("seed", "clean"):
        for answer in (" yes", "yes ", "Yes", "YES", "", None, "no", "y"):
            result = command(action, answer=answer)
            assert result.returncode == 0, result.stderr
            assert "cancelled; no data changed" in result.stdout
            assert asyncio.run(table_counts()) == before


@pytest.mark.parametrize("action", ["seed", "clean"])
@pytest.mark.parametrize("answer", [" yes", "yes ", "Yes", "YES", "", None])
def test_cancelling_does_not_start_database_transaction(action: str,
                                                        answer: str | None) -> None:
    unreachable_url = make_url(TEST_DATABASE_URL).set(
        host="127.0.0.1", port=1
    ).render_as_string(hide_password=False)
    result = command(action, url=unreachable_url, answer=answer)
    assert result.returncode == 0, result.stderr
    assert "cancelled; no data changed" in result.stdout
