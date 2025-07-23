## Test File for WYSIWYG Markdown Editor

This is a test document to verify that the following issues have been fixed:

### 1. Dropdown Summary Duplication Fix

Let's test creating a new dropdown:

<details>
  <summary><b>Test Dropdown</b></summary>
  This is the content inside the dropdown. The summary text should not be duplicated in the markdown output.
</details>

### 2. Enter Key in Summary

- Position cursor at the end of a summary element
- Press Enter to create a new dropdown after the current one

### 3. Adding Content After Tables

Try using the table context menu (⋯) to add content after this table:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Data 1   | Data 2   | Data 3   |
| Test     | More     | Content  |

You should be able to:
1. Hover over the table to see the ⋯ menu
2. Click it and select "Add Content After Table"
3. Type new content in the paragraph that appears

### Test Instructions

1. Open this file in VS Code
2. Run the command "Markdown Live: Start"
3. Test each of the three features above
4. Verify the markdown output is correct when switching to "Markdown" view
