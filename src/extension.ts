// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// src/extension.ts
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('markdown-live.start', () => {
        // Create and show a new webview panel
        const panel = vscode.window.createWebviewPanel(
            'markdownLive', // Identifies the type of the webview. Used internally
            'Live View', // Title of the panel displayed to the user
            vscode.ViewColumn.Beside, //Active, //.Beside Editor column to show the new webview panel in.
            {
                enableScripts: true, // Enable javascript in the webview
                retainContextWhenHidden: true // Keep the webview alive when hidden
            }
        );

        let isUpdatingFromWebview = false;
        let isUpdatingFromEditor = false;

        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'addComponent':
                        if (message.type === 'dropdown') {
                            insertDropdownComponent();
                        }
                        return;
                    case 'updateContent':
                        // Update the editor content when webview content changes
                        if (!isUpdatingFromWebview) {
                            isUpdatingFromWebview = true;
                            updateEditorContent(message.content);
                            setTimeout(() => {
                                isUpdatingFromWebview = false;
                            }, 100);
                        }
                        return;
                    case 'checkTodo':
                        // Handle checking off a todo item
                        if (editor && message.lineNumber !== undefined) {
                            checkTodoAtLine(editor, message.lineNumber);
                        }
                        return;
                    case 'jumpToTodo':
                        // Handle jumping to a todo location
                        if (editor && message.lineNumber !== undefined) {
                            jumpToLine(panel, editor, message.lineNumber);
                        }
                        return;
                }
            },
            undefined,
            context.subscriptions
        );

        // Set the webview's initial content
        panel.webview.html = getWebviewContent();

        // Get the active editor
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        // Function to update editor content from webview
        function updateEditorContent(content: string) {
            if (editor) {
                const document = editor.document;
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );

                editor.edit(editBuilder => {
                    editBuilder.replace(fullRange, content);
                });
            }
        }

        // Send initial content to webview
        const documentText = editor.document.getText();
        panel.webview.postMessage({
            command: 'updateContent',
            content: documentText
        });

        // Update the view whenever the document changes
        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.toString() === editor.document.uri.toString() && !isUpdatingFromWebview) {
                isUpdatingFromEditor = true;
                const updatedText = e.document.getText();
                panel.webview.postMessage({
                    command: 'updateContent',
                    content: updatedText
                });
                setTimeout(() => {
                    isUpdatingFromEditor = false;
                }, 100);
            }
        });

        // Clean up the subscription when the panel is closed
        panel.onDidDispose(() => {
            changeDocumentSubscription.dispose();
        });
    });

    context.subscriptions.push(disposable);
}

function checkTodoAtLine(editor: vscode.TextEditor, lineNumber: number) {
    const line = editor.document.lineAt(lineNumber);
    const lineText = line.text;

    // Find unchecked todo pattern: - [ ] or * [ ]
    const todoRegex = /^(\s*)([-*])\s+\[\s*\]\s+(.*)$/;
    const match = lineText.match(todoRegex);

    if (match) {
        const indent = match[1];
        const bullet = match[2];
        const content = match[3];
        const newText = `${indent}${bullet} [x] ${content}`;

        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, line.range, newText);
        vscode.workspace.applyEdit(edit);
    }
}

function jumpToLine(panel: vscode.WebviewPanel, editor: vscode.TextEditor, lineNumber: number) {
    // // Reveal in the markdown editor
    // const position = new vscode.Position(lineNumber, 0);
    // editor.selection = new vscode.Selection(position, position);
    // editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenterIfOutsideViewport);

    // Notify the webview to scroll to the element
    panel.webview.postMessage({
        command: 'jumpToElement',
        lineNumber: lineNumber
    });

    // // Switch to the WYSIWYG view if it's not already active
    // panel.reveal(vscode.ViewColumn.Beside, false);
}

function insertDropdownComponent() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return; // No active editor to insert into
    }

    const newComponentText = `
<details>
  <summary><b>New Title</b></summary>
  New content.
</details>
`;

    // Insert the text at the current cursor position
    editor.edit(editBuilder => {
        // editor.selection.active gives you the current cursor position
        editBuilder.insert(editor.selection.active, newComponentText);
    });
}

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WYSIWYG Markdown Editor</title>
        <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/turndown/dist/turndown.js"></script>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                margin: 0;
                padding: 20px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                line-height: 1.6;
            }
            
            .container {
                max-width: 1000px;
                margin: 0 auto;
                height: calc(100vh - 40px);
                display: flex;
                flex-direction: column;
            }
            
            .editor-panel {
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                flex: 1;
            }
            
            .panel-header {
                background-color: var(--vscode-panel-background);
                padding: 8px 12px;
                font-weight: bold;
                font-size: 12px;
                text-transform: uppercase;
                border-bottom: 1px solid var(--vscode-panel-border);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .view-toggle {
                display: flex;
                gap: 4px;
            }
            
            .view-toggle button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 2px 6px;
                border-radius: 2px;
                cursor: pointer;
                font-size: 10px;
            }
            
            .view-toggle button.active {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .toolbar {
                background-color: var(--vscode-panel-background);
                padding: 8px 12px;
                border-bottom: 1px solid var(--vscode-panel-border);
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            
            .toolbar button {
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: none;
                padding: 4px 8px;
                border-radius: 2px;
                cursor: pointer;
                font-size: 11px;
            }
            
            .toolbar button:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .toolbar button.active {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .todo-section {
                background-color: var(--vscode-panel-background);
                border-bottom: 1px solid var(--vscode-panel-border);
                padding: 12px;
                max-height: 200px;
                overflow-y: auto;
                display: none; /* Hidden by default, shown when todos exist */
            }
            
            .todo-section.visible {
                display: block;
            }
            
            .todo-header {
                font-weight: bold;
                font-size: 12px;
                text-transform: uppercase;
                color: var(--vscode-descriptionForeground);
                margin-bottom: 8px;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .todo-count {
                background-color: var(--vscode-badge-background);
                color: var(--vscode-badge-foreground);
                border-radius: 10px;
                padding: 2px 6px;
                font-size: 10px;
                font-weight: normal;
            }
            
            .todo-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .todo-item {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                padding: 4px 0;
                border-bottom: 1px solid var(--vscode-panel-border);
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .todo-item:last-child {
                border-bottom: none;
            }
            
            .todo-item:hover {
                background-color: var(--vscode-list-hoverBackground);
                border-radius: 2px;
                margin: 0 -4px;
                padding: 4px 4px;
            }
            
            .todo-checkbox {
                width: 14px;
                height: 14px;
                border: 1px solid var(--vscode-checkbox-border);
                border-radius: 2px;
                background-color: var(--vscode-checkbox-background);
                cursor: pointer;
                flex-shrink: 0;
                margin-top: 2px;
                position: relative;
            }
            
            .todo-checkbox:hover {
                border-color: var(--vscode-checkbox-selectBorder);
            }
            
            .todo-text {
                flex: 1;
                font-size: 13px;
                line-height: 1.4;
                color: var(--vscode-editor-foreground);
            }
            
            .todo-location {
                font-size: 11px;
                color: var(--vscode-descriptionForeground);
                opacity: 0.8;
                margin-left: auto;
                flex-shrink: 0;
            }
            
            #editor {
                flex: 1;
                border: none;
                outline: none;
                padding: 15px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 14px;
                background-color: var(--vscode-editor-background);
                color: var(--vscode-editor-foreground);
                resize: none;
                line-height: 1.5;
                display: none;
            }
            
            #wysiwyg-editor {
                flex: 1;
                padding: 20px;
                overflow-y: auto;
                background-color: var(--vscode-editor-background);
                outline: none;
                border: none;
                font-size: 14px;
                line-height: 1.6;
            }
            
            #wysiwyg-editor:focus {
                outline: 2px solid var(--vscode-focusBorder);
                outline-offset: -2px;
            }
            
            /* Enhanced Markdown styling for WYSIWYG */
            #wysiwyg-editor h1, #wysiwyg-editor h2, #wysiwyg-editor h3, 
            #wysiwyg-editor h4, #wysiwyg-editor h5, #wysiwyg-editor h6 {
                color: var(--vscode-editor-foreground);
                margin-top: 24px;
                margin-bottom: 16px;
                font-weight: 600;
                line-height: 1.25;
            }
            
            #wysiwyg-editor h1 { 
                font-size: 2em; 
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 8px;
            }
            #wysiwyg-editor h2 { 
                font-size: 1.5em; 
                border-bottom: 1px solid var(--vscode-panel-border);
                padding-bottom: 4px;
            }
            #wysiwyg-editor h3 { font-size: 1.25em; }
            #wysiwyg-editor h4 { font-size: 1em; }
            #wysiwyg-editor h5 { font-size: 0.875em; }
            #wysiwyg-editor h6 { font-size: 0.85em; }
            
            #wysiwyg-editor p {
                margin-bottom: 16px;
                min-height: 1.4em;
            }
            
            #wysiwyg-editor p:empty::before {
                content: attr(data-placeholder);
                color: var(--vscode-descriptionForeground);
                opacity: 0.6;
            }
            
            #wysiwyg-editor code {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                font-size: 85%;
            }
            
            #wysiwyg-editor pre {
                background-color: var(--vscode-textCodeBlock-background);
                padding: 16px;
                border-radius: 6px;
                overflow: auto;
                margin: 16px 0;
                position: relative;
            }
            
            #wysiwyg-editor pre code {
                background: none;
                padding: 0;
            }
            
            #wysiwyg-editor blockquote {
                border-left: 4px solid var(--vscode-panel-border);
                padding-left: 16px;
                margin: 16px 0;
                color: var(--vscode-descriptionForeground);
                font-style: italic;
            }
            
            #wysiwyg-editor ul, #wysiwyg-editor ol {
                padding-left: 2em;
                margin: 16px 0;
            }
            
            #wysiwyg-editor li {
                margin: 4px 0;
            }
            
            #wysiwyg-editor table {
                border-collapse: collapse;
                width: 100%;
                margin: 16px 0;
                position: relative;
            }
            
            #wysiwyg-editor th, #wysiwyg-editor td {
                border: 1px solid var(--vscode-panel-border);
                padding: 8px 12px;
                text-align: left;
                min-width: 100px;
                position: relative;
            }
            
            #wysiwyg-editor th {
                background-color: var(--vscode-panel-background);
                font-weight: 600;
            }
            
            #wysiwyg-editor table:hover th,
            #wysiwyg-editor table:hover td {
                border-color: var(--vscode-focusBorder);
            }
            
            #wysiwyg-editor th:focus,
            #wysiwyg-editor td:focus {
                outline: 2px solid var(--vscode-focusBorder);
                outline-offset: -2px;
                background-color: var(--vscode-list-hoverBackground);
            }
            
            /* Table context menu */
            .table-menu {
                position: absolute;
                top: -8px;
                left: -8px;
                background-color: var(--vscode-button-background);
                color: var(--vscode-button-foreground);
                border: 1px solid var(--vscode-panel-border);
                border-radius: 3px;
                padding: 4px;
                cursor: pointer;
                font-size: 12px;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.2s;
            }
            
            #wysiwyg-editor table:hover .table-menu {
                opacity: 1;
            }
            
            .table-menu:hover {
                background-color: var(--vscode-button-hoverBackground);
            }
            
            .table-context-menu {
                position: absolute;
                background-color: var(--vscode-menu-background);
                border: 1px solid var(--vscode-menu-border);
                border-radius: 3px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                z-index: 1001;
                min-width: 150px;
                display: none;
            }
            
            .table-context-menu .menu-item {
                padding: 8px 12px;
                cursor: pointer;
                border-bottom: 1px solid var(--vscode-menu-separatorBackground);
                font-size: 12px;
            }
            
            .table-context-menu .menu-item:hover {
                background-color: var(--vscode-menu-selectionBackground);
                color: var(--vscode-menu-selectionForeground);
            }
            
            .table-context-menu .menu-item:last-child {
                border-bottom: none;
            }
            
            .table-context-menu .menu-separator {
                height: 1px;
                background-color: var(--vscode-menu-separatorBackground);
                margin: 4px 0;
            }
            
            #wysiwyg-editor a {
                color: var(--vscode-textLink-foreground);
                text-decoration: none;
            }
            
            #wysiwyg-editor a:hover {
                text-decoration: underline;
            }
            
            #wysiwyg-editor img {
                max-width: 100%;
                height: auto;
            }
            
            #wysiwyg-editor hr {
                border: none;
                border-top: 1px solid var(--vscode-panel-border);
                margin: 24px 0;
            }
            
            #wysiwyg-editor details {
                border: 1px solid var(--vscode-panel-border);
                border-radius: 4px;
                padding: 0;
                margin: 16px 0;
            }
            
            #wysiwyg-editor summary {
                background-color: var(--vscode-panel-background);
                padding: 12px;
                cursor: pointer;
                font-weight: 600;
                border-radius: 4px 4px 0 0;
                outline: none;
            }
            
            #wysiwyg-editor summary:focus {
                outline: 2px solid var(--vscode-focusBorder);
                outline-offset: -2px;
                background-color: var(--vscode-list-hoverBackground);
            }
            
            #wysiwyg-editor summary:hover {
                background-color: var(--vscode-list-hoverBackground);
            }
            
            #wysiwyg-editor details[open] summary {
                border-bottom: 1px solid var(--vscode-panel-border);
                border-radius: 4px 4px 0 0;
            }
            
            #wysiwyg-editor details > *:not(summary) {
                padding: 12px;
            }
            
            #wysiwyg-editor details div {
                outline: none;
            }
            
            /* Selection and editing indicators */
            #wysiwyg-editor *:hover {
                outline: 1px dashed var(--vscode-focusBorder);
                outline-offset: 1px;
            }
            
            #wysiwyg-editor *:focus {
                outline: 2px solid var(--vscode-focusBorder);
                outline-offset: 1px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="editor-panel">
                <div class="panel-header">
                    <span>WYSIWYG Markdown Editor</span>
                    <div class="view-toggle">
                        <button id="wysiwyg-btn" class="active" onclick="switchToWysiwyg()">Visual</button>
                        <button id="markdown-btn" onclick="switchToMarkdown()">Markdown</button>
                    </div>
                </div>
                <div class="toolbar">
                    <button onclick="formatText('bold')" title="Bold (Ctrl+B)">B</button>
                    <button onclick="formatText('italic')" title="Italic (Ctrl+I)">I</button>
                    <button onclick="formatText('code')" title="Inline Code">Code</button>
                    <button onclick="insertHeading(1)" title="Heading 1">H1</button>
                    <button onclick="insertHeading(2)" title="Heading 2">H2</button>
                    <button onclick="insertHeading(3)" title="Heading 3">H3</button>
                    <button onclick="formatText('unorderedList')" title="Bullet List">• List</button>
                    <button onclick="formatText('orderedList')" title="Numbered List">1. List</button>
                    <button onclick="insertLink()" title="Insert Link">Link</button>
                    <button onclick="insertBlockquote()" title="Quote">Quote</button>
                    <button onclick="insertCodeBlock()" title="Code Block">{}</button>
                    <button onclick="insertTable()" title="Insert Table">Table</button>
                    <button onclick="insertDropdown()" title="Dropdown">Dropdown</button>
                    <button onclick="insertHorizontalRule()" title="Horizontal Rule">---</button>
                    <button onclick="insertTodoList()" title="To-Do List">- [ ]</button>
                    <button onclick="saveContent()" title="Save Changes">💾 Save</button>
                </div>
                
                <!-- Todo Section -->
                <div id="todo-section" class="todo-section">
                    <div class="todo-header">
                        <span>To-Do Items</span>
                        <span id="todo-count" class="todo-count">0</span>
                    </div>
                    <ul id="todo-list" class="todo-list">
                        <!-- Todo items will be dynamically populated here -->
                    </ul>
                </div>
                
                <div id="wysiwyg-editor" contenteditable="true" 
                     data-placeholder="Start typing your content here...">
                </div>
                
                <textarea id="editor" placeholder="Markdown source code..."></textarea>
            </div>
        </div>

        <!-- Table context menu -->
        <div id="table-context-menu" class="table-context-menu">
            <div class="menu-item" onclick="addRowAbove()">Add Row Above Current</div>
            <div class="menu-item" onclick="addRowBelow()">Add Row Below Current</div>
            <div class="menu-item" onclick="addColumnLeft()">Add Column Left of Current</div>
            <div class="menu-item" onclick="addColumnRight()">Add Column Right of Current</div>
            <div class="menu-separator"></div>
            <div class="menu-item" onclick="removeCurrentRow()">Remove Current Row</div>
            <div class="menu-item" onclick="removeCurrentColumn()">Remove Current Column</div>
            <div class="menu-separator"></div>
            <div class="menu-item" onclick="moveTableUp()">Move Table Up One Position</div>
            <div class="menu-item" onclick="moveTableDown()">Move Table Down One Position</div>
            <div class="menu-separator"></div>
            <div class="menu-item" onclick="addContentAfterTable()">Add Content After Table</div>
            <div class="menu-separator"></div>
            <div class="menu-item" onclick="deleteTable()" style="color: var(--vscode-errorForeground)">Delete Entire Table</div>
        </div>

        <script>
            const vscode = acquireVsCodeApi();
            const wysiwygEditor = document.getElementById('wysiwyg-editor');
            const markdownEditor = document.getElementById('editor');
            const wysiwygBtn = document.getElementById('wysiwyg-btn');
            const markdownBtn = document.getElementById('markdown-btn');
            
            let isUpdatingFromExtension = false;
            let isWysiwygMode = true;
            let turndownService = null;
            let updateTimeout;
            let currentMarkdownText = '';

            // Todo functionality
            function parseTodosFromMarkdown(markdownText) {
                const todos = [];
                const lines = markdownText.split('\\n');
                
                lines.forEach((line, index) => {
                    // Match unchecked todo items: - [ ] or * [ ]
                    const todoMatch = line.match(/^(\\s*)([-*])\\s+\\[\\s*\\]\\s+(.+)$/);
                    if (todoMatch) {
                        todos.push({
                            lineNumber: index,
                            text: todoMatch[3].trim(),
                            indent: todoMatch[1],
                            bullet: todoMatch[2]
                        });
                    }
                });
                
                return todos;
            }
            
            function updateTodoSection(markdownText) {
                currentMarkdownText = markdownText;
                const todos = parseTodosFromMarkdown(markdownText);
                const todoSection = document.getElementById('todo-section');
                const todoList = document.getElementById('todo-list');
                const todoCount = document.getElementById('todo-count');
                
                // Clear existing todos
                todoList.innerHTML = '';
                
                if (todos.length === 0) {
                    todoSection.classList.remove('visible');
                    return;
                }
                
                // Show todo section and update count
                todoSection.classList.add('visible');
                todoCount.textContent = todos.length;
                
                // Add todo items
                todos.forEach(todo => {
                    const todoItem = document.createElement('li');
                    todoItem.className = 'todo-item';
                    todoItem.innerHTML = 
                        '<div class="todo-checkbox" data-line="' + todo.lineNumber + '"></div>' +
                        '<span class="todo-text">' + escapeHtml(todo.text) + '</span>' +
                        '<span class="todo-location">Line ' + (todo.lineNumber + 1) + '</span>';
                    
                    // Handle checkbox click
                    const checkbox = todoItem.querySelector('.todo-checkbox');
                    checkbox.addEventListener('click', (e) => {
                        e.stopPropagation();
                        vscode.postMessage({
                            command: 'checkTodo',
                            lineNumber: todo.lineNumber
                        });
                    });
                    
                    // Handle item click (jump to location)
                    todoItem.addEventListener('click', () => {
                        vscode.postMessage({
                            command: 'jumpToTodo',
                            lineNumber: todo.lineNumber
                        });
                    });
                    
                    todoList.appendChild(todoItem);
                });
            }
            
            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // Initialize Turndown service when available
            function initializeTurndown() {
                if (typeof TurndownService !== 'undefined') {
                    turndownService = new TurndownService({
                        headingStyle: 'atx',
                        codeBlockStyle: 'fenced',
                        emDelimiter: '*',
                        strongDelimiter: '**'
                    });
                    
                    // Custom rules for better markdown conversion
                    turndownService.addRule('details', {
                        filter: 'details',
                        replacement: function (content, node) {
                            const summary = node.querySelector('summary');
                            // Use innerHTML to preserve formatting like <b>, <i>, etc.
                            const summaryContent = summary ? summary.innerHTML : 'Details';
                            
                            // The rest of the content needs to be converted from HTML to Markdown.
                            // We can't just use 'content' because that is already converted and includes the summary.
                            // We need to rebuild the content from the child nodes, skipping the summary.
                            let detailsContent = '';
                            let childNodeStartPrev = '';
                            let childNodeStartCur = '';
                            for (const childNode of node.childNodes) {
                                if (childNode.nodeName.toLowerCase() !== 'summary') {
                                    const nodeContent = childNode.outerHTML || childNode.textContent || '';
                                    // const childNodeStartCur = nodeContent.charAt(0);

                                    // detailsContent += '\\n\\n';
                                    // detailsContent += childNodeStartCur
                                    // detailsContent += '\\n\\n';

                                    detailsContent += turndownService.turndown(nodeContent);
                                    // if (((childNodeStartPrev === '-' && childNodeStartCur !== '-') || (childNodeStartPrev !== '-' && childNodeStartCur === '-')) && childNodeStartPrev !== '') {
                                    //     detailsContent += '\\n'; // Add an additional newline between nodes of different types (list items or paragraphs)
                                    // }
                                    detailsContent += '\\n\\n'; // Add a newline after each child node
                                    // childNodeStartPrev = childNodeStartCur; // Update for next iteration
                                }
                            }
                            
                            return '\\n<details>\\n  <summary>' + summaryContent + '</summary>' + detailsContent + '</details>\\n';
                        }
                    });
                    
                    // This rule is buggy because it relies on node.closest(), which doesn't work
                    // when turndown is called on a string of HTML. The new 'details' rule handles this correctly.
                    /* turndownService.addRule('preserveHtmlInDetails', {
                        filter: function (node, options) {
                            return (
                                node.nodeName === 'B' || 
                                node.nodeName === 'STRONG' || 
                                node.nodeName === 'I' || 
                                node.nodeName === 'EM'
                            ) && node.closest('details, summary');
                        },
                        replacement: function (content, node) {
                            return '<' + node.nodeName.toLowerCase() + '>' + content + '</' + node.nodeName.toLowerCase() + '>';
                        }
                    }); */
                    
                    // Handle tables properly
                    turndownService.addRule('table', {
                        filter: 'table',
                        replacement: function (content, node) {
                            const rows = Array.from(node.querySelectorAll('tr'));
                            const tableContent = rows.map((row, index) => {
                                const cells = Array.from(row.querySelectorAll('td, th'));
                                const rowContent = '| ' + cells.map(cell => cell.textContent.trim()).join(' | ') + ' |';
                                
                                if (index === 0 && row.querySelector('th')) {
                                    const separator = '|' + cells.map(() => '----------|').join('');
                                    return rowContent + '\\n' + separator;
                                }
                                return rowContent;
                            }).join('\\n');
                            
                            return '\\n' + tableContent + '\\n';
                        }
                    });
                    
                    // Handle todo/checkbox list items
                    turndownService.addRule('todoListItem', {
                        filter: function (node, options) {
                            return node.nodeName === 'LI' && (node.firstChild instanceof HTMLInputElement && node.firstChild.type === 'checkbox');
                        },
                        replacement: function (content, node, options) {
                            const checkbox = node.firstChild;
                            const isChecked = checkbox.checked;
                            const checkboxSymbol = isChecked ? '[x]' : '[ ]';
                            
                            // The content will include the checkbox text, so we need to remove it
                            let textContent = content.trim();
                            
                            // Simple way to handle indentation
                            let indent = '';
                            let parent = node.parentNode;
                            let count = 0;
                            while (parent && parent.nodeName !== 'BODY') {
                                count++;
                                if (count == 1) {
                                    parent = parent.parentNode;
                                    continue; // Skip the first parent (the LI itself)
                                }
                                if (parent.nodeName === 'UL' || parent.nodeName === 'OL') {
                                    indent += '  ';
                                }
                                parent = parent.parentNode;
                            }
                            
                            return indent + '- ' + checkboxSymbol + ' ' + textContent + '\\n';
                        }
                    });
                    
                    console.log('Turndown service initialized');
                } else {
                    setTimeout(initializeTurndown, 100);
                }
            }

            // Debounce function
            function debounce(func, wait) {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            }

            // Convert HTML to Markdown
            function htmlToMarkdown(html) {
                if (turndownService) {
                    return turndownService.turndown(html);
                }
                return html; // Fallback
            }

            // Convert Markdown to HTML
            function markdownToHtml(markdown) {
                if (typeof marked === 'undefined') {
                    return markdown; // Fallback
                }
            
                // Simply parse the markdown without special details processing
                // This will preserve the original details structure
                return marked.parse(markdown);
            }

            // Make content editable after rendering
            function makeContentEditable() {
                // Make all table cells editable and add menus to tables
                const tables = wysiwygEditor.querySelectorAll('table');
                tables.forEach(table => {
                    makeTableEditable(table);
                    
                    // Add table menu if it doesn't exist
                    if (!table.querySelector('.table-menu')) {
                        const tableMenu = document.createElement('div');
                        tableMenu.className = 'table-menu';
                        tableMenu.innerHTML = '⋯';
                        tableMenu.onclick = function(e) {
                            e.stopPropagation();
                            showTableContextMenu(e, table);
                        };
                        table.style.position = 'relative';
                        table.appendChild(tableMenu);
                    }
                });
                
                // Make all summaries editable
                const summaries = wysiwygEditor.querySelectorAll('summary');
                summaries.forEach(summary => {
                    summary.contentEditable = 'true';
                });
                
                // Make details content editable
                const detailsContents = wysiwygEditor.querySelectorAll('details > *:not(summary)');
                detailsContents.forEach(content => {
                    content.contentEditable = 'true';
                });
            }

            // Update content and sync with VS Code
            function updateMarkdown() {
                if (!isUpdatingFromExtension) {
                    let content;
                    if (isWysiwygMode) {
                        content = htmlToMarkdown(wysiwygEditor.innerHTML);
                    } else {
                        content = markdownEditor.value;
                    }
                    
                    // Update todo section with current content
                    updateTodoSection(content);
                    
                    vscode.postMessage({
                        command: 'updateContent',
                        content: content
                    });
                }
            }

            // Switch between WYSIWYG and Markdown modes
            function switchToWysiwyg() {
                if (!isWysiwygMode) {
                    const markdown = markdownEditor.value;
                    wysiwygEditor.innerHTML = markdownToHtml(markdown);
                    makeContentEditable();
                    markdownEditor.style.display = 'none';
                    wysiwygEditor.style.display = 'block';
                    wysiwygBtn.classList.add('active');
                    markdownBtn.classList.remove('active');
                    isWysiwygMode = true;
                    wysiwygEditor.focus();
                }
            }

            function switchToMarkdown() {
                if (isWysiwygMode) {
                    const markdown = htmlToMarkdown(wysiwygEditor.innerHTML);
                    markdownEditor.value = markdown;
                    wysiwygEditor.style.display = 'none';
                    markdownEditor.style.display = 'block';
                    markdownBtn.classList.add('active');
                    wysiwygBtn.classList.remove('active');
                    isWysiwygMode = false;
                    markdownEditor.focus();
                }
            }

            // Format text functions
            function formatText(command) {
                document.execCommand(command, false, null);
                wysiwygEditor.focus();
                debouncedUpdate();
            }

            function insertTodoList() {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);

                const li = document.createElement('li');
                li.innerHTML = '<input type="checkbox"> ';

                // If the current selection is in a list, insert it there.
                // Otherwise, create a new list.
                const parentList = range.startContainer.closest('ul, ol');

                if (parentList) {
                    parentList.appendChild(li);
                } else {
                    const ul = document.createElement('ul');
                    ul.appendChild(li);
                    range.deleteContents();
                    range.insertNode(ul);
                }

                // Move cursor to the new to-do item
                range.setStart(li, 1);
                range.collapse(true);
                selection.removeAllRanges();
                selection.addRange(range);

                wysiwygEditor.focus();
                debouncedUpdate();
            }

            function insertHeading(level) {
                document.execCommand('formatBlock', false, 'h' + level);
                wysiwygEditor.focus();
                debouncedUpdate();
            }

            function insertLink() {
                const url = prompt('Enter URL:');
                if (url) {
                    document.execCommand('createLink', false, url);
                    wysiwygEditor.focus();
                    debouncedUpdate();
                }
            }

            function insertBlockquote() {
                document.execCommand('formatBlock', false, 'blockquote');
                wysiwygEditor.focus();
                debouncedUpdate();
            }

            function insertCodeBlock() {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                
                const pre = document.createElement('pre');
                const code = document.createElement('code');
                code.textContent = 'Your code here';
                pre.appendChild(code);
                
                range.deleteContents();
                range.insertNode(pre);
                
                // Position cursor inside code block
                range.setStart(code, 0);
                range.setEnd(code, 1);
                selection.removeAllRanges();
                selection.addRange(range);
                
                wysiwygEditor.focus();
                debouncedUpdate();
            }

            function insertTable() {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                
                // Add paragraph breaks before and after table
                const beforePara = document.createElement('p');
                beforePara.innerHTML = '&nbsp;';
                
                const table = document.createElement('table');
                table.innerHTML = '<tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr>' +
                                '<tr><td>Row 1 Col 1</td><td>Row 1 Col 2</td><td>Row 1 Col 3</td></tr>' +
                                '<tr><td>Row 2 Col 1</td><td>Row 2 Col 2</td><td>Row 2 Col 3</td></tr>';
                
                // Add table menu
                const tableMenu = document.createElement('div');
                tableMenu.className = 'table-menu';
                tableMenu.innerHTML = '⋯';
                tableMenu.onclick = function(e) {
                    e.stopPropagation();
                    showTableContextMenu(e, table);
                };
                table.style.position = 'relative';
                table.appendChild(tableMenu);
                
                const afterPara = document.createElement('p');
                afterPara.innerHTML = '&nbsp;';
                
                range.deleteContents();
                range.insertNode(afterPara);
                range.insertNode(table);
                range.insertNode(beforePara);
                
                // Make table cells editable
                makeTableEditable(table);
                
                // Focus on first cell
                const firstCell = table.querySelector('th');
                if (firstCell) {
                    range.setStart(firstCell, 0);
                    range.setEnd(firstCell, 1);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                
                wysiwygEditor.focus();
                debouncedUpdate();
            }

            function insertDropdown() {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                
                const details = document.createElement('details');
                const summary = document.createElement('summary');
                summary.innerHTML = '<b>Click to expand</b>';
                summary.contentEditable = 'true';
                const content = document.createElement('div');
                content.innerHTML = '<p>Content goes here. You can add <b>bold</b>, <i>italic</i>, and other formatting.</p>';
                
                details.appendChild(summary);
                details.appendChild(content);
                
                range.deleteContents();
                range.insertNode(details);
                
                // Focus on summary for editing
                range.setStart(summary, 0);
                range.setEnd(summary, 1);
                selection.removeAllRanges();
                selection.addRange(range);
                
                wysiwygEditor.focus();
                debouncedUpdate();
            }

            function insertHorizontalRule() {
                const selection = window.getSelection();
                const range = selection.getRangeAt(0);
                
                const hr = document.createElement('hr');
                range.deleteContents();
                range.insertNode(hr);
                
                wysiwygEditor.focus();
                debouncedUpdate();
            }

            // Save function to force update
            function saveContent() {
                if (isWysiwygMode) {
                    const content = htmlToMarkdown(wysiwygEditor.innerHTML);
                    vscode.postMessage({
                        command: 'updateContent',
                        content: content
                    });
                } else {
                    vscode.postMessage({
                        command: 'updateContent',
                        content: markdownEditor.value
                    });
                }
            }

            // Table helper functions
            let currentTable = null;
            let currentCell = null;

            function makeTableEditable(table) {
                const cells = table.querySelectorAll('td, th');
                cells.forEach(cell => {
                    cell.contentEditable = 'true';
                    cell.addEventListener('keydown', function(e) {
                        if (e.key === 'Tab') {
                            e.preventDefault();
                            const nextCell = e.shiftKey ? 
                                this.previousElementSibling || this.parentElement.previousElementSibling?.lastElementChild :
                                this.nextElementSibling || this.parentElement.nextElementSibling?.firstElementChild;
                            if (nextCell && (nextCell.tagName === 'TD' || nextCell.tagName === 'TH')) {
                                nextCell.focus();
                            }
                        }
                    });
                    
                    // Track current cell when clicked
                    cell.addEventListener('click', function() {
                        currentCell = this;
                    });
                });
            }

            function showTableContextMenu(event, table) {
                currentTable = table;
                const menu = document.getElementById('table-context-menu');
                menu.style.display = 'block';
                menu.style.left = event.pageX + 'px';
                menu.style.top = event.pageY + 'px';
                
                // Close menu when clicking elsewhere
                setTimeout(() => {
                    document.addEventListener('click', function closeMenu(e) {
                        if (!menu.contains(e.target)) {
                            menu.style.display = 'none';
                            document.removeEventListener('click', closeMenu);
                        }
                    });
                }, 100);
            }

            function getCurrentCellPosition() {
                if (!currentCell || !currentTable) return null;
                const row = currentCell.parentElement;
                const rowIndex = Array.from(currentTable.querySelectorAll('tr')).indexOf(row);
                const cellIndex = Array.from(row.children).indexOf(currentCell);
                return { rowIndex, cellIndex };
            }

            function addRowAbove() {
                if (!currentTable) return;
                const position = getCurrentCellPosition();
                const targetRowIndex = position ? position.rowIndex : 0;
                const rows = currentTable.querySelectorAll('tr');
                const targetRow = rows[targetRowIndex];
                const cellCount = targetRow.children.length;
                
                const newRow = document.createElement('tr');
                for (let i = 0; i < cellCount; i++) {
                    const newCell = document.createElement('td');
                    newCell.contentEditable = 'true';
                    newCell.textContent = 'New cell';
                    newCell.addEventListener('click', function() { currentCell = this; });
                    newRow.appendChild(newCell);
                }
                
                currentTable.insertBefore(newRow, targetRow);
                document.getElementById('table-context-menu').style.display = 'none';
                debouncedUpdate();
            }

            function addRowBelow() {
                if (!currentTable) return;
                const position = getCurrentCellPosition();
                const targetRowIndex = position ? position.rowIndex : currentTable.querySelectorAll('tr').length - 1;
                const rows = currentTable.querySelectorAll('tr');
                const targetRow = rows[targetRowIndex];
                const cellCount = targetRow.children.length;
                
                const newRow = document.createElement('tr');
                for (let i = 0; i < cellCount; i++) {
                    const newCell = document.createElement('td');
                    newCell.contentEditable = 'true';
                    newCell.textContent = 'New cell';
                    newCell.addEventListener('click', function() { currentCell = this; });
                    newRow.appendChild(newCell);
                }
                
                const nextRow = targetRow.nextElementSibling;
                if (nextRow) {
                    currentTable.insertBefore(newRow, nextRow);
                } else {
                    currentTable.appendChild(newRow);
                }
                
                document.getElementById('table-context-menu').style.display = 'none';
                debouncedUpdate();
            }

            function addColumnLeft() {
                if (!currentTable) return;
                const position = getCurrentCellPosition();
                const targetCellIndex = position ? position.cellIndex : 0;
                const rows = currentTable.querySelectorAll('tr');
                
                rows.forEach((row, rowIndex) => {
                    const newCell = document.createElement(rowIndex === 0 ? 'th' : 'td');
                    newCell.contentEditable = 'true';
                    newCell.textContent = rowIndex === 0 ? 'New Header' : 'New cell';
                    newCell.addEventListener('click', function() { currentCell = this; });
                    
                    const targetCell = row.children[targetCellIndex];
                    if (targetCell) {
                        row.insertBefore(newCell, targetCell);
                    } else {
                        row.appendChild(newCell);
                    }
                });
                
                document.getElementById('table-context-menu').style.display = 'none';
                debouncedUpdate();
            }

            function addColumnRight() {
                if (!currentTable) return;
                const position = getCurrentCellPosition();
                const targetCellIndex = position ? position.cellIndex : currentTable.querySelector('tr').children.length - 1;
                const rows = currentTable.querySelectorAll('tr');
                
                rows.forEach((row, rowIndex) => {
                    const newCell = document.createElement(rowIndex === 0 ? 'th' : 'td');
                    newCell.contentEditable = 'true';
                    newCell.textContent = rowIndex === 0 ? 'New Header' : 'New cell';
                    newCell.addEventListener('click', function() { currentCell = this; });
                    
                    const targetCell = row.children[targetCellIndex];
                    const nextCell = targetCell ? targetCell.nextElementSibling : null;
                    if (nextCell) {
                        row.insertBefore(newCell, nextCell);
                    } else {
                        row.appendChild(newCell);
                    }
                });
                
                document.getElementById('table-context-menu').style.display = 'none';
                debouncedUpdate();
            }

            function removeCurrentRow() {
                if (!currentTable || !currentCell) return;
                const rows = currentTable.querySelectorAll('tr');
                if (rows.length <= 1) return; // Don't remove if only one row
                
                const currentRow = currentCell.parentElement;
                currentRow.remove();
                
                document.getElementById('table-context-menu').style.display = 'none';
                debouncedUpdate();
            }

            function removeCurrentColumn() {
                if (!currentTable || !currentCell) return;
                const position = getCurrentCellPosition();
                if (!position) return;
                
                const rows = currentTable.querySelectorAll('tr');
                const firstRow = rows[0];
                if (firstRow.children.length <= 1) return; // Don't remove if only one column
                
                rows.forEach(row => {
                    const cellToRemove = row.children[position.cellIndex];
                    if (cellToRemove) {
                        cellToRemove.remove();
                    }
                });
                
                document.getElementById('table-context-menu').style.display = 'none';
                debouncedUpdate();
            }

            function moveTableUp() {
                if (!currentTable) return;
                
                // Find the immediate previous sibling element
                let prevElement = currentTable.previousElementSibling;
                
                // Skip empty text nodes
                while (prevElement && prevElement.nodeType === Node.TEXT_NODE && prevElement.textContent.trim() === '') {
                    prevElement = prevElement.previousElementSibling;
                }
                
                if (prevElement) {
                    currentTable.parentNode.insertBefore(currentTable, prevElement);
                }
                
                document.getElementById('table-context-menu').style.display = 'none';
                debouncedUpdate();
            }

            function moveTableDown() {
                if (!currentTable) return;
                
                // Find the immediate next sibling element
                let nextElement = currentTable.nextElementSibling;
                
                // Skip empty text nodes
                while (nextElement && nextElement.nodeType === Node.TEXT_NODE && nextElement.textContent.trim() === '') {
                    nextElement = nextElement.nextElementSibling;
                }
                
                if (nextElement) {
                    // Find the element after the next element
                    let elementAfterNext = nextElement.nextElementSibling;
                    while (elementAfterNext && elementAfterNext.nodeType === Node.TEXT_NODE && elementAfterNext.textContent.trim() === '') {
                        elementAfterNext = elementAfterNext.nextElementSibling;
                    }
                    
                    if (elementAfterNext) {
                        currentTable.parentNode.insertBefore(currentTable, elementAfterNext);
                    } else {
                        currentTable.parentNode.appendChild(currentTable);
                    }
                }
                
                document.getElementById('table-context-menu').style.display = 'none';
                debouncedUpdate();
            }

            function deleteTable() {
                if (!currentTable) return;
                currentTable.remove();
                document.getElementById('table-context-menu').style.display = 'none';
                debouncedUpdate();
            }

            function addContentAfterTable() {
                if (!currentTable) return;
                
                // Create a new paragraph after the table
                const newParagraph = document.createElement('p');
                newParagraph.contentEditable = 'true';
                newParagraph.textContent = 'Type your content here...';
                
                // Insert after the table
                const nextElement = currentTable.nextElementSibling;
                if (nextElement) {
                    currentTable.parentNode.insertBefore(newParagraph, nextElement);
                } else {
                    currentTable.parentNode.appendChild(newParagraph);
                }
                
                // Focus on the new paragraph and select all text
                newParagraph.focus();
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(newParagraph);
                selection.removeAllRanges();
                selection.addRange(range);
                
                document.getElementById('table-context-menu').style.display = 'none';
                debouncedUpdate();
            }
            
            function ensureEditableContentAfterTables() {
                // Ensure there's always a way to add content after tables
                const tables = wysiwygEditor.querySelectorAll('table');
                tables.forEach(table => {
                    const nextElement = table.nextElementSibling;
                    
                    // If there's no next element or it's another table, add a paragraph
                    if (!nextElement || nextElement.tagName === 'TABLE') {
                        const paragraph = document.createElement('p');
                        paragraph.innerHTML = '&nbsp;';
                        paragraph.contentEditable = 'true';
                        
                        if (nextElement) {
                            table.parentNode.insertBefore(paragraph, nextElement);
                        } else {
                            table.parentNode.appendChild(paragraph);
                        }
                    }
                });
            }

            function debouncedUpdate() {
                clearTimeout(updateTimeout);
                updateTimeout = setTimeout(() => {
                    updateMarkdown();
                    ensureEditableContentAfterTables();
                }, 300);
            }

            // Keyboard shortcuts
            wysiwygEditor.addEventListener('keydown', function(e) {
                if (e.ctrlKey || e.metaKey) {
                    switch(e.key) {
                        case 'b':
                            e.preventDefault();
                            formatText('bold');
                            break;
                        case 'i':
                            e.preventDefault();
                            formatText('italic');
                            break;
                        case 'k':
                            e.preventDefault();
                            insertLink();
                            break;
                    }
                }
                
                // Handle Enter key in summary elements
                if (e.key === 'Enter' && e.target.tagName === 'SUMMARY') {
                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    
                    // Check if cursor is at the end of the summary
                    if (range.endOffset === e.target.textContent.length) {
                        e.preventDefault();
                        
                        // Create a new dropdown after the current details element
                        const currentDetails = e.target.closest('details');
                        const newDetails = document.createElement('details');
                        newDetails.innerHTML = '<summary>New dropdown</summary>\\n<p>Content</p>';
                        
                        // Make the new summary and content editable
                        const newSummary = newDetails.querySelector('summary');
                        const newContent = newDetails.querySelector('p');
                        newSummary.contentEditable = 'true';
                        newContent.contentEditable = 'true';
                        
                        // Insert after current details
                        currentDetails.parentNode.insertBefore(newDetails, currentDetails.nextSibling);
                        
                        // Focus on the new summary
                        newSummary.focus();
                        
                        // Select all text in the new summary for easy editing
                        const newRange = document.createRange();
                        newRange.selectNodeContents(newSummary);
                        selection.removeAllRanges();
                        selection.addRange(newRange);
                        
                        debouncedUpdate();
                        return;
                    }
                }
                
                // Handle Enter key for to-do list items
                if (e.key === 'Enter' && !e.shiftKey) {
                    const selection = window.getSelection();
                    const range = selection.getRangeAt(0);
                    const container = range.commonAncestorContainer;

                    const listItem = container.nodeType === Node.ELEMENT_NODE
                        ? container.closest('li')
                        : container.parentElement.closest('li');

                    // Check if this is a to-do list item (contains checkbox input or checkbox text)
                    if (listItem && (
                        listItem.querySelector('input[type="checkbox"]') || 
                        /\[[\sx]\]/.test(listItem.textContent)
                    )) {
                        e.preventDefault();
                        const newListItem = document.createElement('li');

                        // Preserve indentation by checking parent list
                        const parentList = listItem.parentElement;
                        if (parentList && (parentList.tagName === 'UL' || parentList.tagName === 'OL')) {
                            // Check if current item has checkbox input
                            if (listItem.querySelector('input[type="checkbox"]')) {
                                // Create new item with checkbox input
                                newListItem.innerHTML = '<input type="checkbox"> ';
                            } else {
                                // Create new item with checkbox text
                                newListItem.textContent = '[ ] ';
                            }

                            // Insert after current item
                            parentList.insertBefore(newListItem, listItem.nextSibling);

                            // Move cursor to new item
                            if (newListItem.querySelector('input[type="checkbox"]')) {
                                // Focus after the checkbox
                                range.setStart(newListItem, 1);
                            } else {
                                // Focus at the end of the checkbox text
                                range.setStart(newListItem.firstChild, 4); // After '[ ] '
                            }
                            range.collapse(true);
                            selection.removeAllRanges();
                            selection.addRange(range);

                            debouncedUpdate();
                        }
                    }
                }

                // Handle Enter key in table cells
                if (e.key === 'Enter' && (e.target.tagName === 'TD' || e.target.tagName === 'TH')) {
                    if (!e.shiftKey) {
                        e.preventDefault();
                        const currentRow = e.target.parentElement;
                        const cellIndex = Array.from(currentRow.children).indexOf(e.target);
                        const nextRow = currentRow.nextElementSibling;
                        
                        if (nextRow && nextRow.children[cellIndex]) {
                            nextRow.children[cellIndex].focus();
                        } else {
                            // Create new row if at end of table
                            const table = currentRow.closest('table');
                            const newRow = document.createElement('tr');
                            const cellCount = currentRow.children.length;
                            
                            for (let i = 0; i < cellCount; i++) {
                                const newCell = document.createElement('td');
                                newCell.contentEditable = 'true';
                                newCell.textContent = 'New cell';
                                newRow.appendChild(newCell);
                            }
                            
                            table.appendChild(newRow);
                            newRow.children[cellIndex].focus();
                            debouncedUpdate();
                        }
                    }
                }
            });

            // Event listeners
            wysiwygEditor.addEventListener('input', debouncedUpdate);
            wysiwygEditor.addEventListener('paste', function(e) {
                // Handle paste - clean up formatting
                setTimeout(debouncedUpdate, 100);
            });

            // Make elements editable when created
            wysiwygEditor.addEventListener('click', function(e) {
                // Make table cells editable and track current cell
                if (e.target.tagName === 'TD' || e.target.tagName === 'TH') {
                    e.target.contentEditable = 'true';
                    currentCell = e.target;
                    currentTable = e.target.closest('table');
                    e.target.focus();
                }
                
                // Make summary editable
                if (e.target.tagName === 'SUMMARY') {
                    e.target.contentEditable = 'true';
                    e.target.focus();
                }
                
                // Make details content editable
                if (e.target.closest('details') && e.target.tagName !== 'SUMMARY') {
                    const detailsContent = e.target.closest('details').querySelector('div');
                    if (detailsContent) {
                        detailsContent.contentEditable = 'true';
                        detailsContent.focus();
                    }
                }
            });

            markdownEditor.addEventListener('input', debouncedUpdate);

            // Listen for messages from the extension
            window.addEventListener('message', event => {
                const message = event.data;
                switch (message.command) {
                    case 'updateContent':
                        const newContent = message.content;
                        if (!isUpdatingFromExtension) {
                            isUpdatingFromExtension = true;
                            
                            // Update todo section
                            updateTodoSection(newContent);
                            
                            if (isWysiwygMode) {
                                wysiwygEditor.innerHTML = markdownToHtml(newContent);
                                makeContentEditable();
                            } else {
                                markdownEditor.value = newContent;
                            }
                            
                            setTimeout(() => {
                                isUpdatingFromExtension = false;
                            }, 200);
                        }
                        break;
                    case 'jumpToElement':
                        // Get the todo text from the markdown line
                        const lines = currentMarkdownText.split('\\n');
                        const targetLine = lines[message.lineNumber];
                        
                        if (targetLine && (targetLine.includes('[ ]') || targetLine.includes('[x]'))) {
                            // Extract the todo text (remove markdown formatting)
                            const todoText = targetLine.replace(/^.*[-*]\s*\[[\sx]\]\s*/, '').trim();
                            
                            if (todoText && todoText.length > 0) {
                                // Find matching element in WYSIWYG - use more robust matching
                                const allElements = wysiwygEditor.querySelectorAll('li, p, div');
                                const targetElement = Array.from(allElements).find(el => {
                                    const elementText = el.textContent.trim();
                                    // Skip if element text is empty too
                                    if (!elementText || elementText.length === 0) return false;
                                    // Try exact match first, then partial match
                                    return elementText === todoText || 
                                           elementText.toLowerCase().includes(todoText.toLowerCase()) ||
                                           todoText.toLowerCase().includes(elementText.toLowerCase());
                                });
                                
                                if (targetElement) {
                                    // Open parent details if closed
                                    const parentDetails = targetElement.closest('details');
                                    if (parentDetails && !parentDetails.open) {
                                        parentDetails.open = true;
                                    }
                                    
                                    // Scroll and highlight
                                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    targetElement.style.transition = 'background-color 0.3s';
                                    targetElement.style.backgroundColor = 'rgba(255, 255, 0, 0.3)';
                                    setTimeout(() => {
                                        targetElement.style.backgroundColor = '';
                                        // Update markdown to reflect opened details
                                        setTimeout(() => updateMarkdown(), 100);
                                    }, 1500);
                                } else {
                                    console.log('Todo element not found for text:', todoText);
                                }
                            }
                        }
                        return;
                }
            });

            // Initialize
            setTimeout(() => {
                initializeTurndown();
                // Add some initial content if empty
                if (!wysiwygEditor.innerHTML.trim()) {
                    wysiwygEditor.innerHTML = '<p data-placeholder="Start typing your content here..."></p>';
                }
                makeContentEditable();
            }, 100);
        </script>
    </body>
    </html>`;
}

