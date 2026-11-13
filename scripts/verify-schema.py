"""
Verifies the Brewmate schema and the SQL statements used by the app services
against a real SQLite engine (temporary file, deleted afterwards).

The SQL here is a mirror of the strings in `src/services/*.ts`; run this after
changing the schema or a query. Usage: python scripts/verify-schema.py
"""

from __future__ import annotations

import os
import re
import sqlite3
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCHEMA_FILE = os.path.join(ROOT, "src", "database", "schema.ts")

RATING_SUM = (
    "(COALESCE(r.acidity, 0) + COALESCE(r.sweetness, 0) + COALESCE(r.bitterness, 0) + "
    "COALESCE(r.body, 0) + COALESCE(r.clarity, 0) + COALESCE(r.aftertaste, 0))"
)
RATING_COUNT = (
    "((r.acidity IS NOT NULL) + (r.sweetness IS NOT NULL) + (r.bitterness IS NOT NULL) + "
    "(r.body IS NOT NULL) + (r.clarity IS NOT NULL) + (r.aftertaste IS NOT NULL))"
)
RATING_AVG = f"ROUND({RATING_SUM} * 1.0 / NULLIF({RATING_COUNT}, 0), 2)"

SESSION_SELECT = f"""
  SELECT s.id, s.brewed_at, s.coffee_bean_id, s.bean_name_snapshot, s.recipe_id,
         s.recipe_name_snapshot, s.grinder_profile_id, s.grinder_name_snapshot,
         s.grind_setting, s.coffee_dose_g, s.ratio, s.water_temp_c, s.total_water_g,
         s.bloom_water_g, s.total_time_s, s.notes, s.created_at,
         r.acidity, r.sweetness, r.bitterness, r.body, r.clarity, r.aftertaste,
         {RATING_AVG} AS average_rating
    FROM brew_sessions s
    LEFT JOIN brew_session_ratings r ON r.session_id = s.id
"""

failures: list[str] = []


def check(label: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok  {label}")
    else:
        failures.append(f"{label} {detail}".strip())
        print(f"  FAIL {label} {detail}")


def load_schema() -> str:
    with open(SCHEMA_FILE, "r", encoding="utf-8") as handle:
        source = handle.read()
    match = re.search(r"export const SCHEMA_V1 = `(.+?)`;", source, re.S)
    if not match:
        raise SystemExit("Could not find SCHEMA_V1 in schema.ts")
    return match.group(1)


def main() -> int:
    schema = load_schema()
    handle, path = tempfile.mkstemp(suffix=".db")
    os.close(handle)
    db = sqlite3.connect(path)
    db.row_factory = sqlite3.Row

    try:
        db.executescript(schema)
        db.execute("PRAGMA foreign_keys = ON")
        print("schema")

        tables = {
            row["name"]
            for row in db.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
        }
        expected = {
            "grinder_profiles",
            "coffee_beans",
            "brew_recipes",
            "brew_pour_steps",
            "brew_sessions",
            "brew_session_steps",
            "brew_session_ratings",
            "grind_settings",
            "user_preferences",
        }
        check("all nine tables exist", expected <= tables, str(expected - tables))

        indexes = {
            row["name"]
            for row in db.execute("SELECT name FROM sqlite_master WHERE type = 'index'")
        }
        check(
            "session and step indexes exist",
            {"idx_sessions_brewed_at", "idx_sessions_bean", "idx_pour_steps_recipe"}
            <= indexes,
        )

        # ---------------------------------------------------------------- seed
        now = "2026-11-13T08:00:00.000Z"
        db.execute(
            """INSERT INTO grinder_profiles (
                 id, name, brand, model, clicks_per_rotation, setting_unit, microns_per_click,
                 macro_steps_per_rotation, reference_min, reference_max, reference_note,
                 preferred_min, preferred_max, is_builtin, notes, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                "grinder-s5",
                "Chestnut S5 Pro",
                "TIMEMORE",
                "timemore-s5-pro",
                90,
                "rotations",
                15,
                None,
                5.0,
                8.0,
                "reference",
                None,
                None,
                1,
                None,
                now,
                now,
            ),
        )
        db.execute(
            """INSERT INTO coffee_beans (
                 id, name, origin, country, region, farm, variety, process, roast_level,
                 roast_date, tasting_notes, notes, is_archived, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)""",
            (
                "bean-1",
                "Guji Hambela",
                "Ethiopia",
                "Ethiopia",
                "Guji",
                None,
                "Heirloom",
                "Washed",
                "Light",
                "2026-11-01",
                "Jasmine",
                None,
                now,
                now,
            ),
        )
        db.execute(
            """INSERT INTO brew_recipes (
                 id, name, description, coffee_dose_g, ratio, total_water_g, water_temp_c,
                 bloom_multiplier, bloom_duration_s, grinder_profile_id, grind_setting,
                 target_time_s, notes, is_favorite, is_starter, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                "recipe-1",
                "Classic 4-Pour",
                None,
                15,
                16,
                240,
                92,
                3,
                45,
                "grinder-s5",
                6.5,
                195,
                None,
                1,
                1,
                now,
                now,
            ),
        )
        for order, (label, kind, target, duration) in enumerate(
            [
                ("Bloom", "bloom", 45, 45),
                ("First pour", "pour", 120, 30),
                ("Second pour", "pour", 190, 40),
                ("Final pour", "pour", 240, 35),
                ("Drawdown", "drawdown", 240, 45),
            ]
        ):
            db.execute(
                """INSERT INTO brew_pour_steps
                     (id, recipe_id, step_order, label, kind, target_water_g, duration_s)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (f"step-{order}", "recipe-1", order, label, kind, target, duration),
            )

        db.execute(
            """INSERT INTO brew_sessions (
                 id, brewed_at, coffee_bean_id, bean_name_snapshot, recipe_id,
                 recipe_name_snapshot, grinder_profile_id, grinder_name_snapshot, grind_setting,
                 coffee_dose_g, ratio, water_temp_c, total_water_g, bloom_water_g, total_time_s,
                 notes, created_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                "session-1",
                now,
                "bean-1",
                "Guji Hambela",
                "recipe-1",
                "Classic 4-Pour",
                "grinder-s5",
                "Chestnut S5 Pro",
                6.5,
                15,
                16,
                92,
                240,
                45,
                195,
                "Sweet and clean",
                now,
            ),
        )
        db.execute(
            """INSERT INTO brew_session_steps
                 (id, session_id, step_order, label, kind, target_water_g, duration_s)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            ("sstep-1", "session-1", 0, "Bloom", "bloom", 45, 45),
        )
        db.execute(
            """INSERT INTO brew_session_ratings
                 (session_id, acidity, sweetness, bitterness, body, clarity, aftertaste)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            ("session-1", 4, 5, 2, 3, 5, 4),
        )
        db.execute(
            """INSERT INTO grind_settings
                 (id, grinder_profile_id, coffee_bean_id, recipe_id, setting_value, clicks, notes, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            ("grind-1", "grinder-s5", "bean-1", "recipe-1", 6.5, 585, None, now),
        )

        print("queries")
        session = db.execute(
            SESSION_SELECT + " WHERE s.id = ?", ("session-1",)
        ).fetchone()
        check("session query returns the row", session is not None)
        check(
            "average rating is computed",
            session["average_rating"] == 3.83,
            str(session["average_rating"]),
        )

        totals = db.execute(
            """SELECT COUNT(*) AS count, SUM(coffee_dose_g) AS coffee,
                      SUM(total_water_g) AS water, MAX(brewed_at) AS last
                 FROM brew_sessions"""
        ).fetchone()
        check("stats totals", totals["count"] == 1 and totals["coffee"] == 15)
        check("stats last brew", totals["last"] == now)

        ratings = db.execute(
            f"""SELECT SUM({RATING_SUM}) AS sum, SUM({RATING_COUNT}) AS count
                  FROM brew_session_ratings r"""
        ).fetchone()
        check("stats ratings aggregate", ratings["sum"] == 23 and ratings["count"] == 6)

        favourite = db.execute(
            """SELECT bean_name_snapshot AS name, COUNT(*) AS count
                 FROM brew_sessions
                WHERE bean_name_snapshot IS NOT NULL
                GROUP BY COALESCE(coffee_bean_id, bean_name_snapshot)
                ORDER BY COUNT(*) DESC, name COLLATE NOCASE ASC
                LIMIT 1"""
        ).fetchone()
        check("favourite bean", favourite["name"] == "Guji Hambela")

        best = db.execute(
            f"""SELECT s.id AS id,
                       COALESCE(s.bean_name_snapshot, s.recipe_name_snapshot, 'Brew') AS label,
                       {RATING_AVG} AS rating,
                       s.brewed_at AS brewed_at
                  FROM brew_sessions s
                  JOIN brew_session_ratings r ON r.session_id = s.id
                 GROUP BY s.id
                HAVING rating IS NOT NULL
                 ORDER BY rating DESC, s.brewed_at DESC
                 LIMIT 1"""
        ).fetchone()
        check("best session query", best is not None and best["rating"] == 3.83)

        grind = db.execute(
            """SELECT gs.id, gs.setting_value, gp.name AS grinder_name, cb.name AS bean_name,
                      br.name AS recipe_name
                 FROM grind_settings gs
                 JOIN grinder_profiles gp ON gp.id = gs.grinder_profile_id
                 LEFT JOIN coffee_beans cb ON cb.id = gs.coffee_bean_id
                 LEFT JOIN brew_recipes br ON br.id = gs.recipe_id
                ORDER BY gs.created_at DESC"""
        ).fetchone()
        check(
            "grind setting joins",
            grind["grinder_name"] == "Chestnut S5 Pro" and grind["bean_name"] == "Guji Hambela",
        )

        pref = db.execute(
            """INSERT INTO user_preferences (key, value, updated_at) VALUES (?, ?, ?)
               ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at""",
            ("themeMode", "dark", now),
        )
        check("preference upsert works", pref.rowcount == 1)

        print("cascades")
        db.execute("DELETE FROM brew_recipes WHERE id = 'recipe-1'")
        check(
            "recipe steps cascade",
            db.execute("SELECT COUNT(*) FROM brew_pour_steps").fetchone()[0] == 0,
        )
        session = db.execute(SESSION_SELECT + " WHERE s.id = ?", ("session-1",)).fetchone()
        check("session survives recipe delete", session is not None)
        check("recipe reference nulled", session["recipe_id"] is None)
        check("recipe name snapshot kept", session["recipe_name_snapshot"] == "Classic 4-Pour")

        db.execute("DELETE FROM coffee_beans WHERE id = 'bean-1'")
        session = db.execute(SESSION_SELECT + " WHERE s.id = ?", ("session-1",)).fetchone()
        check("bean reference nulled", session["coffee_bean_id"] is None)
        check("bean snapshot kept", session["bean_name_snapshot"] == "Guji Hambela")
        check(
            "grind setting bean reference nulled",
            db.execute("SELECT coffee_bean_id FROM grind_settings").fetchone()[0] is None,
        )

        db.execute("DELETE FROM grinder_profiles WHERE id = 'grinder-s5'")
        check(
            "grinder settings cascade",
            db.execute("SELECT COUNT(*) FROM grind_settings").fetchone()[0] == 0,
        )
        session = db.execute(SESSION_SELECT + " WHERE s.id = ?", ("session-1",)).fetchone()
        check("grinder reference nulled", session["grinder_profile_id"] is None)
        check("grinder snapshot kept", session["grinder_name_snapshot"] == "Chestnut S5 Pro")

        db.execute("DELETE FROM brew_sessions WHERE id = 'session-1'")
        check(
            "session children cascade",
            db.execute("SELECT COUNT(*) FROM brew_session_ratings").fetchone()[0] == 0
            and db.execute("SELECT COUNT(*) FROM brew_session_steps").fetchone()[0] == 0,
        )

        db.execute("PRAGMA user_version = 1")
        check(
            "user_version migration marker",
            db.execute("PRAGMA user_version").fetchone()[0] == 1,
        )
    finally:
        db.close()
        os.remove(path)

    print()
    if failures:
        print(f"{len(failures)} check(s) failed")
        for failure in failures:
            print(f" - {failure}")
        return 1
    print("All schema checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
