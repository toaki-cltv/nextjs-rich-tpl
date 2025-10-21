#!/usr/bin/env node

import inquirer from "inquirer";
import { execSync } from "child_process";
import chalk from "chalk";

const templates = [
  {
    name: "app/with-i18n-routing",
    description: "Next.js app with i18n routing setup",
    repo: "toaki-cltv/nextjs-rich-tpl",
    branch: "main",
    directory: "templates/app/with-i18n-routing",
  },
  {
    name: "app/without-i18n",
    description: "Next.js app without i18n setup",
    repo: "toaki-cltv/nextjs-rich-tpl",
    branch: "main",
    directory: "templates/app/without-i18n",
  },
  {
    name: "app/without-i18n-routing",
    description: "Next.js app without i18n routing setup",
    repo: "toaki-cltv/nextjs-rich-tpl",
    branch: "main",
    directory: "templates/app/without-i18n-routing",
  },
];

(async () => {
  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "templateName",
      message: "Select a Next.js template:",
      choices: templates.map((t) => ({ name: t.description, value: t })),
    },
    {
      type: "input",
      name: "projectName",
      message: "Enter your project name:",
      default: "my-nextjs-app",
    },
  ]);

  const { templateName, projectName } = answers;

  console.log(
    chalk.blue(
      `\nCreating a new Next.js project '${projectName}' using template '${templateName.description}'...\n`,
    ),
  );

  try {
    execSync(
      `npx create-next-app --example https://github.com/${templateName.repo}/tree/${templateName.branch}/${templateName.directory} ${projectName}`,
      {
        stdio: "inherit",
      },
    );
    console.log(chalk.green(`\nSuccess! Created '${projectName}'.`));
  } catch (error) {
    console.error(chalk.red("\nAn error occurred while creating the project."));
    process.exit(1);
  }
})();
