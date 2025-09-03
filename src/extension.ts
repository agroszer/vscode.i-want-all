"use strict";
import * as vscode from "vscode";
import { defaultClipboard } from "./clipboard";
import { ApiGetMonitor } from "./commads/apiGetMonitor";
import { ClearClipboardHistory } from "./commads/clearClipboardHistory";
import { commandList } from "./commads/common";
import { CopyToHistoryCommand } from "./commads/copyToHistory";
import { HistoryTreeDoubleClickCommand } from "./commads/historyTreeDoubleClick";
// import { insertTextCompletion } from "./commads/insertTextCompletion"; // REMOVED
import { PickAndPasteCommand } from "./commads/pickAndPaste";
import { RemoveClipboardHistory } from "./commads/removeClipboardHistory";
import { SetClipboardValueCommand } from "./commads/setClipboardValue";
import { ShowClipboardInFile } from "./commads/showClipboardInFile";
import { TextCompletionDoubleClickCommand } from "./commads/textCompletionDoubleClick";
import { ClipboardManager } from "./manager";
import { Monitor } from "./monitor";
import { TextCompletionManager } from "./textCompletion";
import { ClipboardTreeDataProvider } from "./tree/history";
import { OpenEditorsProvider } from "./tree/openEditors";
import { TextCompletionTreeDataProvider } from "./tree/textCompletion";
import { getPrefixChar } from "./util";

import { ClipboardCompletion } from "./completion";

let manager: ClipboardManager;
let textCompletionManager: TextCompletionManager;

// this method is called when your extension is activated
export async function activate(context: vscode.ExtensionContext) {
  const disposable: vscode.Disposable[] = [];

  // Check the clipboard is working
  try {
    await defaultClipboard.readText(); // Read test
  } catch (error: any) {
    console.log(error);
    // Small delay to force show error
    setTimeout(() => {
      if (error.message) {
        vscode.window.showErrorMessage(error.message);
      } else {
        vscode.window.showErrorMessage(
          "Failed to read value from clipboard, check the console log"
        );
      }
    }, 2000);
    // Disable clipboard listening
    defaultClipboard.dispose();
    return;
  }

  // Add to disposable list the default clipboard
  disposable.push(defaultClipboard);

  const monitor = new Monitor(defaultClipboard);
  disposable.push(monitor);

  manager = new ClipboardManager(context, monitor);
  disposable.push(manager);

  textCompletionManager = new TextCompletionManager();
  disposable.push(textCompletionManager);

  // API Commands
  disposable.push(new ApiGetMonitor(monitor));

  // Commands
  disposable.push(new PickAndPasteCommand(manager));
  disposable.push(new HistoryTreeDoubleClickCommand(manager));
  disposable.push(new SetClipboardValueCommand(manager));
  disposable.push(new RemoveClipboardHistory(manager));
  disposable.push(new ShowClipboardInFile(manager));
  disposable.push(new ClearClipboardHistory(manager));
  disposable.push(new CopyToHistoryCommand(monitor));
  disposable.push(new TextCompletionDoubleClickCommand(textCompletionManager)); // MODIFIED

  const completion = new ClipboardCompletion(manager);
  // disposable.push(completion);

  // All files types
  disposable.push(
    vscode.languages.registerCompletionItemProvider(
      {
        scheme: "file",
      },
      completion
    )
  );

  // All files types (New file)
  disposable.push(
    vscode.languages.registerCompletionItemProvider(
      {
        scheme: "untitled",
      },
      completion
    )
  );

  disposable.push(
    vscode.commands.registerCommand(
      commandList.insertTextCompletion,
      textCompletionManager.insertTextCompletion.bind(textCompletionManager) // MODIFIED
    )
  );

  const clipboardTreeDataProvider = new ClipboardTreeDataProvider(manager);
  disposable.push(clipboardTreeDataProvider);

  const textCompletionTreeDataProvider = new TextCompletionTreeDataProvider(
    textCompletionManager
  );

  const openEditorsProvider = new OpenEditorsProvider();

  disposable.push(
    vscode.window.registerTreeDataProvider(
      "managerOpenEditors",
      openEditorsProvider
    )
  );

  disposable.push(
    vscode.window.registerTreeDataProvider(
      "managerClipboardHistory",
      clipboardTreeDataProvider
    )
  );

  disposable.push(
    vscode.window.registerTreeDataProvider(
      "i-want-all.completion",
      textCompletionTreeDataProvider
    )
  );

  const updateConfig = () => {
    const config = vscode.workspace.getConfiguration("i-want-all");
    monitor.checkInterval = config.get("checkInterval", 500);
    monitor.onlyWindowFocused = config.get("onlyWindowFocused", true);
    monitor.maxClipboardSize = config.get("maxClipboardSize", 1000000);
  };
  updateConfig();

  disposable.push(
    vscode.workspace.onDidChangeConfiguration(
      e => e.affectsConfiguration("i-want-all") && updateConfig()
    )
  );

  const pasteItemHandler = (index: number) => async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const item = manager.clips[index];
    if (!item) return;
    await editor.edit(editBuilder => {
      for (const selection of editor.selections) {
        editBuilder.replace(selection, item.value);
      }
    });
  };

  const commandIds: string[] = [];
  for (let i = 0; i < 35; i++) {
    const prefix = getPrefixChar(i);
    const cmd = `i-want-all.editor.pasteItem${prefix}`;
    commandIds.push(cmd);
    disposable.push(vscode.commands.registerCommand(cmd, pasteItemHandler(i)));
  }

  const openEditorHandler = (index: number) => async () => {
    const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
    const tab = tabs[index];
    if (tab && tab.input instanceof vscode.TabInputText) {
      await vscode.window.showTextDocument(tab.input.uri, { preview: false });
    }
  };

  for (let i = 0; i < 35; i++) {
    const prefix = getPrefixChar(i);
    const cmd = `i-want-all.editors.openItem${prefix}`;
    disposable.push(vscode.commands.registerCommand(cmd, openEditorHandler(i)));
  }

  const doubleClickCompletionItemHandler = (index: number) => async () => {
    const item = textCompletionManager.completions[index];
    if (!item) {
      return;
    }
    await vscode.commands.executeCommand(commandList.textCompletionInsertText, item);
  };

  for (let i = 0; i < 35; i++) {
    const prefix = getPrefixChar(i);
    const cmd = `i-want-all.completion.insertTextItem${prefix}`;
    disposable.push(vscode.commands.registerCommand(cmd, doubleClickCompletionItemHandler(i)));
  }

  context.subscriptions.push(...disposable);

  return {
    manager,
    textCompletionManager,
  };
}

// this method is called when your extension is deactivated
export function deactivate() {
  if (manager) {
    manager.saveClips();
  }
}