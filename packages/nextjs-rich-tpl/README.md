# Next.js Rich Template / CLI

> [!WARNING]
> **DEPRECATED**: This package is deprecated.
>
> For new projects and future use, please use the successor package `create-next-rich-tpl`.
>
> Recommended command:
>
> ```bash
> npx create-next-rich-tpl
> ```

The Next.js Rich Template is a CLI tool that helps quickly set up Next.js applications. Using pre-prepared templates, you can easily create new projects.

## Table of Contents

- [Features](#features)
- [Usage](#usage)
- [Dependencies](#dependencies)
- [License](#license)

## Features

- Multiple Next.js templates to choose from
- Automation of project initialization
- Support for dependency installation
- Progress bar to display user progress

## Usage

We recommend starting a new Next.js application using `nextjs-rich-tpl`. To create a project, run:

```bash
npx nextjs-rich-tpl
```

After installation, you will see the following prompts:

```bash
Select a Next.js template:
❯ Next.js app with i18n routing setup
  Next.js app without i18n routing setup
Enter your project name: (my-nextjs-app)
```

After the prompts, `nextjs-rich-tpl` will create a folder with your project name and install the necessary dependencies.

## Dependencies

This project depends on the following packages:

- `chalk`: Adds color to command-line output
- `cli-progress`: Displays progress bars
- `inquirer`: Prompts for user input
- `ora`: Shows loading animations

## License

This project is licensed under the MIT License.
