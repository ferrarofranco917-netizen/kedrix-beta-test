# Kedrix duplicate repo starter kit

This package is meant for a parallel repo / parallel Cloudflare Pages deploy, so you can test a faster beta-access flow without touching production.

## Included files

- `start.html` → minimal landing that collects `name + email`, calls Apps Script, then redirects straight into the app.
- `install-banner.js` → install prompt logic for Android/Desktop plus iPhone/iPad fallback instructions.
- `install-banner.css` → styling for the install banner.

## Recommended rollout

### 1) Duplicate the repo

Create a separate repo, for example:

- `kedrix-start-test`
- `kedrix-landing-v2`

Do **not** modify the production repo first.

### 2) Deploy a parallel Cloudflare Pages project

Keep production live.
Deploy the duplicate repo to a new Pages URL, for example:

- `kedrix-landing-v2.pages.dev`

### 3) Add the new landing

Put `start.html` in the root of the duplicate repo, or rename it to:

- `beta.html`
- `start/index.html`
- `index.html` if the duplicate repo is only for this test

## Configure `start.html`

Inside `start.html`, update:

- `APPS_SCRIPT_URL`
- `APP_URL`

Example:

```js
const CONFIG = {
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/XXXXXXXX/exec',
  APP_URL: 'https://beta.kedrix.tech',
  REDIRECT_PARAM_CANDIDATES: ['id', 'userId', 'testerId'],
};
```

## Expected Apps Script response

The landing expects JSON with one of these keys:

- `id`
- `userId`
- `testerId`

Valid examples:

```json
{ "id": "abc123" }
```

```json
{ "userId": "abc123" }
```

```json
{ "data": { "testerId": "abc123" } }
```

## Redirect behavior

After success, the landing redirects to:

```txt
https://beta.kedrix.tech?id=RETURNED_ID
```

If your app expects a different query parameter, change `buildRedirectUrl()`.

## Install banner integration

### Add CSS

In the main app HTML (not on the landing), include:

```html
<link rel="stylesheet" href="/install-banner.css" />
```

### Add JS

Before `</body>` in the app HTML, include:

```html
<script src="/install-banner.js"></script>
```

## Important PWA note

The install prompt only appears automatically on supported browsers if the app already has:

- a valid `manifest.webmanifest`
- a service worker
- HTTPS
- installable metadata and icons

If those are already present in Kedrix, the banner will work.
If not, Android/Desktop install prompts will not appear yet, but the iPhone/iPad instructions still can.

## Safe test flow

Use the duplicate landing only with new testers.
Keep the current landing unchanged.
When conversion is better and the flow is stable, replace production.

## Suggested first test

Compare:

- current landing
- direct-access landing (`start.html`)

What you want to measure:

- submit rate
- completed entries
- app opens
- first session completion
