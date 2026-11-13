---
name: OpenAI billing choice
description: The approved billing path for this app's OpenAI requests
---

Use Replit-managed OpenAI billing for this application rather than its direct OpenAI API account.

**Why:** The user explicitly approved switching to Replit-managed OpenAI after the direct API account exhausted its credits.

**How to apply:** Use the managed credentials and endpoint provisioned by Replit. Do not silently fall back to the direct account if managed configuration is missing; expose a setup error instead.
