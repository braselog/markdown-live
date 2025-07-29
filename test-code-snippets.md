# Test Code Snippets in Dropdown Blocks

This file tests whether code snippets work properly in dropdown blocks.

## Working Examples (Outside Dropdowns)

Here's `inline code` that should work fine.

Here's **bold** and *italic* text that works.

## Test Cases for Dropdown Blocks

<details>
  <summary><b>Test 1: Code snippet in summary</b></summary>
  This dropdown has bold text in summary but no code.
</details>

<details>
  <summary>Test with `code snippet` in summary</summary>
  This dropdown has a code snippet in the summary.
</details>

<details>
  <summary><b>Test 3: Code snippet in content</b></summary>
  This dropdown has `inline code` in the content area.
  
  And also **bold** and *italic* text to compare.
</details>

<details>
  <summary><b>Test 4: Multiple formatting types</b></summary>
  This has:
  - **Bold text**
  - *Italic text*  
  - `Inline code`
  - Regular text
</details>

## Expected Behavior

All of these should work:
1. `Code snippets` in summary should be preserved as backticks
2. `Code snippets` in content should be preserved as backticks
3. **Bold** and *italic* should continue working
4. When converting between WYSIWYG and Markdown views, formatting should be preserved