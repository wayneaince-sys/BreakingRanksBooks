# BreakingRanksBooks

The author site for Wayne A. Ince — three books, a 30-second video, free first chapter, newsletter signup wired to Mailchimp.

**Live site:** https://wayneaince-sys.github.io/breakingranksbooks/

## Pages

- **`index.html`** — main landing page (hero, books, about, video, newsletter, footer)
- **`video.html`** — embeddable 30-second spot with Wayne's voiceover
- **`welcome.html`** — post-signup thank-you with Chapter 1 PDF reader

## Deployment

This is a 100% static site. To deploy on GitHub Pages:

1. Push contents of this folder to the `main` branch of any repo
2. Go to repo → Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/ (root)`
3. Wait ~1 minute for the first build

For a custom domain (e.g. `breakingranksbooks.com`), add it under the same Pages settings and create a `CNAME` record at your registrar pointing to `wayneaince-sys.github.io`.

## Editing the site

Most text and all the book data lives in **`data.jsx`** — edit there and the page picks it up.

For deeper changes (layout, sections, styling), see **`components.jsx`** and the `<style>` block inside `index.html`.

## Mailchimp

The newsletter form posts to Mailchimp. Configuration values live near the top of the `Newsletter` function in **`components.jsx`** (search for `MAILCHIMP_ACTION`). See **`MAILCHIMP_SETUP.md`** for full instructions.

To change where confirmed subscribers land after clicking the email confirm link, log in to Mailchimp → Audience → Signup forms → Form builder → "Confirmation thank you page" — point it at the live welcome.html URL.

## 30-second video

The voiceover audio is in `assets/voiceover.mp3`. The full script and recording notes are in **`Voiceover Script.md`** at the repo root.

To rerecord: write a new `voiceover.mp3` (any voice, any duration up to 30s) and replace the file. The video timeline (`video-scenes.jsx`) syncs scenes to fixed 5-second windows and the audio rides on top.

## Tech

Plain HTML + React (loaded via CDN, no build step). Edit any `.jsx` file, refresh the page, see the change. Nothing is bundled or compiled.
