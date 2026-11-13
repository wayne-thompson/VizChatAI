---
name: Runtime secret inventory
description: A Replit environment inventory limitation relevant to provider diagnostics
---

Do not conclude that a provider credential is missing from a running app solely because the managed-secret inventory reports it absent.

**Why:** The inventory reported OpenAI and xAI keys absent while a presence-only check in the development process found both variables set. Production logs also demonstrated that OpenAI requests reached the provider. The inventory did not fully describe the effective runtime environment.

**How to apply:** Recheck the inventory for the relevant environment, compare development runtime presence without printing values, and use sanitized production logs as evidence of effective access. Do not assume the workspace and deployed artifact have identical bindings.
