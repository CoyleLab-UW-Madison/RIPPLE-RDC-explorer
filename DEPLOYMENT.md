# Deployment and Sharing Guide

Since this project uses **ES6 Modules** and **external shader files**, it requires a web server to run (it won't work if you just double-click `index.html` from your file explorer). Here are the two best ways to share it:

## 1. Hosting on GitHub Pages (Recommended)
This is the easiest way to give someone a "live link" they can click on.

1.  **Upload to GitHub**: Create a new repository and push all these files to it.
2.  **Enable Pages**: 
    *   Go to your repository **Settings**.
    *   Click **Pages** on the left sidebar.
    *   Under "Build and deployment", set the source to **"Deploy from a branch"** and select **`main`** (or `master`).
3.  **Wait 1 minute**: GitHub will give you a URL like `https://username.github.io/repository-name/`.

## 2. Putting it on your personal website
If you want to "embed" this into an existing page, you have two options:

### Option A: The "Iframe" Way (Easiest)
Upload the entire folder to your web server (e.g., via FTP or your hosting panel) into a subfolder like `/ripple/`. Then, on your main website, add this code:
```html
<iframe src="/ripple/index.html" width="100%" height="600px" style="border:none;"></iframe>
```

### Option B: The "Single-File" Bundle (Best for performance)
If you want to avoid dealing with multiple files and "CORS" errors, you can "bundle" it back into one file. 

I can create a script for you that automatically merges the shaders and JS back into a single `dist/index.html` if you'd like. This "production build" is what most developers do before putting things on their sites.

## 3. Local Previewing (For you)
To see your changes as you work, use a "Local Server":
*   **VS Code**: Install the **Live Server** extension. Click "Go Live" at the bottom right.
*   **Terminal**: Run `python -m http.server 8000` and go to `localhost:8000`.

**Would you like me to generate a "Single-File" version for you to make uploading even easier?**
