# templates/index.json format

This document describes the `templates/index.json` format used by the central CLI `create-next-rich-tpl`.

Top-level shape:

{
  "templates": [ ... ]
}

Each template entry is an object with the following recommended fields:

- id (string, optional): stable identifier for the template (e.g. `app/with-i18n-routing`). If omitted, the CLI may synthesize one.
- title (string, required): human-readable name shown to users in the selector.
- description (string, optional): short description of the template.
- tags (array, optional): array of tag strings for search/filtering.
- source (object, required): how to retrieve the template. See below for supported source types.

Supported `source.type` values:

1. local

- Use when the index is used within the same repository as the template files (developers).

source fields:

- type: "local"
- path: path to the template directory, relative to the repository root (e.g. `templates/app/with-i18n-routing`).

Example:

```json
{
  "id": "app/with-i18n-routing",
  "title": "Next.js app with i18n routing",
  "description": "Next.js template with i18n routing and translation scaffolding",
  "source": { "type": "local", "path": "templates/app/with-i18n-routing" },
  "tags": ["nextjs","i18n"]
}
```

Notes:

- `local` entries are intended when the CLI runs inside the same repository (developer workflows, local testing). When the CLI is installed by end-users, prefer publishing the index with `git` entries instead.

2. git

- Use when the template is stored in a Git repository (recommended for remote public distribution).

source fields:

- type: "git"
- repo: repository identifier (e.g. `owner/repo` or full URL without `.git` suffix). Examples:
  - `myorg/my-template-repo`
  - `https://github.com/myorg/my-template-repo`
- path (optional): path inside the repository to the template directory (e.g. `templates/app/with-i18n-routing`). If omitted, the repository root is used.
- ref (optional): branch or tag to checkout (e.g. `main`, `v1.2.0`). If omitted, `main` is used by default.
- timeout (optional): integer milliseconds to wait for cloning before erroring (default: 30000)

Example:

```json
{
  "id": "example/with-i18n",
  "title": "Example remote i18n template",
  "source": { "type": "git", "repo": "toaki-cltv/nextjs-rich-tpl", "path": "templates/app/with-i18n-routing", "ref": "main" }
}
```

Notes:

- The CLI uses `degit` to fetch git templates. Supported repo target forms include `owner/repo`, `owner/repo/path`, and `owner/repo/path#ref`.
- For remote indexes, prefer `git` sources because `local` paths cannot be resolved outside the original repository.

Security and post-create scripts:

- A template may include a `postCreate` field (relative path to a JS script inside the template). The CLI will ask for confirmation before running it by default. For automation, you can pass `--yes` to auto-run, but be careful when running templates from untrusted sources.
- In future, the CLI may add hash/signature verification for remote templates before running `postCreate`.

Publishing index.json

- Host the index as a raw URL (e.g. GitHub raw) and set the CLI's `CREATE_TEMPLATES_INDEX_URL` environment variable or root package `config.templatesIndexUrl` to point at it. The CLI will try to fetch the remote index and cache it.

