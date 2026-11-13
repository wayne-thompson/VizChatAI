---
name: Provider failure policy
description: Why AI errors are explicit and provider choice is preserved
---

An unsuccessful AI request must not become a canned summary or an apparently successful assistant answer. Do not silently switch to a different provider when the selected provider fails.

**Why:** The user required trustworthy chart-specific analysis rather than generic substitute content. Preserving provider choice also avoids changing where chart data is sent or which service is billed without the user's choice.

**How to apply:** Keep failures actionable and distinct from analysis, retain the uploaded image and saved history, and let the user retry or choose a provider in Account Settings. Do not echo full SDK errors or response headers into logs or the UI.
