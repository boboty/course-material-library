"""Repeatable local walkthrough data. Never invoked by application startup."""

import argparse
import asyncio
from datetime import date
from urllib.parse import urlsplit
from uuid import UUID, uuid5

from sqlalchemy import delete, insert

from app.core.config import settings
from app.db.session import SessionLocal
from app.models import AudienceType, Course, Customer, Industry, Material, Session, Usage
from app.models.material import material_audience_types, material_courses, material_industries
from app.models.session import session_audiences

NAMESPACE = UUID("ae280e7e-9d40-463d-841b-4c47674e67f5")


def demo_id(name: str) -> UUID:
    return uuid5(NAMESPACE, f"course-material-library/demo-v1/{name}")


INDUSTRIES = [
    ("education", "虚构教育服务"),
    ("manufacturing", "虚构制造业"),
]
AUDIENCES = [
    ("manager", "管理者"),
    ("trainer", "内部讲师"),
    ("newcomer", "新员工"),
]
CUSTOMERS = [
    ("north", "【Demo】星河学习中心", "星河", "education", "星河集团"),
    ("south", "【Demo】星河实践中心", "星河实践", "education", "星河集团"),
    ("other", "【Demo】远山工坊", "远山", "manufacturing", None),
]
COURSES = [
    ("active", "【Demo】案例式教学", "案例教学", "启用"),
    ("inactive", "【Demo】旧版协作课", None, "停用"),
]
MATERIALS = [
    ("story", "【Demo】纸桥协作故事", "故事", "虚构团队用纸桥讨论协作。", "主力"),
    ("case", "【Demo】排班情境案例", "案例", "虚构团队讨论排班选择。", "可用"),
    ("demo", "【Demo】卡片排序演示", "Demo", "用虚构卡片演示优先级排序。", "待更新"),
    ("quote", "【Demo】观察先于判断", "金句", "先观察，再判断。", "可用"),
    ("joke", "【Demo】会说话的白板", "段子", "虚构白板笑话。", "退役"),
    ("industry", "【Demo】虚构工坊流程", "行业素材", "虚构工坊的交接流程。", "可用"),
    ("draft", "【Demo】课后临时想法", None, None, "草稿"),
]
SESSIONS = [
    ("past", "north", "active", "2026-06-10", "一天", ["manager", "trainer"]),
    ("recent", "south", "active", "2026-07-15", "半天", ["trainer"]),
    ("planned", "other", "active", "2026-10-08", "两天", ["newcomer", "manager"]),
]
USAGES = [
    ("past-story", "past", "story", "已用", "好", "讨论积极"),
    ("past-case", "past", "case", "已用", "差", "时间不足"),
    ("past-quote", "past", "quote", "未用", "未评", None),
    ("recent-story", "recent", "story", "已用", "未评", None),
    ("recent-demo", "recent", "demo", "已用", "差", "演示步骤需复核"),
    ("recent-draft", "recent", "draft", "已用", "未评", None),
    ("planned-case", "planned", "case", "计划", "未评", None),
    ("planned-industry", "planned", "industry", "计划", "未评", None),
]


def guard() -> None:
    if settings.app_env.lower() not in {"local", "development"}:
        raise SystemExit("Demo data requires APP_ENV=local or development; production is forbidden")


def target() -> str:
    """Describe the database without its password, so confirming never prints a secret."""
    parts = urlsplit(settings.database_url)
    location = f"{parts.hostname or '?'}:{parts.port}" if parts.port else parts.hostname or "?"
    return (f"{parts.scheme} host={location} "
            f"database={parts.path.lstrip('/') or '?'} user={parts.username or '?'}")


def confirmed(command: str) -> bool:
    prompt = (f"Demo data {command} target: {target()}\n"
              "This clears ALL existing business data in that database, demo rows or not.\n"
              "Type 'yes' to continue; anything else cancels: ")
    try:
        answer = input(prompt)
    except EOFError:
        print()
        answer = ""
    return answer == "yes"


async def run(command: str) -> None:
    async with SessionLocal.begin() as db:
        # Delete children first. One transaction covers clearing and the optional reload.
        await db.execute(delete(session_audiences))
        await db.execute(delete(material_courses))
        await db.execute(delete(material_audience_types))
        await db.execute(delete(material_industries))
        for model in (Usage, Session, Material, Customer, Course, AudienceType, Industry):
            await db.execute(delete(model))
        if command == "clean":
            return

        async def add(model: type, values: list[dict]) -> None:
            await db.execute(insert(model).values(values))

        await add(Industry, [dict(id=demo_id(f"industry/{key}"), name=name)
                             for key, name in INDUSTRIES])
        await add(AudienceType, [dict(id=demo_id(f"audience/{key}"), name=name)
                                 for key, name in AUDIENCES])
        await add(Customer, [dict(id=demo_id(f"customer/{key}"), name=name,
                                  short_name=short, industry_id=demo_id(f"industry/{industry}"),
                                  group_name=group)
                             for key, name, short, industry, group in CUSTOMERS])
        await add(Course, [dict(id=demo_id(f"course/{key}"), name=name,
                                alias=alias, status=status)
                           for key, name, alias, status in COURSES])
        await add(Material, [dict(id=demo_id(f"material/{key}"), title=title,
                                  type=kind, body=body, status=status)
                             for key, title, kind, body, status in MATERIALS])
        await add(Session, [dict(id=demo_id(f"session/{key}"),
                                 customer_id=demo_id(f"customer/{customer}"),
                                 course_id=demo_id(f"course/{course}"),
                                 session_date=date.fromisoformat(day), duration=duration,
                                 audience_description="虚构授课人群")
                            for key, customer, course, day, duration, _ in SESSIONS])
        await db.execute(insert(session_audiences).values([
            dict(session_id=demo_id(f"session/{key}"),
                 audience_type_id=demo_id(f"audience/{audience}"))
            for key, *_, audiences in SESSIONS for audience in audiences
        ]))
        await add(Usage, [dict(id=demo_id(f"usage/{key}"),
                               session_id=demo_id(f"session/{session}"),
                               material_id=demo_id(f"material/{material}"),
                               status=status, effect=effect, reaction=reaction)
                          for key, session, material, status, effect, reaction in USAGES])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["seed", "clean"])
    args = parser.parse_args()
    guard()
    if not confirmed(args.command):
        print(f"Demo data {args.command} cancelled; no data changed")
        raise SystemExit(0)
    asyncio.run(run(args.command))
    print(f"Demo data {args.command} complete")
