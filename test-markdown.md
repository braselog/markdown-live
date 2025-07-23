# WYSIWYG Markdown Editor Test

Welcome to the **WYSIWYG Markdown Editor**! This editor works like a *word processor* - you can edit directly in the rendered view.

## Features

- **Direct editing** in the visual preview
- *Real-time* markdown generation 
- `Rich text formatting` with toolbar
- And much more!

Click anywhere in this text to start editing directly!

### Code Block Example

```javascript
function hello() {
    console.log("Hello, World!");
}
```

### List Example

1. First item
2. Second item
3. Third item

- Bullet point one
- Bullet point two

### Dropdown Component

<details>
  <summary><b>Click to expand (this summary is editable!)</b></summary>
  This is the content inside the dropdown. You can put any markdown here!
  
  - Even lists
  - <b>Bold HTML text</b> (note: HTML syntax inside details)
  - And <code>code</code>
</details>

### Quote Example

> This is a blockquote. It can contain multiple lines and other markdown elements.

### Table Example

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Row 1    | Data     | More data|
| Row 2    | Data     | More data|
| **Try clicking on any cell to edit!** | *You can use* | `formatting here` |

### Link Example

[Visit GitHub](https://github.com)

---

## Summary

This enhanced WYSIWYG markdown editor now provides:

- **💾 Manual Save**: Click the save button to force update the markdown file
- **📊 Advanced Table Editing**: Hover over tables to see the context menu (⋯)
- **🔧 Table Operations**: Add/remove rows and columns, move tables, delete tables
- Real-time editing capabilities
- Full markdown syntax support  
- Bidirectional synchronization between editor and VS Code
- Beautiful styling that matches VS Code theme

### Table Features Demo

Try clicking on any cell in this table, then hover over the table to see the ⋯ menu (now in top-left!):

| Feature | Description | Status |
|---------|-------------|--------|
| Context-Aware Operations | Click any cell, then use menu | ✅ |
| Smart Row/Column Adding | Adds relative to clicked cell | ✅ |  
| Precise Movement | Move up/down one position only | ✅ |
| Current Cell Removal | Remove the row/column you clicked | ✅ |

**Instructions:**
1. **Click any cell** to select it
2. **Hover over table** to see ⋯ menu in top-left
3. **Click ⋯** to open context menu
4. **Operations are relative to the cell you clicked!**
