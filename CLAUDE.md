@AGENTS.md

# Git & GitHub

- Repository: https://github.com/edayani/fair-audit
- All changes must be committed and pushed to GitHub after implementation.
- After completing any task that modifies code, create a commit with a descriptive message and push to the `main` branch.
- Never push secrets or .env files. The .gitignore already excludes them.

# Deployment

- Production URL: https://fairaudit.site
- Hosted on Vercel (project: edayanis-projects/fair-audit)
- Custom domain: fairaudit.site (registered via Namecheap)
- Vercel auto-deploys on push to `main` branch
- Build command: `npx prisma generate && next build`
- Environment variables are configured in Vercel dashboard (DATABASE_URL, Clerk keys, NEXT_PUBLIC_APP_URL)
