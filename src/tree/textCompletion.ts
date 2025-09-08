import * as vscode from "vscode";
import { TextCompletionManager, ITextCompletionItem } from "../textCompletion";
import { getPrefixChar } from "../util";

export class TextCompletionItem extends vscode.TreeItem {
  constructor(readonly item: ITextCompletionItem, readonly index: number) {
    super(item.value);

    this.contextValue = "textCompletionItem:";
    this.label = this.item.value.replace(/\s+/g, " ").trim();
    this.tooltip = this.item.value;
    let prefix: string;
    if (item.index !== null) {
      prefix = getPrefixChar(item.index);
    } else {
      prefix = "Last";
    }

    this.command = {
      command: `i-want-all.completion.insertTextItem${prefix}`,
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
    const items = this._manager.completions(true, true);

    const childs = items.map((c, index) => {
      const item = new TextCompletionItem(c, index);
      return item;
    });

    return childs;
  }

  public dispose() {
    this._disposables.forEach(d => d.dispose());
  }
}
