import * as vscode from "vscode";
import { commandList } from "../commads/common";
import { ClipboardManager, IClipboardItem } from "../manager";
import { getPrefix } from "../util";

export class ClipHistoryItem extends vscode.TreeItem {
  constructor(readonly clip: IClipboardItem) {
    super(clip.value);

    this.contextValue = "clipHistoryItem:";
    this.label = this.clip.value.replace(/\s+/g, " ").trim();
    this.tooltip = this.clip.value;

    this.command = {
      command: commandList.historyTreeDoubleClick,
      title: "Paste",
      tooltip: "Paste",
      arguments: [this.clip],
    };

    if (this.clip.createdLocation) {
      this.resourceUri = this.clip.createdLocation.uri;
      this.contextValue += "file";

      this.tooltip = `File: ${this.resourceUri.fsPath}\nValue: ${this.tooltip}\n`;
    } else {
      const basePath = vscode.Uri.joinPath(
        vscode.Uri.file(__dirname),
        "..",
        "..",
        "..",
        "resources"
      );

      this.iconPath = {
        light: vscode.Uri.joinPath(basePath, "light", "string.svg"),
        dark: vscode.Uri.joinPath(basePath, "dark", "string.svg"),
      };
    }
  }
}

export class ClipboardTreeDataProvider
  implements vscode.TreeDataProvider<ClipHistoryItem>, vscode.Disposable
{
  private _disposables: vscode.Disposable[] = [];

  private _onDidChangeTreeData: vscode.EventEmitter<ClipHistoryItem | null> =
    new vscode.EventEmitter<ClipHistoryItem | null>();
  public readonly onDidChangeTreeData: vscode.Event<ClipHistoryItem | null> =
    this._onDidChangeTreeData.event;

  constructor(protected _manager: ClipboardManager) {
    this._manager.onDidChangeClipList(() => {
      this._onDidChangeTreeData.fire(null);
    });
  }

  public getTreeItem(
    element: ClipHistoryItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(
    _element?: ClipHistoryItem | undefined
  ): vscode.ProviderResult<ClipHistoryItem[]> {
    const clips = this._manager.clips;

    const childs = clips.map((c, index) => {
      const item = new ClipHistoryItem(c);
      const prefix = getPrefix(index);

      item.label = prefix ? `${prefix}${item.label}` : item.label;

      return item;
    });

    return childs;
  }

  public dispose() {
    this._disposables.forEach(d => d.dispose());
  }
}
