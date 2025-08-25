import * as vscode from 'vscode';
import * as path from 'path';
import { getPrefix, getPrefixChar } from '../util';

export class OpenEditorsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined | null | void> = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined | null | void> = this._onDidChangeTreeData.event;

  constructor() {
    vscode.window.tabGroups.onDidChangeTabs(() => {
      this._onDidChangeTreeData.fire();
    });
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
    const editorItems = tabs.map((tab, index) => {
      const item = new vscode.TreeItem(tab.label);
      if (tab.input instanceof vscode.TabInputText) {
        const uri = tab.input.uri;
        const fullPath = uri.fsPath;
        const filename = path.basename(fullPath);
        const dir = path.dirname(fullPath);

        const maxPathLength = 40;
        let truncatedDir = dir;
        if (dir.length > maxPathLength) {
            truncatedDir = '...' + dir.substring(dir.length - maxPathLength);
        }

        item.label = `${getPrefix(index)}${filename}`;
        item.description = truncatedDir;
        item.resourceUri = uri;
        item.command = {
          command: `i-want-all.editors.openItem${getPrefixChar(index)}`,
          title: `Open Editor ${getPrefixChar(index)}`,
        };
      } else {
        item.label = `${getPrefix(index)}${tab.label}`;
      }
      return item;
    });

    return Promise.resolve(editorItems);
  }
}
