# GitHub Pages Deployment Guide

This Society Management System has been fully optimized to act as a **Static Single-Page Application (SPA)** and is 100% compatible with GitHub Pages hosting without any backend node servers required.

## What has been optimized?
1. **Removed Backend Dependencies**: `express`, `livekit-server-sdk`, and `twilio` have been removed to ensure the app can run purely in the browser. 
2. **Relative Paths**: Configured Vite (`base: "./"`) to resolve all static assets using relative paths, guaranteeing that stylesheets, images, and fonts load perfectly regardless of the GitHub repository name.
3. **SPA Navigation Fixes**: By auto-generating a `404.html` identical to `index.html`, direct URL links and page refreshes work smoothly without returning standard GitHub 404 Pages.
4. **Automated CI/CD Workflow**: A professional GitHub Actions workflow file (`.github/workflows/deploy.yml`) is automatically configured.

## Step-by-Step Deployment Instructions

### Method 1: Automated Deployment via GitHub Actions (Recommended)
This method is fully automated. Whenever you push code to your `main` branch, GitHub Pages will automatically build and deploy the update.

1. Create a repository on GitHub and push this source code to it.
2. In your GitHub repository, click on **Settings** > **Pages**.
3. Under the **Build and deployment** section, look for the **Source** dropdown and change it from *Deploy from a branch* to **GitHub Actions**.
4. GitHub Actions will detect the included workflow file and automatically start the deployment! 
5. You can view the live progress in the **Actions** tab of your repository. 
6. Once the action turns green, your app is live!

### Method 2: Manual Deployment
If you prefer not to use GitHub Actions, you can manually deploy it:

1. In your local terminal, run: `npm install`
2. Next, run: `npm run build`
3. A `dist/` folder will be generated containing the production-ready code.
4. Go to **Settings** > **Pages** in your GitHub repository.
5. Set the Source to **Deploy from a branch** and select the folder as `root` (or `/docs`). You will need to upload or push the *contents* of your `dist/` folder to that branch.

## Firebase Configuration Note
Since this is a client-side application, ensure your Firebase Configuration (`firebaseConfig` in `src/utils/firebase.ts`) contains the correct keys. Since Firebase operates heavily on client-side requests via domain whitelisting, make sure you add your `username.github.io` domain to your **Firebase Authentication settings > Authorized domains**. This ensures Google Auth or normal Auth works perfectly on your hosted site!
