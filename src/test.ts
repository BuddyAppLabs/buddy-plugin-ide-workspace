/**
 * IDE工作空间测试入口文件
 * 交互式命令行应用，用于测试IDE工作空间和Git功能
 */
import { Command } from 'commander';
import chalk from 'chalk';
import { registerCheckWorkspaceCommand } from './command/check-workspace';

const program = new Command();

program
  .name('ide-tool')
  .description('IDE工作空间命令行工具')
  .version('1.0.0');

// 注册所有子命令
registerCheckWorkspaceCommand(program);

program.parseAsync(process.argv).catch((err) => {
  console.error(chalk.red('❌ 执行过程中发生错误:', err));
});
