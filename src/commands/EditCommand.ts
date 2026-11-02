import { Document } from '../domain/Document.ts';
export class EditCommand {
  private before?: Document;
  private after?: Document;
  private readonly action: (document: Document) => string;
  constructor(action: (document: Document) => string) { this.action = action; }
  execute(document: Document): {document: Document; message: string} {
    const next = document.clone();
    const message = this.action(next);
    this.before = document.clone(); this.after = next.clone();
    return {document: next,message};
  }
  undo(): Document { if (!this.before) throw new Error('command not executed'); return this.before.clone(); }
  redo(): Document { if (!this.after) throw new Error('command not executed'); return this.after.clone(); }
}
