const vscode = require('vscode');

function activate(context) {
    let decorationsByTag = {};

    // Charger les tags et styles depuis la configuration
    const loadTagsConfiguration = () => {
        const tags = vscode.workspace.getConfiguration('smartHighlight').get('tags', []);
        tags.forEach(tagConfig => {
            const { tag, color, icon } = tagConfig;
            decorationsByTag[tag] = vscode.window.createTextEditorDecorationType({
                backgroundColor: `${color}33`, // Couleur transparente
                border: `1px solid ${color}`,
                gutterIconPath: icon ? vscode.Uri.file(icon) : undefined,
                gutterIconSize: 'contain'
            });
        });
    };

    // Appliquer les décorations
    const highlightTagsAndLogs = (editor) => {
        if (!editor) return;

        const text = editor.document.getText();
        const decorations = {};

        // Initialiser les décorations pour chaque tag
        Object.keys(decorationsByTag).forEach(tag => {
            decorations[tag] = [];
        });

        // Regex pour détecter les console.log et les tags
        const logRegex = /console\.log\(.*?\)/g;
        const tagRegex = /\/\/(FIX|FOLLOW|SHARE|TODO)\b/g;

        // Parcourir le texte pour les logs
        let match;
        while ((match = logRegex.exec(text)) !== null) {
            const startPos = editor.document.positionAt(match.index);
            const endPos = editor.document.positionAt(match.index + match[0].length);

            // Ajouter à une décoration générique pour console.log
            decorations['LOG'] = decorations['LOG'] || [];
            decorations['LOG'].push({ range: new vscode.Range(startPos, endPos) });
        }

        // Parcourir le texte pour les tags spécifiques
        while ((match = tagRegex.exec(text)) !== null) {
            const tag = match[1]; // Correspond au tag (FIX, FOLLOW, etc.)
            const startPos = editor.document.positionAt(match.index);
            const endPos = editor.document.positionAt(match.index + match[0].length);

            if (decorations[tag]) {
                decorations[tag].push({ range: new vscode.Range(startPos, endPos) });
            }
        }

        // Appliquer les décorations
        Object.keys(decorations).forEach(tag => {
            if (decorationsByTag[tag]) {
                editor.setDecorations(decorationsByTag[tag], decorations[tag]);
            }
        });
    };

    // Charger la configuration des tags à l'activation
    loadTagsConfiguration();

    // Événements pour mettre à jour les décorations
    vscode.window.onDidChangeActiveTextEditor(highlightTagsAndLogs);
    vscode.workspace.onDidChangeTextDocument((e) => {
        if (vscode.window.activeTextEditor) {
            highlightTagsAndLogs(vscode.window.activeTextEditor);
        }
    });

    // Appliquer immédiatement les décorations
    if (vscode.window.activeTextEditor) {
        highlightTagsAndLogs(vscode.window.activeTextEditor);
    }
}

function deactivate() {}

module.exports = { activate, deactivate };
