import * as vscode from "vscode";
import * as path from "path";
import { getPrefix, getPrefixChar } from "../util";

export class OpenEditorsProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor() {
    vscode.window.tabGroups.onDidChangeTabs(() => {
      this._onDidChangeTreeData.fire();
    });
    vscode.window.onDidChangeActiveTextEditor(() => {
      this._onDidChangeTreeData.fire();
    });
    vscode.workspace.onDidChangeConfiguration(e => {
      if (
        e.affectsConfiguration("i-want-all.openEditors.displayStyle") ||
        e.affectsConfiguration("i-want-all.openEditors.compactPathLength")
      ) {
        this._onDidChangeTreeData.fire();
      }
    });
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (element) {
      return Promise.resolve([]);
    }

    const config = vscode.workspace.getConfiguration("i-want-all");
    const displayStyle = config.get<string>(
      "openEditors.displayStyle",
      "default"
    );
    const compactPathLength = config.get<number>(
      "openEditors.compactPathLength",
      40
    );

    const activeEditorUri = vscode.window.activeTextEditor?.document.uri;
    const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
    const editorItems = tabs.map((tab, index) => {
      const item = new vscode.TreeItem(tab.label);
      if (tab.input instanceof vscode.TabInputText) {
        const uri = tab.input.uri;
        const fullPath = uri.fsPath;

        if (displayStyle === "compact") {
          let truncatedPath = fullPath;
          if (fullPath.length > compactPathLength) {
            truncatedPath =
              "..." + fullPath.substring(fullPath.length - compactPathLength);
          }
          item.label = `${getPrefix(index)}${truncatedPath}`;
          item.resourceUri = uri;
        } else {
          const filename = path.basename(fullPath);
          const dir = path.dirname(fullPath);
          const maxPathLength = 40;
          let truncatedDir = dir;
          if (dir.length > maxPathLength) {
            truncatedDir = "..." + dir.substring(dir.length - maxPathLength);
          }
          item.label = `${getPrefix(index)}${filename}`;
          item.description = truncatedDir;
          item.resourceUri = uri;
        }

        if (activeEditorUri && uri.fsPath === activeEditorUri.fsPath) {
            if (typeof item.label === "string") {
                const label = item.label
                item.label = {
                    label,
                    highlights: [[0, label.length]],
                };
            }
        }

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
