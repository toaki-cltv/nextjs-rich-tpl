# create-next-rich-tpl

Central CLI to create Next.js projects from the Next.js Rich Template collection.

This package provides the `create-next-rich-tpl` command used to list available templates
and scaffold a new Next.js project from either local templates or remote (git) templates.

## Install / Run

Recommended public invocation (uses the published `create` starter harness):

```bash
npx create next-rich-tpl@latest
```

If you have the repository checked out or installed locally, you can run the CLI directly:

```bash
node ./bin/create.mjs --help
```

## Usage

The CLI supports both interactive and non-interactive usage. Basic options:

- `-v, --verbose` : verbose logging
- `-y, --yes` : accept defaults (does NOT auto-run template post-create scripts)
- `--template <id|name>` : select template non-interactively
- `--name <project-name>` : project destination name
- `-a, --accept-postcreate` : opt in to run template-provided post-create scripts
- `--wait-cleanup` : wait for temporary cleanup and show progress
- `--timeout <ms>` : override network/clone timeout in milliseconds

Run `--help` to show the full help and available options:

```bash
node ./bin/create.mjs --help
```

## Notes for packagers / publishers

- The package bundles a JSON Schema used to validate remote template indexes: `bin/index.schema.json`. Ensure `files` in `package.json` includes `bin/` so the schema ships with published packages.
- Publish scripts in `package.json`:

```json
"pub:beta": "pnpm publish --access public --tag beta",
"pub:latest": "pnpm publish --access public --tag latest"
```

## Development

Run the CLI locally from the repository root (recommended during development):

```bash
# from repo root
node packages/create-next-rich-tpl/bin/create.mjs
```

## Contributing

Contributions are welcome. See the repository README for contribution guidelines and templates.

## License

MIT
