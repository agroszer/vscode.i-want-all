# I want to see everything

[![Version](https://vsmarketplacebadges.dev/version-short/agroszer.i-want-all.svg)](https://marketplace.visualstudio.com/items?itemName=agroszer.i-want-all)
[![Installs](https://vsmarketplacebadges.dev/installs-short/agroszer.i-want-all.svg)](https://marketplace.visualstudio.com/items?itemName=agroszer.i-want-all)
[![Ratings](https://vsmarketplacebadges.dev/rating-short/agroszer.i-want-all.svg)](https://marketplace.visualstudio.com/items?itemName=agroszer.i-want-all)

[![Build Status](https://img.shields.io/github/workflow/status/agroszer/vscode.i-want-all/test.svg)](https://github.com/agroszer/vscode.i-want-all/actions)
[![Lint Status](https://img.shields.io/github/workflow/status/agroszer/vscode.i-want-all/lint.svg?label=lint)](https://github.com/agroszer/vscode.i-want-all/actions)
[![release-it](https://img.shields.io/badge/%F0%9F%93%A6%F0%9F%9A%80-release--it-e10079.svg)](https://github.com/release-it/release-it)

Keep a history of your copied and cut items and re-paste, without overriding the `Ctrl+C` and `Ctrl+V` keyboard shortcuts.

To pick a copied item, only run `Ctrl+Shift+V`

## Features

1. Save history of all copied and cut items
1. Can check copied items outside of VS Code (`"i-want-all.onlyWindowFocused": false`)
1. Paste from history (`Ctrl+Shift+V` => Pick and Paste)
1. Preview the paste
1. Snippets to paste (Ex. `clip1, clip2, ...`)
1. Direct commands to paste `i-want-all.editor.pasteItem1` and so on. Assign keybindings.
1. Remove selected item from history
1. Clear all history
1. Open copy location
1. Double click in history view to paste

## Extension Settings

This extension contributes the following settings (default values):

<!--begin-settings-->
```js
{
  // Avoid duplicate clips in the list
  "i-want-all.avoidDuplicates": true,

  // Time in milliseconds to check changes in clipboard. Set zero to disable.
  "i-want-all.checkInterval": 500,

  // Maximum clipboard size in bytes.
  "i-want-all.maxClipboardSize": 1000000,

  // Maximum number of clips to save in clipboard
  "i-want-all.maxClips": 100,

  // Move used clip to top in the list
  "i-want-all.moveToTop": true,

  // Get clips only from VSCode
  "i-want-all.onlyWindowFocused": true,

  // View a preview while you are choosing the clip
  "i-want-all.preview": true,

  // Set location to save the clipboard file, set false to disable
  "i-want-all.saveTo": null,

  // Enable completion snippets
  "i-want-all.snippet.enabled": true,

  // Maximum number of clips to suggests in snippets (Zero for all)
  "i-want-all.snippet.max": 10,

  // Default prefix for snippets completion (clip1, clip2, ...)
  "i-want-all.snippet.prefix": "clip"
}
```
<!--end-settings-->

## Examples

Copy to history:
![I want to see everything - Copy](screenshots/copy.gif)

Pick and Paste:
![I want to see everything - Pick and Paste](screenshots/pick-and-paste.gif)
