---
name: Managed AI provisioning
description: Distinguishing Replit-managed AI setup from the ordinary connector catalogue
---

Replit AI Integrations are separate from ordinary Connectors. Do not send the user to the ordinary connector picker to activate managed OpenAI, or interpret an empty connector search as proof the platform does not support it.

**Why:** Replit's official documentation distinguishes managed AI services, provisioned through Agent, from external-service Connectors. Searching the connector catalogue did not expose the managed AI provisioning action.

**How to apply:** Use an explicitly available managed-AI provisioning action and confirm the service supplied its credentials and endpoint. If that action is unavailable, report a provisioning blocker rather than inventing an integration identifier, credentials, or a completed switch.
