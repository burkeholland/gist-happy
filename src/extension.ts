import * as vscode from 'vscode';

const frameworks = {
	'reactPath': 'https://media.giphy.com/media/V6cO0KbJyZUQUSmHqA/giphy.gif',
	'vuePath': 'https://media.giphy.com/media/l0MYymp9Y2kGiZYgU/giphy.gif',
	'jsPath': 'https://media.giphy.com/media/l0MYymp9Y2kGiZYgU/giphy.gif',
	'angularPath': 'https://media.giphy.com/media/l0MYymp9Y2kGiZYgU/giphy.gif',
	'staticPath': 'https://media.giphy.com/media/l0MYymp9Y2kGiZYgU/giphy.gif',
	'nodePath': 'https://media.giphy.com/media/l0MYymp9Y2kGiZYgU/giphy.gif'
	};
	
export function activate(context: vscode.ExtensionContext) {
	context.subscriptions.push(
		vscode.commands.registerCommand('gist-happy.frameworks', () => {
			FrameworkPanel.createOrShow(context.extensionUri);
		})
	);

	if (vscode.window.registerWebviewPanelSerializer) {
		// Make sure we register a serializer in activation event
		vscode.window.registerWebviewPanelSerializer(FrameworkPanel.viewType, {
			async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any) {
	
				// Reset the webview options so we use latest uri for `localResourceRoots`.
				webviewPanel.webview.options = getWebviewOptions(context.extensionUri);
				FrameworkPanel.revive(webviewPanel, context.extensionUri);
			}
		});
	}
}

function getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
	return {
		// Enable javascript in the webview
		enableScripts: true,

		// And restrict the webview to only loading content from our extension's `media` directory.
		localResourceRoots: [
			vscode.Uri.joinPath(extensionUri, 'media'),
			vscode.Uri.joinPath(extensionUri, 'out/compiled')
		]
	};
}

class FrameworkPanel {
	/**
	 * Track the currently panel. Only allow a single panel to exist at a time.
	 */
	public static currentPanel: FrameworkPanel | undefined;

	public static readonly viewType = 'frameworks';

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		// If we already have a panel, show it.
		if (FrameworkPanel.currentPanel) {
			FrameworkPanel.currentPanel._panel.reveal(column);
			return;
		}

		// Otherwise, create a new panel.
		const panel = vscode.window.createWebviewPanel(
			FrameworkPanel.viewType,
			'Framework',
			column || vscode.ViewColumn.One,
			getWebviewOptions(extensionUri),
		);

		FrameworkPanel.currentPanel = new FrameworkPanel(panel, extensionUri);
	}

	public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		FrameworkPanel.currentPanel = new FrameworkPanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

	// public doRefactor() {
	// 	// Send a message to the webview webview.
	// 	// You can send any JSON serializable data.
	// 	this._panel.webview.postMessage({ command: 'refactor' });
	// }

	public dispose() {
		FrameworkPanel.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

	private _update() {
		const webview = this._panel.webview;

		// Vary the webview's content based on where it is located in the editor.
		// switch (this._panel.viewColumn) {
		// 	case vscode.ViewColumn.Two:
		// 		this._updateFramework(webview, frameworks.reactPath);
		// 		return;

		// 	case vscode.ViewColumn.One:
		// 	default:
		// 		this._updateFramework(webview, frameworks.angularPath);
		// 		return;
		// }
	}

	private _updateFramework(webview: vscode.Webview, framework: keyof typeof frameworks) {
		this._panel.title = framework;
		this._panel.webview.html = this._getHtmlForWebview(webview, frameworks[framework]);
	}

	private _getHtmlForWebview(webview: vscode.Webview, path: string) {
		// Local path to main script run in the webview
		const scriptPathOnDisk = vscode.Uri.joinPath(this._extensionUri, 'out/compiled', 'HelloWorld.js');

		
		// And the uri we use to load this script in the webview
		const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

		// Local path to css styles
		const styleResetPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css');
		const stylesPathMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css');

		// Uri to load styles into webview
		const stylesResetUri = webview.asWebviewUri(styleResetPath);
		const stylesMainUri = webview.asWebviewUri(stylesPathMainPath);

		// Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();
		
		// Later we can add this in <script nonce="${nonce}" src="${scriptUri}"></script>

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesResetUri}" rel="stylesheet">
				<link href="${stylesMainUri}" rel="stylesheet">

				<title>Frameworks</title>

			</head>
			<body>
			<p>hello world</p>
				<table>
					<tr>
						<td style="text-align: center;><img src="${frameworks.reactPath}" /></td>
						<td style="text-align: center;><img src="${frameworks.vuePath}" /></td>
						<td style="text-align: center;><img src="${frameworks.jsPath}" /></td>
					</tr>
					<tr>
						<td style="text-align: center;><img src="${frameworks.angularPath}" /></td>
						<td style="text-align: center;><img src="${frameworks.staticPath}" /></td>
						<td style="text-align: center;><img src="${frameworks.nodePath}" /></td>
				</tr>
				</table>
				<table>
				
			</body>
			
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
