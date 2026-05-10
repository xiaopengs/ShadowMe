---
description: Check ShadowMe board status and connection
---

# Check ShadowMe Status

Check if ShadowMe board is reachable and get current status.

Use fetch to call the ShadowMe board API. The board URL is configured in the plugin's environment as SHADOW_BOARD_URL (default: http://localhost:3000).

If an API key is configured (SHADOW_API_KEY), include it in the request header as `x-cc-api-key`.

Call: GET {boardUrl}/api/status

Report:
1. Board availability (reachable or not)
2. Shadow avatar status (online/busy/offline)
3. Task counts (pending, in_progress, completed)
4. API key status (configured or not)
