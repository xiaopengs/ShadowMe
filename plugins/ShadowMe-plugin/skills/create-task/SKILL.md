---
description: Create a new task on ShadowMe board
---

# Create ShadowMe Task

Create a new task on the ShadowMe collaboration board.

Get task details from user:
1. Title (required)
2. Type (technical_issue, design_doc, code_review, other)
3. Priority (low, medium, high, urgent)
4. Description
5. Tags (optional, comma-separated)
6. Created by (optional, default to user)

Use fetch tool to POST to ShadowMe board API to create the task.

After creation, show the task details including the task ID.
