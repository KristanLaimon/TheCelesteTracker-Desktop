# 10. Go CLI Batch Zip Scanning Performance

## Context & Problem
When scanning 100-300 installed Celeste mods, executing individual `zip_utils` CLI calls (`Zip_Go.readTextFile`, `Zip_Go.list`) per file read spawned thousands of child processes via `os.execCommand`. On Windows, launching an OS process takes 15-30ms, causing initial mod scans to take several minutes.

## Key Learnings
1. **Process Spawn Ceiling**: Single-file CLI wrappers work great for one-off operations, but loop iterations over thousands of files across zip archives hit severe process spawning overhead.
2. **Single-Pass Goroutine Worker Pools**: By moving directory traversal and zip indexing directly into Go (`zip scan-mods --dir <path> --threads <N>`) and leveraging `runtime.NumCPU()` goroutines, the overhead of 10,000 process launches is reduced to 1 single process launch.
3. **In-Memory Zip Indexing**: Go's `archive/zip.OpenReader` reads zip central directory headers without extracting full zip content, scanning 300+ mods and extracting metadata, dialog, and map files in under 300ms.
