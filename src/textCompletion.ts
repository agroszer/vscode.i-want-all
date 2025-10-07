// Global flag to enable/disable debug logging
const ENABLE_TEXT_COMPLETION_LOG = true;
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
    if (ENABLE_TEXT_COMPLETION_LOG) {
      console.log("onDidChangeTextEditorSelection triggered");
    }
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
    if (ENABLE_TEXT_COMPLETION_LOG) {
      console.log("updateCompletions called with word:", word);
    }

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
    if (ENABLE_TEXT_COMPLETION_LOG) {
      console.log(
        `getCompletions called with word: "${word}" at position:`,
        position
      );
    }
    const config = vscode.workspace.getConfiguration("i-want-all");
    const maxItems = config.get<number>("completionItems", 12);
    const ignoreCase = config.get<boolean>("completionIgnoreCase", false);
    const lookHistory = config.get<boolean>("completionLookHistory", false);
    const fileSizeLimit = config.get<number>("fileSizeLimit", 102400);
    if (ENABLE_TEXT_COMPLETION_LOG) {
      console.log("Configuration:", {
        maxItems,
        ignoreCase,
        lookHistory,
        fileSizeLimit,
      });
    }

    // Helper to escape regex
    const escapeRegExp = (s: string) =>
      s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const safeWord = escapeRegExp(word);
    const regex = new RegExp(`\\b${safeWord}\\w*`, ignoreCase ? "gi" : "g");
    if (ENABLE_TEXT_COMPLETION_LOG) {
      console.log("Using regex:", regex);
    }

    // Helper to find unique, distance-sorted matches in a document
    function findMatchesInText(
      text: string,
      doc: vscode.TextDocument,
      cursorOffset: number,
      word: string,
      regex: RegExp,
      maxItems: number,
      foundWords: Set<string>,
      allMatches: { word: string; distance: number }[]
    ): void {
      if (text.length > fileSizeLimit) {
        if (ENABLE_TEXT_COMPLETION_LOG) {
          console.log(`Skipping: ${doc.uri.toString()}`);
        }
        return;
      }
      let match;
      while ((match = regex.exec(text)) !== null) {
        if (match[0] !== word && !foundWords.has(match[0])) {
          const distance =
            cursorOffset !== -1
              ? Math.abs(match.index - cursorOffset)
              : Infinity;
          allMatches.push({ word: match[0], distance });
          allMatches.sort((a, b) => a.distance - b.distance);
          foundWords.add(match[0]);
          if (foundWords.size >= maxItems) break;
        }
      }
    }

    const foundWords = new Set<string>();
    const allMatches: { word: string; distance: number }[] = [];

    // Always process the current document first
    const currentDoc = vscode.window.activeTextEditor?.document;
    if (currentDoc) {
      try {
        const text = currentDoc.getText();
        const cursorOffset = currentDoc.offsetAt(position);
        findMatchesInText(
          text,
          currentDoc,
          cursorOffset,
          word,
          regex,
          maxItems,
          foundWords,
          allMatches
        );
      } catch (e) {
        console.warn(`Could not read text from current document:`, e);
      }
    }

    // If lookHistory, process all open tabs of type TabInputText
    if (lookHistory && foundWords.size < maxItems) {
      const allTabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
      if (ENABLE_TEXT_COMPLETION_LOG) {
        console.log(`Found ${allTabs.length} tabs:`);
        allTabs.forEach((tab, idx) => {
          const title =
            (tab as any).label || (tab as any).title || "[no title]";
          console.log(`Tab #${idx + 1}: ${title}`);
        });
      }
      for (const tab of allTabs) {
        if (tab.input) {
          const uri = (tab.input as any).uri;
          // Skip current document
          if (currentDoc && currentDoc.uri.toString() === uri.toString()) {
            continue;
          }

          if (ENABLE_TEXT_COMPLETION_LOG) {
            console.log(`Looking in: ${uri.toString()}`);
          }

          try {
            const doc = await vscode.workspace.openTextDocument(uri);
            const text = doc.getText();
            // No cursorOffset for non-active docs
            findMatchesInText(
              text,
              doc,
              -1,
              word,
              regex,
              maxItems,
              foundWords,
              allMatches
            );
          } catch (e) {
            console.warn(
              `Could not read text from tab file:`,
              uri.toString(),
              e
            );
          }
        }
        if (foundWords.size >= maxItems) break;
      }
    }

  // allMatches is kept sorted in findMatchesInText
    if (ENABLE_TEXT_COMPLETION_LOG) {
      console.log(
        "All matches after sorting by distance:",
        allMatches.map(m => m.word)
      );
    }
    return allMatches
      .slice(0, maxItems)
      .map((m, index) => ({ value: m.word, index }));
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
