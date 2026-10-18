# Admin Panel performance test (k6)

The repository already includes `scripts/admin-callable-load.js` and a safe read-only `admin-list-load-payload.json` for the `adminList` callable. It applies the requested ramp: 0→10 VUs (30s), hold 10 (60s), 10→25 (30s), hold 25 (180s), with P95 ≤ 3000ms and unexpected error rate ≤ 1%.

Run from the Admin Panel project root in PowerShell, against the Firebase Emulator or an explicitly approved staging environment only. Never use production for this load test. First start the Firebase emulators and the test web/functions environment using the project's approved procedure. Keep the token private; do not paste it in logs, documents, screenshots, or shell transcripts.

```powershell
$env:ADMIN_CALLABLE_URL = 'http://127.0.0.1:5001/demo-roshita-f02/us-central1/adminList'
$env:ADMIN_ID_TOKEN = '<temporary emulator ID token>'
$env:ADMIN_PAYLOAD_FILE = '.\scripts\admin-list-load-payload.json'
$env:ADMIN_COMMAND_NAME = 'adminList'
k6 run .\scripts\admin-callable-load.js --summary-export .\test-results\admin-list-load-summary.json
Remove-Item Env:ADMIN_ID_TOKEN
```

The sample payload performs a list query and does not create or update records. Before the run, confirm the URL points to the emulator (`127.0.0.1:5001`) or the approved staging host, the token belongs to a test admin, and the test dataset contains no real personal data. A successful k6 process exit is not by itself proof of functional correctness: inspect P95, `unexpected_errors`, and the application's own logs, then record observed results in the test register.

The current load script measures one callable per run; execute it separately for each eligible read/command endpoint. Do not load-test mutation endpoints until each virtual user has a dedicated seeded test record and cleanup plan.
