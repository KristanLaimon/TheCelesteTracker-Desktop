# Sqlite Go Engine Architecture

## Overview

`Sqlite` is a pure-Go CLI query execution engine built on top of `github.com/glebarez/go-sqlite` (modernc.org/sqlite, CGO-free).

It provides a lightweight, CGO-free, cross-platform SQLite database engine that executes SQL queries via JSON payloads passed on `stdin`.

---

## Features & Protocol

1. **Stdin JSON Query Protocol**:
   - Accepts a JSON object over `stdin` with `sql` string and `params` array (`?` position bound parameters):
     ```json
     {
       "sql": "SELECT * FROM campaigns WHERE name = ?;",
       "params": ["Strawberry Jam"]
     }
     ```

2. **DML & DDL Support**:
   - Executes `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `CREATE TABLE`, etc.
   - For mutation queries (`INSERT`, `UPDATE`, `DELETE`), returns `changes` (affected rows) and `lastInsertRowId`.

3. **CGO-Free Cross-Compilation**:
   - Uses `modernc.org/sqlite` compiled into standalone native executables for Windows, Linux, and macOS without requiring a C compiler toolchain.
