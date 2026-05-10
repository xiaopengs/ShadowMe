---
description: Create a new task on ShadowMe board
---

# Create ShadowMe Task

Create a new task on the ShadowMe collaboration board.

Use fetch to POST to: {boardUrl}/api/tasks

If an API key is configured (SHADOW_API_KEY), include it in the request header as `x-cc-api-key`.

Request body:
```json
{
  "title": "Task title",
  "type": "technical_issue",
  "priority": "medium",
  "description": "Task description",
  "tags": ["tag1"],
  "createdBy": "Claude"
}
```

Valid types: technical_issue, design_doc, code_review, other
Valid priorities: low, medium, high, urgent

After creation, show the task ID and details.
