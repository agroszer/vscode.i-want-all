export interface IDisposable {
  dispose(): void;
}

export function toDisposable(dispose: () => void): IDisposable {
  return { dispose };
}

export function leftPad(
  value: string | number,
  size: number,
  char: string = " "
) {
  const chars = char.repeat(size);

  const paddedNumber = `${chars}${value}`.substr(-chars.length);

  return paddedNumber;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getPrefixChar(index: number): string {
  if (index < 9) return `${index + 1}`;
  if (index < 35) return `${String.fromCharCode(97 + (index - 9))}`;
  return "";
}

export function getPrefix(index: number): string {
  const char = getPrefixChar(index);
  return char ? `${char}| ` : "";
}

import * as vscode from "vscode";

const QWIN_SEPARATORS = " ./:";

export function getWordAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
  minWordLength: number
): string | undefined {
  const line = document
    .lineAt(position.line)
    .text.substring(0, position.character);
  const regex = `(\\w+[${QWIN_SEPARATORS}]?\\w{${minWordLength - 1}})$`;
  const wordMatch = line.match(new RegExp(regex));
  return wordMatch ? wordMatch[1] : undefined;
}

export function replaceWordAtPosition(
  editor: vscode.TextEditor,
  position: vscode.Position,
  newWord: string,
  minWordLength: number
) {
  console.log("replaceWordAtPosition", position, newWord, minWordLength);

  const currentWord = getWordAtPosition(
    editor.document,
    position,
    minWordLength
  );
  let range: vscode.Range;

  console.log("replaceWordAtPosition", currentWord);

  if (currentWord) {
    const startPosition = position.translate(0, -currentWord.length);
    range = new vscode.Range(startPosition, position);
  } else {
    // If no word is found, just insert at the current position
    range = new vscode.Range(position, position);
  }

  console.log("replaceWordAtPosition", range);

  editor.edit(editBuilder => {
    // Erase the current word
    editBuilder.delete(range);
    // Then insert the new word at the start of the original range
    editBuilder.insert(range.start, newWord);
  });
}
