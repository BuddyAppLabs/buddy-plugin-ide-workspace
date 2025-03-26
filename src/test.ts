/**
 * IDE工作空间测试入口文件
 * 交互式命令行应用，用于测试IDE工作空间和Git功能
 */
import { VSCodeService } from './services/vscode';
import { CursorService } from './services/cursor';
import { GitHelper } from './utils/git-helper';
import inquirer from 'inquirer';
import chalk from 'chalk';

interface Workspace {
  name: string;
  path: string;
}

/**
 * 主函数
 */
async function main() {
  console.log(chalk.cyan('\n===== IDE工作空间检测工具 ====='));

  // 获取所有工作空间
  const workspaces = await detectWorkspaces();

  if (workspaces.length === 0) {
    console.log(chalk.yellow('\n⚠️ 未检测到任何工作空间'));
    return;
  }

  // 显示主菜单
  await showMainMenu(workspaces);
}

/**
 * 检测所有工作空间
 */
async function detectWorkspaces(): Promise<Workspace[]> {
  console.log(chalk.cyan('\n正在检测IDE工作空间...\n'));
  const workspaces: Workspace[] = [];

  // VSCode工作空间服务
  const vscodeService = new VSCodeService();
  try {
    const vscodeWorkspace = await vscodeService.getWorkspace();
    if (vscodeWorkspace) {
      workspaces.push({
        name: 'VSCode',
        path: vscodeWorkspace
      });
      console.log(chalk.green(`✅ VSCode工作空间: ${vscodeWorkspace}`));
    }
  } catch (err: any) {
    console.log(chalk.red(`❌ VSCode服务出错: ${err.message}`));
  }

  // Cursor工作空间服务
  const cursorService = new CursorService();
  try {
    const cursorWorkspace = await cursorService.getWorkspace();
    if (cursorWorkspace) {
      workspaces.push({
        name: 'Cursor',
        path: cursorWorkspace
      });
      console.log(chalk.green(`✅ Cursor工作空间: ${cursorWorkspace}`));
    }
  } catch (err: any) {
    console.log(chalk.red(`❌ Cursor服务出错: ${err.message}`));
  }

  return workspaces;
}

/**
 * 显示主菜单
 */
async function showMainMenu(workspaces: Workspace[]) {
  while (true) {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择要执行的操作：',
        choices: [
          { name: '🔍 检查工作空间Git状态', value: 'check' },
          { name: '📝 Git提交操作', value: 'commit' },
          { name: '🔄 重新检测工作空间', value: 'refresh' },
          { name: '❌ 退出程序', value: 'exit' }
        ]
      }
    ]);

    if (action === 'exit') {
      console.log(chalk.cyan('\n👋 感谢使用，再见！'));
      break;
    }

    if (action === 'refresh') {
      console.clear();
      const newWorkspaces = await detectWorkspaces();
      workspaces.length = 0;
      workspaces.push(...newWorkspaces);
      continue;
    }

    // 选择工作空间
    const { workspace } = await inquirer.prompt([
      {
        type: 'list',
        name: 'workspace',
        message: '请选择要操作的工作空间：',
        choices: workspaces.map(ws => ({
          name: `${ws.name}: ${ws.path}`,
          value: ws
        }))
      }
    ]);

    if (action === 'check') {
      await checkGitStatus(workspace);
    } else if (action === 'commit') {
      await handleGitCommit(workspace);
    }

    // 是否继续
    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: '是否继续操作？',
        default: true
      }
    ]);

    if (!shouldContinue) {
      console.log(chalk.cyan('\n👋 感谢使用，再见！'));
      break;
    }

    console.clear();
  }
}

/**
 * 检查Git状态
 */
async function checkGitStatus(workspace: Workspace) {
  console.log(chalk.cyan(`\n----- 检查Git状态 (${workspace.path}) -----`));

  // 检查是否为Git仓库
  const isRepo = await GitHelper.isGitRepository(workspace.path);
  if (!isRepo) {
    console.log(chalk.yellow('❗ 当前目录不是Git仓库'));
    return;
  }

  // 获取Git信息
  const [hasChanges, branch, remoteUrl] = await Promise.all([
    GitHelper.hasUncommittedChanges(workspace.path),
    GitHelper.getCurrentBranch(workspace.path),
    GitHelper.getRemoteUrl(workspace.path)
  ]);

  console.log(chalk.cyan('\nGit仓库信息：'));
  console.log(chalk.green(`📝 未提交的更改: ${hasChanges ? '有' : '无'}`));
  console.log(chalk.green(`🔖 当前分支: ${branch}`));
  console.log(chalk.green(`🔗 远程仓库: ${remoteUrl || '未设置'}`));
}

/**
 * 处理Git提交操作
 */
async function handleGitCommit(workspace: Workspace) {
  console.log(chalk.cyan(`\n----- Git提交操作 (${workspace.path}) -----`));

  // 检查是否为Git仓库
  const isRepo = await GitHelper.isGitRepository(workspace.path);
  if (!isRepo) {
    console.log(chalk.yellow('❗ 当前目录不是Git仓库'));
    return;
  }

  // 检查是否有更改
  const hasChanges = await GitHelper.hasUncommittedChanges(workspace.path);
  if (!hasChanges) {
    console.log(chalk.yellow('💡 当前没有未提交的更改'));
    return;
  }

  // 获取提交信息
  const { commitMessage } = await inquirer.prompt([
    {
      type: 'input',
      name: 'commitMessage',
      message: '请输入提交信息：',
      default: `更新: ${new Date().toLocaleString('zh-CN')}`,
      validate: (input: string) => {
        if (input.trim().length === 0) {
          return '提交信息不能为空';
        }
        return true;
      }
    }
  ]);

  // 确认提交
  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: '确认要提交更改吗？',
      default: true
    }
  ]);

  if (!confirm) {
    console.log(chalk.yellow('已取消提交'));
    return;
  }

  try {
    console.log(chalk.cyan('\n🚀 正在提交更改...'));
    const result = await GitHelper.commitAndPush(workspace.path, commitMessage);
    console.log(chalk.green(`\n✅ ${result}`));
  } catch (error: any) {
    console.log(chalk.red(`\n❌ 提交失败: ${error.message}`));
  }
}

// 执行主函数
main().catch((err: any) => {
  console.error(chalk.red('❌ 执行过程中发生错误:', err));
});
