# Database Schema: Desktop Implementation (Active)

**Status:** MODIFIABLE | **Role:** System-wide Database Schema

This file defines the active database schema for the Desktop application. It MUST remain a **superset** of `Database_TheCelesteMod.md` to ensure backward compatibility with the Celeste Mod tracking data. 

### Implementation Rules:
- **Migration:** Provide SQL migration code to adapt the schema from `Database_TheCelesteMod.md`.
- **Data Integrity:** Do NOT delete existing data during schema updates.
- **Extensions:** New tables/columns for desktop-only features (e.g., Collections, custom UI metadata) should be added here.
- **Compatible with base schema**: Must backwards be compatible with base schema interface.
