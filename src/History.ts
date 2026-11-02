import { EditCommand } from './EditCommand.ts';
import { Document } from './Document.ts';
export class History {
  private past: EditCommand[] = [];
  private future: EditCommand[] = [];
  private blocked = true;
  barrier(): void { this.past = []; this.future = []; this.blocked = true; }
  execute(command: EditCommand, document: Document): {document: Document; message: string} {
    const result = command.execute(document);
    this.past.push(command); this.future = []; this.blocked = false; return result;
  }
  undo(): Document {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.past.pop(); if (!command) throw new Error('nothing to undo');
    this.future.push(command); return command.undo();
  }
  redo(): Document {
    if (this.blocked) throw new Error('undo not allowed after io command');
    const command = this.future.pop(); if (!command) throw new Error('nothing to redo');
    this.past.push(command); return command.redo();
  }
}
