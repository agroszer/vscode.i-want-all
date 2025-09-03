import * as vscode from "vscode";
import { ITextCompletionItem, TextCompletionManager } from "../textCompletion"; // MODIFIED: Import TextCompletionManager
import { commandList } from "./common";
// import { insertTextCompletion } from "./insertTextCompletion"; // REMOVED

/**
 * Command to insert text completion from double click on tree item
 */
export class TextCompletionDoubleClickCommand implements vscode.Disposable {
  private _disposable: vscode.Disposable[] = [];

  private prevItem: ITextCompletionItem | undefined;
  private prevTime = Date.now();

  // MODIFIED: Add textCompletionManager to constructor
  constructor(private textCompletionManager: TextCompletionManager) {
    this._disposable.push(
      vscode.commands.registerCommand(
        commandList.textCompletionInsertText,
        this.execute,
        this
      )
    );
  }

  /**
   * Emulate double click on tree view completion
   * @param item
   */
  protected async execute(item: ITextCompletionItem) {
    const now = Date.now();
    if (this.prevItem !== item) {
      this.prevItem = item;
      this.prevTime = now;
      return;
    }

    const diff = now - this.prevTime;
    this.prevTime = now;

    if (diff > 500) {
      return;
    }

    // Reset double click
    this.prevItem = undefined;

    // Execute the insertTextCompletion command
    // MODIFIED: Call insertTextCompletion on textCompletionManager instance
    return await this.textCompletionManager.insertTextCompletion(item);
  }

  public dispose() {
    this._disposable.forEach(d => d.dispose());
  }
}
