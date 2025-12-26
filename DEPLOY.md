# Deploying to GitHub Pages

This project is configured for **automated deployment** using GitHub Actions.

## Recommended: GitHub Actions (Already Configured)

The project includes a workflow at `.github/workflows/deploy.yml` that automatically builds and deploys your site whenever you push to the `main` branch.

**To enable it:**
1. Push your code to a GitHub repository called `tripit-viewer`.
2. Go to your Repository **Settings** -> **Pages**.
3. Under **Build and deployment** -> **Source**, select **GitHub Actions**.

The site will be live at [https://tripit.csanchez.org](https://tripit.csanchez.org) (once you configure your custom domain in GitHub settings).

## Alternative: Manual Deployment (Docs folder)

If you prefer to build locally and not use Actions:
1. Update `vite.config.js` to set `build.outDir: 'docs'`.
2. Run `npm run build`.
3. Push the `docs` folder to GitHub.
4. Settings -> Pages -> Source: Branch -> `main` -> `/docs`.

## Custom Domain Setup

To use `tripit.csanchez.org`:
1. In the GitHub repository settings -> Pages, add `tripit.csanchez.org` as the Custom Domain.
2. Ensure your DNS provider has the correct A or CNAME records pointing to GitHub.
3. The included `public/CNAME` file will help GitHub keep this setting during deployments.

## Usage
Once deployed, simply open the URL provided by GitHub Pages. You will be prompted to upload your `tripit.json` file. The data will be processed entirely in your browser.
