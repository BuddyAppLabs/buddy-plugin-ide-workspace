import { Command } from 'commander';
import { IDEServiceFactory } from '../services/ide_factory';
import chalk from 'chalk';

export function registerCheckWorkspaceCommand(program: Command) {
    program
        .command('check-workspace')
        .description('检测IDE工作空间和Git状态')
        .action(async () => {
            console.log(chalk.cyan('\n===== IDE工作空间检测工具 ====='));
            const workspaces = await IDEServiceFactory.detectWorkspaces();
            if (workspaces.length === 0) {
                console.log(chalk.yellow('\n⚠️ 未检测到任何工作空间'));
                return;
            }
            console.log(chalk.cyan('\n----- 工作空间Git状态 -----'));
            for (const workspace of workspaces) {
                const gitInfo = await IDEServiceFactory.getGitInfo(workspace.path);
                console.log(chalk.cyan(`\n${workspace.name}: ${workspace.path}`));
                if (!gitInfo.isRepo) {
                    console.log(chalk.yellow('❗ 不是Git仓库'));
                    continue;
                }
                console.log(chalk.green(`📝 未提交的更改: ${gitInfo.hasChanges ? '有' : '无'}`));
                console.log(chalk.green(`🔖 当前分支: ${gitInfo.branch}`));
                console.log(chalk.green(`🔗 远程仓库: ${gitInfo.remoteUrl || '未设置'}`));
            }
        });
}
