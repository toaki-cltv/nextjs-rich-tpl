# create-next-rich-tpl

Central CLI to choose and scaffold templates available in this monorepo.

Usage (from repo root):

```powershell
node packages\create-next-rich-tpl\bin\create.mjs
```

This will list templates found in `templates/app/*` and any `packages/create-*` packages, letting you pick one and enter a project name. Local templates are copied directly; `create-*` packages are executed with the project name argument.

To use interactive mode you need `inquirer` installed in the workspace (or globally):

```powershell
pnpm i -w inquirer
```
