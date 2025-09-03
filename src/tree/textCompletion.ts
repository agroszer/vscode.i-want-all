import * as vscode from "vscode";
import { commandList } from "../commads/common";
import { TextCompletionManager, ITextCompletionItem } from "../textCompletion";
import { getPrefix } from "../util";

export class TextCompletionItem extends vscode.TreeItem {
  constructor(readonly item: ITextCompletionItem) {
    super(item.value);

    this.contextValue = "textCompletionItem:";
    this.label = this.item.value.replace(/\s+/g, " ").trim();
    this.tooltip = this.item.value;

    this.command = {
      command: commandList.textCompletionInsertText,
      title: "Insert",
      tooltip: "Insert",
      arguments: [this.item],
    };
  }
}

export class TextCompletionTreeDataProvider
  implements vscode.TreeDataProvider<TextCompletionItem>, vscode.Disposable
{
  private _disposables: vscode.Disposable[] = [];

  private _onDidChangeTreeData: vscode.EventEmitter<TextCompletionItem | null> =
    new vscode.EventEmitter<TextCompletionItem | null>();
  public readonly onDidChangeTreeData: vscode.Event<TextCompletionItem | null> =
    this._onDidChangeTreeData.event;

  constructor(protected _manager: TextCompletionManager) {
    this._manager.onDidChangeCompletionList(() => {
      this._onDidChangeTreeData.fire(null);
    });
  }

  public getTreeItem(
    element: TextCompletionItem
  ): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  public getChildren(
    _element?: TextCompletionItem | undefined
  ): vscode.ProviderResult<TextCompletionItem[]> {
    const items = this._manager.completions;

    const childs = items.map((c, index) => {
      const item = new TextCompletionItem(c);
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
