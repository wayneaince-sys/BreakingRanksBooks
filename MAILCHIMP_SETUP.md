# Mailchimp Setup — 2 minute job

The newsletter form is wired up to post directly to Mailchimp once you fill in two values. Until you do, signups still work locally (they go to `welcome.html`) but no one lands in your audience.

## 1. Get your two values from Mailchimp

1. Sign in to [Mailchimp](https://mailchimp.com).
2. Go to **Audience** → **Signup forms** → **Embedded forms**.
3. Choose the **Naked** style (or Classic — either works).
4. In the generated HTML, find these two things:

**a) The form action URL** — looks like:
```html
<form action="https://breakingranksbooks.us21.list-manage.com/subscribe/post?u=XXXXXXXX&id=YYYYYYYY" ...>
```
Copy everything inside the `action="..."` quotes.

**b) The honeypot field name** — near the bottom of the form, look for:
```html
<input type="text" name="b_XXXXXXXX_YYYYYYYY" tabindex="-1" value="">
```
Copy just the `name` value (the `b_..._...` string). This is the anti-bot field; it must be present or Mailchimp rejects submissions as spam.

## 2. Paste them into the site

Open `components.jsx` and find this block near the top of the `Newsletter` function (around line 478):

```js
const MAILCHIMP_ACTION = ""; // paste action URL here
const MAILCHIMP_HONEYPOT = ""; // paste b_XXXX_YYYY here
```

Fill both. Save. Done — the form will now post real signups to your Mailchimp audience.

## 3. What happens on submit

- Subscriber's email POSTs to Mailchimp in a new tab → they see Mailchimp's "confirm your email" page (this is **double opt-in**, which is the Mailchimp default and the right choice for deliverability).
- The original tab navigates to `welcome.html` so they can read Chapter 1 immediately, even before confirming.
- After they click the confirm link in their email, Mailchimp adds them to your audience and you can email them with the rest of the funnel.

## 4. (Optional) Turn off double opt-in

Only do this if you trust your traffic source. In Mailchimp:
**Audience** → **Settings** → **Audience name and defaults** → uncheck **Enable double opt-in**.

## 5. (Optional) Auto-deliver Chapter 1 from Mailchimp instead of showing the on-site PDF

Right now Chapter 1 is delivered by the on-site `welcome.html` page. If you want Mailchimp to email it automatically:

1. Upload `assets/Until-the-Well-Runs-Dry-Chapter-1.pdf` to Mailchimp's content studio.
2. **Automations** → **Welcome new subscribers** → choose your audience → add a single email with the PDF link.
3. You can keep `welcome.html` as-is (good UX — they get the chapter instantly) and the automation acts as backup + builds the email habit.

## Test before you go live

1. Push to GitHub Pages.
2. Open the live site, scroll to the newsletter, enter a real email of yours.
3. Check both: (a) the welcome page loads, (b) you receive Mailchimp's confirmation email within ~30 seconds.
4. Click confirm. Verify the email shows up in your Mailchimp audience.

If step 3 fails, the most likely cause is a typo in `MAILCHIMP_ACTION` or `MAILCHIMP_HONEYPOT`. Double-check both values match exactly what's in your Mailchimp embed code.
