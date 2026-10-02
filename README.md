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

## Firebase Spark checklist

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/) and select the free **Spark** plan. No Cloud Functions or paid hosting are needed.
2. In Project settings, register a Web app. Copy its web configuration into `js/firebase-config.js`. The Firebase web config is intentionally public; do not put passwords, service-account keys, or private credentials in this repository.
3. In **Build → Firestore Database**, create a database. Choose a location close to your users. The site uses only the `enquiries` collection.
4. In **Build → Authentication → Sign-in method**, enable **Email/Password**.
5. Create your admin account in **Authentication → Users**. Use your own strong password directly in the Firebase Console; never put it in this repository. Verify the account's email before using the admin panel because the rules require `email_verified`.
6. Copy the admin email into `ADMIN_EMAIL` in `js/firebase-config.js`. Replace `YOUR_ADMIN_EMAIL@example.com` in `firestore.rules` with the same exact email, then publish those rules in **Firestore Database → Rules**. The email check is enforced by Firestore, not just the page. Do not leave the placeholder rules in production.
7. Add your GitHub Pages host to **Authentication → Settings → Authorized domains**. For a project site, add `YOUR_GITHUB_USERNAME.github.io` (host only, no `https://` and no repository path). Also authorize `localhost` for local sign-in tests.
8. Deploy, then test a public enquiry, the live admin inbox, a status change, and that a signed-out visitor cannot read the collection.

### Access policy

Anyone can create a strictly validated enquiry with status `new`. Only the verified admin email set in the rules can read, update, or delete enquiries. The rules reject extra fields, oversized values, invalid email shapes, and client-supplied timestamps that are not Firestore server timestamps. Admin UI email checks are an extra usability gate; the Firestore rules are the security boundary.

The form's honeypot and 30-second submission cooldown run in the browser. They reduce casual spam but are not a server-enforced per-person or per-IP rate limit: anonymous clients can bypass browser checks. Strict server-side throttling, CAPTCHA verification, or email notifications would require an additional trusted service and are intentionally not included under the no-backend/no-paid-services constraint. Enquiries are stored in Firestore; this setup does not send email notifications.

## Create the standalone GitHub repository

First, create a **new, empty, public repository** named `nts-technologies` in your new GitHub account using GitHub's website. This is the one manual account-login step; no account or repository is created from this project. Do not initialize the GitHub repository with a README, license, or `.gitignore`.

This project folder is already initialized as a standalone local Git repository on branch `main`. After creating the empty GitHub repository, run these PowerShell commands from the project folder. Replace `YOUR_GITHUB_USERNAME` with your username:

```powershell
Set-Location "C:\Projects\nts-technologies"
git add .
git commit -m "Build NTS Technologies website"
git remote add origin https://github.com/developershergills75-pixel/nts-technologies.git
git push -u origin main
```

GitHub may prompt you to authenticate during `git push`; complete that login in your browser or credential manager. No credentials belong in these commands. If you choose a different repository name, update the remote URL and the URLs in `robots.txt` and `sitemap.xml` before pushing.

## Enable GitHub Pages

1. In the repository on GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then save.
4. Wait for the Pages deployment to finish. The project URL is `https://YOUR_GITHUB_USERNAME.github.io/nts-technologies/`.
5. Update the canonical host/repository URL in `robots.txt` and `sitemap.xml` if needed, commit, and push the change.
6. Open the public URL and `https://YOUR_GITHUB_USERNAME.github.io/nts-technologies/admin.html` to verify both pages. `/admin.html` is marked `noindex` and disallowed in `robots.txt`; these are crawler directives, not access control. Authentication and Firestore rules protect enquiry data.

## Motion, data, and content

The hero network and candlestick chart are drawn locally on canvas; the chart, watchlist, and order controls are illustrative only and never connect to a broker. The market display is clearly labelled demo data. Project concepts are editable in `js/data.js`; all are explicitly illustrative, not client claims. Testimonials are intentionally empty until genuine, permissioned quotes are available. The site respects reduced-motion preferences and disables heavier cursor/tilt/canvas motion on touch and lower-core-count devices. GSAP, ScrollTrigger, and Lenis are optional CDN enhancements; the site keeps its CSS/vanilla-JS interactions if a CDN is unavailable.

## Change the admin email

To move admin access to a different address, update both `ADMIN_EMAIL` in `js/firebase-config.js` and the email literal in `firestore.rules`, publish the updated rules, then sign in with a verified Firebase Authentication user for that address. The admin HTML page is not a secret; its database permissions are enforced by the rules.
