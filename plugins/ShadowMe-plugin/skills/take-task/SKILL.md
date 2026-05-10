---
description: Take/accept a task from ShadowMe board
---

# Take ShadowMe Task

Take ownership of a task from the ShadowMe board.

Use fetch to POST to: {boardUrl}/api/tasks/{taskId}/take

If an API key is configured (SHADOW_API_KEY), include it in the request header as `x-cc-api-key`.

This changes the task status from "pending" to "in_progress" and updates the shadow avatar status to "busy".

If no task ID provided, first list pending tasks so the user can choose.

After taking, confirm the task is now in progress and show its details.
