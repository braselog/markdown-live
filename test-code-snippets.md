# Test Code Snippets in Dropdown Blocks

This file tests whether code snippets work properly in dropdown blocks after the fix.

## Working Examples (Outside Dropdowns)

Here's `inline code` that should work fine.

Here's **bold** and *italic* text that works.

## Test Cases for Dropdown Blocks

<details>
  <summary><b>Test 1: Bold only in summary</b></summary>
  This dropdown has bold text in summary but no code.
</details>

<details>
  <summary>Test with `code snippet` in summary</summary>
  This dropdown has a code snippet in the summary that should be converted to backticks in markdown.
</details>

<details>
  <summary><b>Bold</b> and `code` together</summary>
  This combines bold (which should stay as HTML) and code (which should become backticks).
</details>

<details>
  <summary><i>Italic</i> with `code snippet` test</summary>
  This tests italic (HTML) and code (backticks) combination.
</details>

<details>
  <summary><b>Test 5: Code snippet in content</b></summary>
  This dropdown has `inline code` in the content area.
  
  And also **bold** and *italic* text to compare.
  
  Multiple `code snippets` should all work properly.
</details>

<details>
  <summary><b>Test 6: Complex formatting</b></summary>
  This has:
  - **Bold text**
  - *Italic text*  
  - `Inline code`
  - Regular text
  - `Multiple` different `code snippets`
  - Mixed **bold `code` text**
</details>

<details>
  <summary>`Code first` then <b>bold</b></summary>
  Testing order dependency - code first, then bold.
</details>

<details>
  <summary><b>Bold first</b> then `code`</summary>
  Testing order dependency - bold first, then code.
</details>

## Expected Behavior After Fix

All of these should work correctly:
1. `Code snippets` in summary should be converted to backticks in markdown
2. `Code snippets` in content should be converted to backticks in markdown  
3. **Bold** (`<b>`) and *italic* (`<i>`) should remain as HTML in summary for proper rendering
4. When converting between WYSIWYG and Markdown views, formatting should be preserved
5. Multiple `code snippets` in the same element should all be converted
6. Mixed formatting like **bold `code` text** should work properly