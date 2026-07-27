# Kysely Joined Table `selectAll()` Column Collision

## Context & Observation
When executing Kysely queries with `.leftJoin()` or `.innerJoin()` across tables that share identical column names (such as `id`), calling `.selectAll()` without qualification generates `SELECT *` in SQL.
SQLite returns multiple columns with the name `id` in the result row. Drivers and row parsers map these to a single JavaScript object key, causing the right-most table's column (e.g. `Campaigns.id` integer `5`) to overwrite the primary table's column (e.g. `GameSessions.id` string UUID `"48716a85-..."`).

## Durable Pattern
- When writing table queries with joins in Kysely, always qualify `selectAll()` to the primary target table: `.selectAll("GameSessions")`.
- When filtering by save slot, `SaveDatas.slot_number` represents the 0-indexed save slot number (e.g., 0, 1, 2...), while `SaveDatas.id` / `Campaigns.save_data_id` represents the internal database primary key. Joining `SaveDatas` allows filtering on `SaveDatas.slot_number`.
