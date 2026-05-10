---
description: List all tasks on ShadowMe board
---

# List ShadowMe Tasks

Fetch and display all tasks from the ShadowMe board.

Use fetch to call: GET {boardUrl}/api/tasks?status={status}

Supported status filters: pending, in_progress, completed, closed

If an API key is configured (SHADOW_API_KEY), include it in the request header as `x-cc-api-key`.

Display tasks organized by status. For each task show:
- ID (first 8 chars)
- Title
- Type and Priority
- Created by
