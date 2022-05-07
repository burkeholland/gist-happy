
import { commands, ExtensionContext, window } from "vscode";

export function registerHelloWorld(context: ExtensionContext){

	context.subscriptions.push(
            commands.registerCommand('gist-happy.helloWorld', () => {
		    window.showInformationMessage('Are you feeling Gist Happy?');
            }
        )
    );
};