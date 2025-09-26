import * as vscode from "vscode";
import { getWordAtPosition, replaceWordAtPosition, getPrefix } from "./util"; // Import replaceWordAtPosition

export interface ITextCompletionItem {
  value: string;
  index: number | null;
}

export const completionState = {
  lastCompletionItem: null as ITextCompletionItem | null,
};
export class TextCompletionManager implements vscode.Disposable {
  private _disposables: vscode.Disposable[] = [];
  private _completions: ITextCompletionItem[] = [];
  private _onDidChangeCompletionList: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>();
  public readonly onDidChangeCompletionList: vscode.Event<void> =
    this._onDidChangeCompletionList.event;
  private _timer: NodeJS.Timeout | undefined;
  private _lastActiveEditor: vscode.TextEditor | undefined;
  private _lastActivePosition: vscode.Position | undefined;

  constructor() {
    // Update completions on cursor position change
    vscode.window.onDidChangeTextEditorSelection(
      this.onDidChangeTextEditorSelection,
      this,
      this._disposables
    );
  }

  private onDidChangeTextEditorSelection(
    event: vscode.TextEditorSelectionChangeEvent
  ) {
    // console.log("onDidChangeTextEditorSelection triggered");
    const editor = event.textEditor;
    const position = event.selections[0]?.active; // Use optional chaining

    // Check if the active editor or the cursor position has changed
    if (
      editor !== this._lastActiveEditor ||
      (position &&
        this._lastActivePosition &&
        !position.isEqual(this._lastActivePosition))
    ) {
      // Ensure both position and _lastActivePosition are defined
      if (this._timer) {
        clearTimeout(this._timer);
      }
      this._timer = setTimeout(() => {
        this.updateCompletions(event);
        this._lastActiveEditor = editor; // Update last active editor
        this._lastActivePosition = position; // Update last active position
      }, this.getCompletionSpeed());
    }
  }

  private async updateCompletions(
    event: vscode.TextEditorSelectionChangeEvent
  ) {
    const editor = event.textEditor;
    if (!editor) {
      return;
    }

    const position = event.selections[0].active;
    const word = getWordAtPosition(
      editor.document,
      position,
      this.getCompletionMinWordLength()
    );
    // console.log("updateCompletions called with word:", word);

    if (!word) {
      this._completions = [];
      this._onDidChangeCompletionList.fire();
      return;
    }

    this._completions = await this.getCompletions(word, position);
    this._onDidChangeCompletionList.fire();
  }

  private async getCompletions(
    word: string,
    position: vscode.Position
  ): Promise<ITextCompletionItem[]> {
    // console.log(
    //   `getCompletions called with word: "${word}" at position:`,
    //   position
    // );
    const config = vscode.workspace.getConfiguration("i-want-all");
    const maxItems = config.get<number>("completionItems", 12);
    const ignoreCase = config.get<boolean>("completionIgnoreCase", false);
    const lookHistory = config.get<boolean>("completionLookHistory", false);
    const fileSizeLimit = config.get<number>("fileSizeLimit", 102400);
    // console.log("Configuration:", {
    //   maxItems,
    //   ignoreCase,
    //   lookHistory,
    //   fileSizeLimit,
    // });

    const documents = lookHistory
      ? vscode.workspace.textDocuments
      : [vscode.window.activeTextEditor?.document].filter(
          (doc): doc is vscode.TextDocument => doc !== undefined
        );
    // console.log(`Searching in ${documents.length} documents.`);

    // Escape word for regex
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeWord = escapeRegExp(word);
    const regex = new RegExp(`\\b${safeWord}\\w*`, ignoreCase ? "gi" : "g");
    // console.log("Using regex:", regex);

    const activeEditor = vscode.window.activeTextEditor;
    const cursorOffset = activeEditor
      ? activeEditor.document.offsetAt(position)
      : -1;

    const allMatches: { word: string; distance: number }[] = [];

    for (const doc of documents) {
      let text: string;
      try {
        text = doc.getText();
      } catch (e) {
        console.warn(
          `Could not read text from document ${doc.uri.toString()}:`,
          e
        );
        continue;
      }

      if (text.length > fileSizeLimit) {
        // console.log(
        //   `Skipping document ${doc.uri.fsPath} due to size: ${text.length} > ${fileSizeLimit}`
        // );
        continue;
      }
      let match;
      // let matchCount = 0;
      while ((match = regex.exec(text)) !== null) {
        if (match[0] !== word) {
          const distance =
            doc === activeEditor?.document && cursorOffset !== -1
              ? Math.abs(match.index - cursorOffset)
              : Infinity;
          allMatches.push({ word: match[0], distance });
          // matchCount++;
        }
      }
      // console.log(`Found ${matchCount} matches in ${doc.uri.fsPath}`);
    }

    // console.log(
    //   "All matches before sorting:",
    //   allMatches.map(m => m.word)
    // );
    allMatches.sort((a, b) => a.distance - b.distance);
    // console.log(
    //   "All matches after sorting by distance:",
    //   allMatches.map(m => m.word)
    // );

    const words = new Set<string>();
    for (const match of allMatches) {
      if (words.size >= maxItems) {
        break;
      }
      words.add(match.word);
    }

    // console.log("getCompletions found:", Array.from(words));
    return Array.from(words).map((value, index) => ({ value, index }));
  }

  private getCompletionMinWordLength(): number {
    return vscode.workspace
      .getConfiguration("i-want-all")
      .get<number>("completionMinWordLength", 3);
  }

  private getCompletionSpeed(): number {
    return vscode.workspace
      .getConfiguration("i-want-all")
      .get<number>("completionSpeed", 100);
  }

  public completions(
    withLast: boolean,
    prefixed: boolean
  ): ITextCompletionItem[] {
    let items = this._completions.map(item => ({ ...item }));

    if (prefixed) {
      items = items.map((item, index) => {
        const prefixedValue = getPrefix(index)
          ? `${getPrefix(index)}${item.value}`
          : item.value;
        return { value: prefixedValue, index: index };
      });
    }

    if (withLast && completionState.lastCompletionItem) {
      items.unshift({
        value: `last| ${completionState.lastCompletionItem.value}`,
        index: null,
      });
    }

    return items;
  }

  public insertTextCompletion(item: ITextCompletionItem) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }
    completionState.lastCompletionItem = item;
    replaceWordAtPosition(
      editor,
      editor.selection.active,
      item.value,
      this.getCompletionMinWordLength()
    );
  }

  public async insertLastCompletionItem() {
    if (completionState.lastCompletionItem) {
      await this.insertTextCompletion(completionState.lastCompletionItem);
    }
  }

  public dispose() {
    if (this._timer) {
      clearTimeout(this._timer);
    }
    this._disposables.forEach(d => d.dispose());
  }
}
