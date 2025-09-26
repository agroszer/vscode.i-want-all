
import * as assert from "assert";
import * as vscode from "vscode";
import {
  toDisposable,
  leftPad,
  sleep,
  getPrefixChar,
  getPrefix,
  getWordAtPosition,
  replaceWordAtPosition,
} from "../util";

suite("Util Tests", () => {
  test("toDisposable", () => {
    let disposed = false;
    const disposable = toDisposable(() => {
      disposed = true;
    });
    assert.strictEqual(disposed, false);
    disposable.dispose();
    assert.strictEqual(disposed, true);
  });

  test("leftPad", () => {
    assert.strictEqual(leftPad("foo", 5), "  foo");
    assert.strictEqual(leftPad("foo", 3), "foo");
    assert.strictEqual(leftPad("foo", 2), "oo");
    assert.strictEqual(leftPad(1, 3, "0"), "001");
  });

  test("sleep", async () => {
    const start = Date.now();
    await sleep(100);
    const end = Date.now();
    assert.ok(end - start >= 100);
  });

  test("getPrefixChar", () => {
    assert.strictEqual(getPrefixChar(0), "1");
    assert.strictEqual(getPrefixChar(8), "9");
    assert.strictEqual(getPrefixChar(9), "a");
    assert.strictEqual(getPrefixChar(34), "z");
    assert.strictEqual(getPrefixChar(35), "");
  });

  test("getPrefix", () => {
    assert.strictEqual(getPrefix(0), "1| ");
    assert.strictEqual(getPrefix(8), "9| ");
    assert.strictEqual(getPrefix(9), "a| ");
    assert.strictEqual(getPrefix(34), "z| ");
    assert.strictEqual(getPrefix(35), "");
  });

  suite("getWordAtPosition", () => {
    const createDocument = async (content: string) => {
      return await vscode.workspace.openTextDocument({
        content,
        language: "text",
      });
    };

    test("should return undefined for empty line", async () => {
      const doc = await createDocument("");
      const position = new vscode.Position(0, 0);
      assert.strictEqual(getWordAtPosition(doc, position, 1), undefined);
    });

    test("should return word at position", async () => {
      const doc = await createDocument("hello world");
      const position = new vscode.Position(0, 5);
      assert.strictEqual(getWordAtPosition(doc, position, 1)?.word, "hello");
    });

    test("should return word with separator", async () => {
      const doc = await createDocument("hello.world");
      const position = new vscode.Position(0, 11);
      assert.strictEqual(getWordAtPosition(doc, position, 1)?.word, "hello.world");
    });

    test("should return undefined if word is too short", async () => {
      const doc = await createDocument("hi world");
      const position = new vscode.Position(0, 2);
      assert.strictEqual(getWordAtPosition(doc, position, 3), undefined);
    });
  });

  suite("replaceWordAtPosition", () => {
    const createEditor = async (content: string) => {
      const doc = await vscode.workspace.openTextDocument({
        content,
        language: "text",
      });
      return await vscode.window.showTextDocument(doc);
    };

    test("should replace word at position", async () => {
      const editor = await createEditor("hello world");
      const position = new vscode.Position(0, 5);
      await replaceWordAtPosition(editor, position, "goodbye", 1);
      assert.strictEqual(editor.document.getText(), "goodbye world");
    });

    test("should insert word at position if no word exists", async () => {
      const editor = await createEditor("  world");
      const position = new vscode.Position(0, 0);
      await replaceWordAtPosition(editor, position, "hello", 1);
      assert.strictEqual(editor.document.getText(), "hello  world");
    });
  });
});
