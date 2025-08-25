import * as vscode from 'vscode';
import { getPrefix } from '../util';

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
        item.resourceUri = tab.input.uri;
        item.command = {
          command: 'vscode.open',
          title: 'Open File',
          arguments: [tab.input.uri],
        };
      }
      item.label = `${getPrefix(index)}${item.label}`;
      return item;
    });

    return Promise.resolve(editorItems);
  }
}
