# RJ web app

React/Vite frontend for RJChicago. The app owns its manifest, lockfile, Vite configuration, source, public assets, Dockerfile, and Nginx production configuration.

From the repository root:

```bash
npm --prefix apps/web run dev
npm --prefix apps/web run lint
npm --prefix apps/web run build
```

For the complete local workflow, see the root [README](../../README.md) and [development guide](../../docs/DEVELOPMENT.md).
