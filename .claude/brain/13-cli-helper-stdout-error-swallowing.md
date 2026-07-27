# Process Learning: CLI Helper Stdout Error Swallowing Bug

## Problem
CLI helper wrappers (`Sqlite_Go.ts` and `Zip_Go.ts`) were masking all underlying errors and returning generic messages such as `SQLite helper exited with code 1`.

## Root Cause
When executing Go CLI helpers that exit with code 1, the Go helper outputs JSON to stdout containing `{ "success": false, "error": "<detailed message>" }` with empty stderr.

In TypeScript, `executeInternal` contained:
```ts
if (response.exitCode !== 0) {
    try {
        const parsed = JSON.parse(response.stdOut);
        if (parsed && typeof parsed === "object" && !parsed.success) {
            throw new Error(parsed.error || "Operation failed");
        }
    } catch {}
    throw new Error(response.stdErr || `CLI helper exited with code ${response.exitCode}`);
}
```
Because the inner `throw new Error(...)` was inside the `try` block, throwing the parsed error immediately triggered the `catch {}` block of that exact `try-catch`, swallowing the error! Execution then fell through to `throw new Error(response.stdErr || ...)` where `response.stdErr` was empty, replacing every detailed error message with `"SQLite helper exited with code 1"`.

## Fix Pattern
Parse JSON safely outside of the error throw, and extract the parsed error string before constructing the final error:
```ts
let parsed: { success?: boolean; error?: string; [key: string]: unknown } | undefined;
if (response.stdOut && response.stdOut.trim()) {
    try {
        parsed = JSON.parse(response.stdOut.trim());
    } catch {}
}

if (response.exitCode !== 0) {
    const jsonError = parsed && typeof parsed === "object" && typeof parsed.error === "string" ? parsed.error : null;
    const detail = jsonError || response.stdErr?.trim() || response.stdOut?.trim() || `exit code ${response.exitCode}`;
    throw new Error(`Sqlite_Go failed: ${detail}`);
}
```
