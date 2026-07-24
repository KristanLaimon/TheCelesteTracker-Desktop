# Second Brain Convention

Started 2026-07-24.

## What goes where

- **CLAUDE.md**: business rules only. Celeste domain (save file shape, mod
  structure, campaign/chapter/lobby nesting), coding stack/conventions,
  architecture (DI, Go CLI helpers). Anything a fresh session needs to not
  re-derive Celeste-specific facts.
- **`.claude/brain/NN-name.md`**: everything else worth remembering that
  ISN'T a business rule. Process learnings, dead ends tried, why an approach
  got picked over another, non-domain gotchas (tooling quirks, environment
  weirdness, API rate-limit behavior discovered by trial). Numbered by
  creation order, two-digit prefix, kebab-case name.

## Workflow going forward

After PLAN -> EXECUTE on any non-trivial task:
1. Check if anything learned is a durable business rule -> fold into
   CLAUDE.md (condensed, not verbose).
2. Check if anything learned is a process/meta learning, not domain -> new
   numbered thought file here.
3. Don't write a thought file for trivial/obvious tasks. Same bar as
   memory: would a fresh session actually need this, or does it decay by
   next week?

Ponytail applies here too: no thought file "just in case", only when there's
an actual non-obvious learning.
