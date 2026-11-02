import { createInterface } from 'node:readline';
import { Editor } from './Editor.ts';
const editor = new Editor();
const terminal = createInterface({input:process.stdin,output:process.stdout,terminal:Boolean(process.stdin.isTTY),prompt:'svg> '});
console.log("svg-editor 0.1 — type 'help' for commands");
if(process.stdin.isTTY)terminal.prompt();
terminal.on('line',line=>{const output=editor.execute(line);if(output)console.log(output);if(process.stdin.isTTY)terminal.prompt();});
