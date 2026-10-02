# NTS Technologies

A standalone, static website for **Next Tech & AI Intelligence Systems**. It is built with HTML, CSS, and vanilla JavaScript modules; there is no build step. The public site can be hosted free on GitHub Pages. Firebase's free Spark plan powers enquiry storage and the private admin inbox.

## Project contents

```text
nts-technologies/
├── index.html
├── admin.html
├── css/
├── js/
├── assets/logo.svg
├── firestore.rules
├── robots.txt
└── sitemap.xml
```

## Local preview

From this folder, run a local static server (ES modules and Firebase require HTTP, not `file://`):

```powershell
python -m http.server 8000
```

Open `http://localhost:8000`. Without Firebase configured, the website still previews; the enquiry form explains that it is not connected. To test authenticated enquiries, first complete the Firebase checklist below and add `localhost` to Firebase Authentication's authorized domains if it is not already listed.

## Firebase Spark setup

The Firebase project `nts-technologies` and its Web app are created on the free **Spark** plan. The Standard Firestore `(default)` database is in `asia-south1` (Mumbai), starts in production mode, and uses the rules in `firestore.rules`. Email/Password sign-in is enabled. No Cloud Functions, paid hosting, or billing account is configured.

1. The generated public Web SDK configuration is in `js/firebase-config.js`. It is safe for client-side use; never add passwords, service-account keys, or private credentials to this repository.
2. The rules authorize only the authenticated `ntstechnologiessystems@gmail.com` account to read, update, or delete enquiries. Anyone may create a validated enquiry with status `new`.
3. Create the admin account in **Authentication → Users**. Set your own password directly in the Firebase Console. Do not put the password in this repository.
4. `localhost` is already an authorized domain. Add `ntstechnologiessolutions-sketch.github.io` in **Authentication → Settings → Authorized domains** if it is not present.
5. Test a public enquiry, the live admin inbox, a status change, and that a signed-out visitor cannot read the collection.

### Access policy

Anyone can create a strictly validated enquiry with status `new`. Only the verified admin email set in the rules can read, update, or delete enquiries. The rules reject extra fields, oversized values, invalid email shapes, and client-supplied timestamps that are not Firestore server timestamps. Admin UI email checks are an extra usability gate; the Firestore rules are the security boundary.

The form's honeypot and 30-second submission cooldown run in the browser. They reduce casual spam but are not a server-enforced per-person or per-IP rate limit: anonymous clients can bypass browser checks. Strict server-side throttling, CAPTCHA verification, or email notifications would require an additional trusted service and are intentionally not included under the no-backend/no-paid-services constraint. Enquiries are stored in Firestore; this setup does not send email notifications.

git push -u origin main
## Standalone GitHub repository

The public repository is [ntstechnologiessolutions-sketch/nts-technologies](https://github.com/ntstechnologiessolutions-sketch/nts-technologies). The standalone working copy is `C:\Projects\nts-technologies`, on branch `main`, with local author `NTS Technologies` and the account's GitHub noreply email. The previous repository under the old account was intentionally left untouched.

To clone the project on another device:

```powershell
git clone https://github.com/ntstechnologiessolutions-sketch/nts-technologies.git
Set-Location nts-technologies
```

## Enable GitHub Pages

GitHub Pages is enabled from branch `main`, folder `/ (root)`. The live URL is <https://ntstechnologiessolutions-sketch.github.io/nts-technologies/>. The canonical and Open Graph URLs, `robots.txt`, and `sitemap.xml` use this address. `/admin.html` is marked `noindex` and disallowed in `robots.txt`; these are crawler directives, not access control. Authentication and Firestore rules protect enquiry data.

## Motion, data, and content

The hero network and candlestick chart are drawn locally on canvas; the chart, watchlist, and order controls are illustrative only and never connect to a broker. The market display is clearly labelled demo data. Project concepts are editable in `js/data.js`; all are explicitly illustrative, not client claims. Testimonials are intentionally empty until genuine, permissioned quotes are available. The site respects reduced-motion preferences and disables heavier cursor/tilt/canvas motion on touch and lower-core-count devices. GSAP, ScrollTrigger, and Lenis are optional CDN enhancements; the site keeps its CSS/vanilla-JS interactions if a CDN is unavailable.

## Change the admin email

To move admin access to a different address, update both `ADMIN_EMAIL` in `js/firebase-config.js` and the email literal in `firestore.rules`, publish the updated rules, then sign in with a verified Firebase Authentication user for that address. The admin HTML page is not a secret; its database permissions are enforced by the rules.
