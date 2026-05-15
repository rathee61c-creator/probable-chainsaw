# Guesthouse Room Request App

This is a lightweight browser app for a seven-room guesthouse. Guests submit room/stay requests on `index.html`, and admins review, approve/reject, and allot rooms on `admin.html`.

## Run locally

```bash
python3 -m http.server 4173
```

Then open:

- Guest request page: <http://127.0.0.1:4173/index.html>
- Admin allotment page: <http://127.0.0.1:4173/admin.html>

## Capturing screenshots

Do **not** use `npx playwright install chromium` in restricted environments. That command tries to download Playwright's own Chromium browser from the Playwright CDN, and some proxies block that CDN with a `403 Domain forbidden` response.

Use the local Chrome channel instead:

```bash
scripts/capture-screenshots.sh
```

The script starts a local server, runs Playwright with `--channel chrome`, and writes:

- `/tmp/guest-request-page.png`
- `/tmp/admin-allotment-page.png`

If Chrome is not installed, the script prints the installation command to run before taking screenshots.
