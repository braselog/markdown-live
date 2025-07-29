# Manual Testing Instructions for Code Snippet Fix

## How to Test the Fix

1. **Open VS Code** with the markdown-live extension
2. **Open the test file**: `test-code-snippets.md`
3. **Start the Live Markdown Interpreter**: Use Ctrl+Shift+P and run "Start Live Markdown Interpreter"
4. **Test the following scenarios**:

### Scenario 1: Code in Summary (Fixed Issue)
- Click on a dropdown with code in the summary like: `Test with code snippet in summary`
- Switch to "Markdown" view in the live editor
- **Expected**: Summary should show: `Test with `code snippet` in summary` (backticks, not `<code>` tags)

### Scenario 2: Mixed Formatting in Summary  
- Test dropdowns with both bold and code: `<b>Bold</b> and code together`
- Switch to "Markdown" view
- **Expected**: `<b>Bold</b> and `code` together` (bold stays HTML, code becomes backticks)

### Scenario 3: Code in Content
- Edit content inside dropdowns that has `inline code`
- Switch to "Markdown" view  
- **Expected**: Content should show backticks: `inline code`

### Scenario 4: Backward Compatibility
- Test existing dropdowns with only bold/italic
- **Expected**: Should work exactly as before (no regression)

## Success Criteria
✅ Code snippets in dropdown summaries convert to backticks in markdown
✅ Code snippets in dropdown content convert to backticks in markdown  
✅ Bold (`<b>`) and italic (`<i>`) formatting still preserved as HTML in summaries
✅ No regressions in existing functionality
✅ Switching between Visual and Markdown views preserves formatting correctly

## Technical Details of the Fix
- Modified the `details` turndown rule in `/src/extension.ts`
- Added regex: `/<code[^>]*>(.*?)<\/code>/g` to find code elements
- Replaces with backticks while preserving other HTML formatting
- Uses `String.fromCharCode(96)` to generate backticks (avoids TypeScript issues)