import fs from 'fs';
import path from 'path';
import os from 'os';
import { Logger } from '../utils/logger';
import initSqlJs from 'sql.js';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const logger = new Logger('VSCodeService');

interface SQLiteRow {
  key: string;
  value: Uint8Array;
}

/**
 * VSCode工作空间服务
 */
export class VSCodeService {
  /**
   * 获取VSCode的工作空间路径
   */
  async getWorkspace(): Promise<string | null> {
    try {
      const storagePath = await this.findStoragePath();
      if (!storagePath) {
        logger.error('未找到VSCode存储文件');
        return null;
      }

      // 根据文件类型选择解析方法
      if (storagePath.endsWith('.json')) {
        return this.parseJsonStorage(storagePath);
      } else if (storagePath.endsWith('.vscdb')) {
        return await this.parseSqliteStorage(storagePath);
      }

      return null;
    } catch (error) {
      logger.error('获取VSCode工作空间失败:', error);
      return null;
    }
  }

  /**
   * 查找VSCode存储文件路径
   */
  private async findStoragePath(): Promise<string | null> {
    const home = os.homedir();
    let possiblePaths: string[] = [];

    // 根据操作系统添加可能的路径
    if (process.platform === 'darwin') {
      possiblePaths = [
        path.join(home, 'Library/Application Support/Code/storage.json'),
        path.join(
          home,
          'Library/Application Support/Code/User/globalStorage/state.vscdb'
        ),
        path.join(
          home,
          'Library/Application Support/Code/User/globalStorage/storage.json'
        ),
        path.join(
          home,
          'Library/Application Support/Code - Insiders/storage.json'
        ),
        path.join(
          home,
          'Library/Application Support/Code - Insiders/User/globalStorage/state.vscdb'
        ),
        path.join(
          home,
          'Library/Application Support/Code - Insiders/User/globalStorage/storage.json'
        ),
      ];
    } else if (process.platform === 'win32') {
      const appData = process.env.APPDATA;
      if (appData) {
        possiblePaths = [
          path.join(appData, 'Code/storage.json'),
          path.join(appData, 'Code/User/globalStorage/state.vscdb'),
          path.join(appData, 'Code/User/globalStorage/storage.json'),
        ];
      }
    } else if (process.platform === 'linux') {
      possiblePaths = [
        path.join(home, '.config/Code/storage.json'),
        path.join(home, '.config/Code/User/globalStorage/state.vscdb'),
        path.join(home, '.config/Code/User/globalStorage/storage.json'),
      ];
    }

    // 返回第一个存在的文件路径
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        logger.debug(`找到VSCode存储文件: ${filePath}`);
        return filePath;
      }
    }

    return null;
  }

  /**
   * 解析JSON格式的存储文件
   */
  private async parseJsonStorage(filePath: string): Promise<string | null> {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);
      let workspacePath: string | null = null;

      // 尝试从 openedPathsList 获取
      if (data.openedPathsList?.entries?.[0]?.folderUri) {
        workspacePath = data.openedPathsList.entries[0].folderUri;
      }
      // 尝试从 windowState 获取
      else if (data.windowState?.lastActiveWindow?.folderUri) {
        workspacePath = data.windowState.lastActiveWindow.folderUri;
      }

      if (workspacePath) {
        workspacePath = workspacePath.replace('file://', '');
        return decodeURIComponent(workspacePath);
      }

      return null;
    } catch (error) {
      logger.error('解析JSON存储文件失败:', error);
      return null;
    }
  }

  /**
   * 解析SQLite格式的存储文件
   */
  private async parseSqliteStorage(dbPath: string): Promise<string | null> {
    try {
      // 读取数据库文件
      const fileBuffer = fs.readFileSync(dbPath);

      // 初始化SQL.js
      const SQL = await initSqlJs();

      // 打开数据库
      const db = new SQL.Database(new Uint8Array(fileBuffer));

      // 执行查询
      const query = `SELECT key, value FROM ItemTable WHERE key = 'history.recentlyOpenedPathsList'`;
      const result = db.exec(query);

      // 关闭数据库
      db.close();

      // 检查结果
      if (!result || result.length === 0 || !result[0].values || result[0].values.length === 0) {
        logger.debug('[VSCodeService] No workspace history found in SQLite database');
        return null;
      }

      // 处理结果 - SQL.js返回的是二维数组，其中values[i][0]是key，values[i][1]是value
      for (const row of result[0].values) {
        const key = row[0] as string;
        const value = row[1]; // 可能是Buffer或其他类型

        try {
          // 将value转换为字符串
          let jsonStr: string;
          if (value instanceof Uint8Array) {
            jsonStr = new TextDecoder().decode(value);
          } else if (Buffer.isBuffer(value)) {
            jsonStr = value.toString('utf8');
          } else if (typeof value === 'string') {
            jsonStr = value;
          } else {
            logger.debug(`[VSCodeService] Unsupported value type: ${typeof value}`);
            continue;
          }

          const data = JSON.parse(jsonStr);

          if (!data || !Array.isArray(data.entries)) {
            continue;
          }

          // 过滤并处理工作空间路径
          const workspaces = data.entries
            .filter((entry: any) => entry.folderUri && typeof entry.folderUri === 'string')
            .map((entry: any) => {
              let uri = entry.folderUri;

              // 处理本地文件系统路径
              if (uri.startsWith('file:///')) {
                uri = uri.replace('file://', '');
                // 在 Windows 上需要额外处理
                if (process.platform === 'win32') {
                  uri = uri.replace(/^\//, '');
                }
                return { path: uri, isLocal: true };
              }

              // 处理远程路径（开发容器或SSH）
              if (uri.startsWith('vscode-remote://')) {
                return { path: uri, isLocal: false };
              }

              return null;
            })
            .filter((workspace: any) => workspace !== null);

          // 优先选择本地工作空间
          const localWorkspaces = workspaces.filter((w: any) => w.isLocal);
          if (localWorkspaces.length > 0) {
            // 验证路径是否存在
            for (const workspace of localWorkspaces) {
              if (existsSync(workspace.path)) {
                logger.debug(`[VSCodeService] Found valid local workspace: ${workspace.path}`);
                return workspace.path;
              }
            }
          }

          // 如果没有有效的本地工作空间，返回第一个远程工作空间
          const remoteWorkspaces = workspaces.filter((w: any) => !w.isLocal);
          if (remoteWorkspaces.length > 0) {
            logger.debug(`[VSCodeService] Found remote workspace: ${remoteWorkspaces[0].path}`);
            return remoteWorkspaces[0].path;
          }
        } catch (parseError) {
          logger.debug(`[VSCodeService] Error parsing workspace data: ${parseError}`);
          continue;
        }
      }

      return null;
    } catch (error) {
      logger.debug(`[VSCodeService] Error reading SQLite database: ${error}`);
      return null;
    }
  }
}
