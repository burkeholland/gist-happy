import * as vscode from 'vscode';

import { registerHelloWorld } from "./commands/hello-world";

export function activate(context: vscode.ExtensionContext) {
	console.log('Activating ... gist-happy ...!');
	registerHelloWorld(context);
}

export function deactivate() {}
