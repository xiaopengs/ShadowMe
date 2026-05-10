---
description: Complete a task on ShadowMe board with results
---

# Complete ShadowMe Task

Mark a task as completed on the ShadowMe board and submit results.

Use fetch to POST to: {boardUrl}/api/tasks/{taskId}/complete

If an API key is configured (SHADOW_API_KEY), include it in the request header as `x-cc-api-key`.

Request body:
```json
{
  "result": {
    "type": "text",
    "summary": "Description of what was done",
    "url": "https://optional-link.com"
  }
}
```

Valid result types: merge_request, commit, document, text

This changes the task status from "in_progress" to "completed" and updates the shadow avatar status back to "online".

After completion, show confirmation and task status.
