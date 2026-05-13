import chalk from "chalk";

const timestamp = () => new Date().toISOString().slice(11, 19);

export const logger = {
  info: (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.blue("ℹ")} ${msg}`),
  success: (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.green("✓")} ${msg}`),
  warn: (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.yellow("⚠")} ${msg}`),
  error: (msg) => console.log(`${chalk.gray(timestamp())} ${chalk.red("✗")} ${msg}`),
  section: (msg) => console.log(`\n${chalk.bold.cyan("═══ " + msg + " ═══")}\n`),
};
