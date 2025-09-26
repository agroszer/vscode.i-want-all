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

const SEPARATORS = " ./:";

export function getWordAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position,
  minWordLength: number
): string | undefined {
  const line = document.lineAt(position.line).text;
  if (position.character === 0) return undefined;
  const uptoCursor = line.substring(0, position.character);
  const prevChar = uptoCursor[uptoCursor.length - 1];
  // If cursor is at a separator, return word before separator plus separator
  if (SEPARATORS.includes(prevChar)) {
    // Find the word before the separator
    const wordMatch = uptoCursor.match(
      new RegExp(`(\\w{${minWordLength},})[${SEPARATORS}]$`)
    );
    return wordMatch ? wordMatch[1] + prevChar : undefined;
  } else {
    // Find the word ending at the cursor
    const wordMatch = uptoCursor.match(new RegExp(`(\\w{${minWordLength},})$`));
    return wordMatch ? wordMatch[1] : undefined;
  }
}

export function replaceWordAtPosition(
  editor: vscode.TextEditor,
  position: vscode.Position,
  newWord: string,
  minWordLength: number
) {
  const currentWord = getWordAtPosition(
    editor.document,
    position,
    minWordLength
  );

  let range: vscode.Range;
  if (currentWord) {
    const startPosition = position.translate(0, -currentWord.length);
    range = new vscode.Range(startPosition, position);
  } else {
    range = new vscode.Range(position, position);
  }

  editor.edit(editBuilder => {
    editBuilder.replace(range, newWord);
  });
}