import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Logger } from './logger';

const execAsync = promisify(exec);
const logger = new Logger('GitHelper');

/**
 * Git工具类
 * 用于检测Git仓库状态和执行提交操作
 */
export class GitHelper {
  /**
   * 检查路径是否为Git仓库
   * @param workspacePath 工作区路径
   * @returns 是否为Git仓库
   */
  static async isGitRepository(workspacePath: string): Promise<boolean> {
    try {
      const gitDir = path.join(workspacePath, '.git');
      return fs.existsSync(gitDir);
    } catch (error) {
      logger.error('检查Git仓库失败:', error);
      return false;
    }
  }

  /**
   * 检查Git仓库是否有未提交的更改
   * @param workspacePath 工作区路径
   * @returns 是否有未提交的更改
   */
  static async hasUncommittedChanges(workspacePath: string): Promise<boolean> {
    try {
      // 执行git status命令，检查是否有未提交的更改
      const { stdout } = await execAsync('git status --porcelain', {
        cwd: workspacePath,
      });
      return stdout.trim() !== '';
    } catch (error) {
      logger.error('检查未提交更改失败:', error);
      return false;
    }
  }

  /**
   * 获取远程仓库URL
   * @param workspacePath 工作区路径
   * @returns 远程仓库URL或null
   */
  static async getRemoteUrl(workspacePath: string): Promise<string | null> {
    try {
      // 获取远程仓库URL
      const { stdout } = await execAsync('git remote get-url origin', {
        cwd: workspacePath,
      });
      return stdout.trim() || null;
    } catch (error) {
      logger.debug('获取远程仓库URL失败:', error);
      return null;
    }
  }

  /**
   * 获取当前分支名称
   * @param workspacePath 工作区路径
   * @returns 当前分支名称
   */
  static async getCurrentBranch(workspacePath: string): Promise<string> {
    try {
      // 获取当前分支名称
      const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
        cwd: workspacePath,
      });
      return stdout.trim();
    } catch (error) {
      logger.error('获取当前分支失败:', error);
      return 'unknown';
    }
  }

  /**
   * 提交并推送更改
   * @param workspacePath 工作区路径
   * @param commitMessage 提交消息
   * @returns 提交结果
   */
  static async commitAndPush(
    workspacePath: string,
    commitMessage: string
  ): Promise<string> {
    try {
      // 添加所有更改
      await execAsync('git add -A', { cwd: workspacePath });
      logger.info('已添加所有更改');

      // 提交更改
      const { stdout: commitResult } = await execAsync(
        `git commit -m "${commitMessage}"`,
        { cwd: workspacePath }
      );
      logger.info('已提交更改:', commitResult);

      // 获取当前分支
      const currentBranch = await this.getCurrentBranch(workspacePath);

      // 检查是否有远程仓库
      const remoteUrl = await this.getRemoteUrl(workspacePath);
      if (!remoteUrl) {
        return `已提交本地更改，但未找到远程仓库。提交信息: ${commitMessage}`;
      }

      // 推送到远程仓库
      const { stdout: pushResult } = await execAsync(
        `git push origin ${currentBranch}`,
        { cwd: workspacePath }
      );
      logger.info('已推送到远程仓库:', pushResult);

      return `已成功提交并推送更改到${currentBranch}分支。提交信息: ${commitMessage}`;
    } catch (error: any) {
      logger.error('提交推送失败:', error);
      throw new Error(`提交推送失败: ${error.message}`);
    }
  }

  /**
   * 获取变更统计摘要
   * @param workspacePath 工作区路径
   * @returns 变更统计摘要
   */
  static async getChangesSummary(workspacePath: string): Promise<string> {
    try {
      const { stdout: status } = await execAsync('git status --porcelain', {
        cwd: workspacePath,
      });

      const changes = {
        modified: 0,
        added: 0,
        deleted: 0,
        renamed: 0,
      };

      status
        .split('\n')
        .filter(Boolean)
        .forEach((line) => {
          const statusCode = line.slice(0, 2).trim();
          if (statusCode.includes('M')) changes.modified++;
          else if (statusCode.includes('A')) changes.added++;
          else if (statusCode.includes('D')) changes.deleted++;
          else if (statusCode.includes('R')) changes.renamed++;
        });

      const mainMessage = Object.entries(changes)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => `${count} ${type}`)
        .join(', ');

      return `🎨 Chore: ${mainMessage}`;
    } catch (error) {
      logger.error('获取变更统计失败:', error);
      return '未知变更';
    }
  }

  /**
   * 自动提交并推送更改
   * 包含变更检查、生成提交信息、提交和推送的完整流程
   * @param workspacePath 工作区路径
   * @returns 执行结果消息
   */
  static async autoCommitAndPush(workspacePath: string): Promise<string> {
    try {
      // 检查是否有未提交的更改
      const hasChanges = await this.hasUncommittedChanges(workspacePath);
      if (!hasChanges) {
        return '当前没有未提交的更改';
      }

      // 获取变更摘要
      const changeSummary = await this.getChangesSummary(workspacePath);

      // 生成提交信息
      const commitMessage = `${changeSummary}`;

      // 执行提交并推送
      return await this.commitAndPush(workspacePath, commitMessage);
    } catch (error: any) {
      logger.error('自动提交失败:', error);
      throw new Error(`自动提交失败: ${error.message}`);
    }
  }

  /**
   * 检查分支是否存在
   * @param workspacePath 工作区路径
   * @param branchName 分支名称
   * @returns 分支是否存在
   */
  static async branchExists(workspacePath: string, branchName: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`git branch --list ${branchName}`, {
        cwd: workspacePath,
      });
      return stdout.trim() !== '';
    } catch (error) {
      logger.error(`检查分支${branchName}是否存在失败:`, error);
      return false;
    }
  }

  /**
   * 创建新分支
   * @param workspacePath 工作区路径
   * @param branchName 分支名称
   * @returns 创建结果
   */
  static async createBranch(workspacePath: string, branchName: string): Promise<string> {
    try {
      await execAsync(`git checkout -b ${branchName}`, {
        cwd: workspacePath,
      });
      return `成功创建并切换到${branchName}分支`;
    } catch (error: any) {
      logger.error(`创建分支${branchName}失败:`, error);
      throw new Error(`创建分支失败: ${error.message}`);
    }
  }

  /**
   * 合并分支
   * @param workspacePath 工作区路径
   * @param sourceBranch 源分支
   * @param targetBranch 目标分支
   * @returns 合并结果
   */
  static async mergeBranch(
    workspacePath: string,
    sourceBranch: string,
    targetBranch: string
  ): Promise<string> {
    try {
      // 切换到目标分支
      await execAsync(`git checkout ${targetBranch}`, {
        cwd: workspacePath,
      });

      // 合并源分支
      await execAsync(`git merge ${sourceBranch}`, {
        cwd: workspacePath,
      });

      return `成功将${sourceBranch}分支合并到${targetBranch}分支`;
    } catch (error: any) {
      logger.error(`合并分支失败:`, error);
      throw new Error(`合并分支失败: ${error.message}`);
    }
  }

  /**
   * 获取项目类型
   * @param workspacePath 工作区路径
   * @returns 项目类型
   */
  static async getProjectType(workspacePath: string): Promise<{
    isXcode: boolean;
    hasGithub: boolean;
    githubUrl: string | null;
  }> {
    try {
      const isXcode = fs.existsSync(path.join(workspacePath, '*.xcodeproj')) ||
        fs.existsSync(path.join(workspacePath, '*.xcworkspace'));

      const remoteUrl = await this.getRemoteUrl(workspacePath);
      const hasGithub = remoteUrl?.includes('github.com') ?? false;

      return {
        isXcode,
        hasGithub,
        githubUrl: hasGithub ? remoteUrl : null
      };
    } catch (error) {
      logger.error('获取项目类型失败:', error);
      return {
        isXcode: false,
        hasGithub: false,
        githubUrl: null
      };
    }
  }

  /**
   * 推送当前分支到远程仓库
   * @param workspacePath 工作区路径
   * @returns 推送结果
   */
  static async push(workspacePath: string): Promise<string> {
    try {
      // 获取当前分支
      const currentBranch = await this.getCurrentBranch(workspacePath);

      // 检查是否有远程仓库
      const remoteUrl = await this.getRemoteUrl(workspacePath);
      if (!remoteUrl) {
        throw new Error('未找到远程仓库');
      }

      // 推送到远程仓库
      const { stdout: pushResult } = await execAsync(
        `git push origin ${currentBranch}`,
        { cwd: workspacePath }
      );
      logger.info('已推送到远程仓库:', pushResult);

      return `已成功推送更改到${currentBranch}分支`;
    } catch (error: any) {
      logger.error('推送失败:', error);
      throw new Error(`推送失败: ${error.message}`);
    }
  }

  /**
   * 切换到指定分支
   * @param workspacePath 工作区路径
   * @param branchName 目标分支名称
   * @returns 切换结果
   */
  static async switchBranch(workspacePath: string, branchName: string): Promise<string> {
    try {
      // 检查分支是否存在
      const exists = await this.branchExists(workspacePath, branchName);
      if (!exists) {
        throw new Error(`分支 ${branchName} 不存在`);
      }

      // 切换分支
      const { stdout } = await execAsync(`git checkout ${branchName}`, { cwd: workspacePath });
      logger.info(`已切换到分支: ${branchName}`, stdout);

      return `已切换到${branchName}分支`;
    } catch (error: any) {
      logger.error('切换分支失败:', error);
      throw new Error(`切换分支失败: ${error.message}`);
    }
  }
}
