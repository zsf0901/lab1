import { Document } from './Document.ts';
import { Group } from './Group.ts';
import { ShapeFactory } from './ShapeFactory.ts';
import { History } from './History.ts';
import { EditCommand } from './EditCommand.ts';
import { FileStore } from './FileStore.ts';
export class Editor {
  private document?: Document;
  private path?: string;
  private readonly history = new History();
  private readonly files = new FileStore();
  private readonly factory = new ShapeFactory();
  private number(value: string): number { const n=Number(value); if (value === undefined || !value.trim() || !Number.isFinite(n)) throw new Error(`invalid number: ${value}`); return n; }
  private arity(args: string[],min: number,max=min): void { if (args.length < min || args.length > max) throw new Error('invalid arguments'); }
  private tokenize(line: string): string[] {
    const tokens: string[] = []; const pattern = /"((?:\\.|[^"\\])*)"|([^\s"]+)/gy;
    let position=0;
    while (position<line.length) {
      if (/\s/.test(line[position])) {position++;continue;}
      pattern.lastIndex=position; const match=pattern.exec(line);
      if (!match) throw new Error('invalid quoted argument');
      tokens.push(match[1] !== undefined ? match[1].replace(/\\(["\\])/g,'$1') : match[2]); position=pattern.lastIndex;
    }
    return tokens;
  }
  execute(line: string): string {
    try { return this.run(line); } catch(error) { return `error: ${(error as Error).message.replace(/[\r\n]+/g,' ')}`; }
  }
  private run(line: string): string {
    if (!line.trim() || line.trimStart().startsWith('#')) return '';
    const [name,...args] = this.tokenize(line);
    const handlers: Record<string,()=>string> = {
      help: () => { this.arity(args,0); return 'init [w h]\nread <file.svg>\nsave [file.svg]\ncanvas [w h]\ncreate <rect|circle|ellipse|line|text|g> <id> [params] [in <containerId>]\ndelete <id>\nmove <id> <dx> <dy>\nscale <id> <factor>\nset <id> <attr> <value>\ngroup <newGid> <id1> [id2 ...]\nungroup <gid>\naddto <gid> <id>\nfront <id>\nback <id>\ntree [id]\nshow <id>\nundo\nredo'; },
      init: () => { if (args.length !== 0 && args.length !== 2) throw new Error('invalid arguments'); const w=args.length ? this.number(args[0]):800,h=args.length?this.number(args[1]):600; if(w<=0||h<=0)throw new Error('invalid canvas size'); this.document=new Document(w,h);this.path=undefined;this.history.barrier();return `canvas ${w}x${h} created`; },
      read: () => { this.arity(args,1); const result=this.files.read(args[0]); this.document=result.document;this.path=args[0];this.history.barrier();return [...result.warnings,`read ${args[0]} (${result.document.all().length} elements)`].join('\n'); },
      save: () => { this.arity(args,0,1); const doc=this.current();const path=args[0]??this.path;if(!path)throw new Error('save path required');this.files.save(path,doc);this.path=path;this.history.barrier();return `saved to ${path} (${doc.all().length} elements)`; },
      canvas: () => { const doc=this.current();if(!args.length)return `canvas ${doc.width}x${doc.height}`;this.arity(args,2);const w=this.number(args[0]),h=this.number(args[1]);if(w<=0||h<=0)throw new Error('invalid canvas size');doc.width=w;doc.height=h;this.history.barrier();return `canvas resized to ${w}x${h}`; },
      tree: () => {this.arity(args,0,1);const doc=this.current();return doc.tree(args.length?doc.find(args[0]):undefined);},
      show: () => {this.arity(args,1);const doc=this.current(),shape=doc.find(args[0]),parent=doc.parent(shape);return `${shape.tag}#${shape.id} parent=${parent===doc.root?'svg':`g#${parent.id}`}\n  ${Object.entries(shape.attrs).map(([k,v])=>`${k}=${JSON.stringify(v)}`).join(' ')}`;},
      undo: () => {this.arity(args,0);this.current();this.document=this.history.undo();return 'undone';},
      redo: () => {this.arity(args,0);this.current();this.document=this.history.redo();return 'redone';},
      create: () => this.edit(doc => {this.arity(args,2,100);const [type,id,...params]=args;doc.unique(id);let target: string|undefined;if(params.length>=2&&params.at(-2)==='in'){target=params.pop();params.pop();}const parent=doc.container(target);const shape=this.factory.create(type,id,params);parent.insert(shape);return `${type}#${id} created${target?` in g#${target}`:''}`;}),
      delete: () => this.edit(doc => {this.arity(args,1);const s=doc.find(args[0]);doc.parent(s).remove(s);return `${s.tag}#${s.id} deleted`;}),
      move: () => this.edit(doc => {this.arity(args,3);const s=doc.find(args[0]),dx=this.number(args[1]),dy=this.number(args[2]);s.move(dx,dy);return `${s.tag}#${s.id} moved by (${dx},${dy})`;}),
      scale: () => this.edit(doc => {this.arity(args,2);const s=doc.find(args[0]),factor=this.number(args[1]);if(factor<=0)throw new Error('scale factor must be positive');s.scale(factor);return `${s.tag}#${s.id} scaled by ${factor}`;}),
      set: () => this.edit(doc => {this.arity(args,3);const s=doc.find(args[0]);s.set(args[1],args[2]);return `${s.tag}#${s.id} updated: ${args[1]}=${args[2]}`;}),
      group: () => this.edit(doc => {this.arity(args,2,10000);doc.unique(args[0]);const selected=args.slice(1).map(id=>doc.find(id));if(new Set(selected).size!==selected.length)throw new Error('duplicate group member');for(const s of selected)if(selected.some(other=>other!==s&&doc.all(s).includes(other)))throw new Error(`cannot group a container into its own descendant: ${s.id}`);const ordered=doc.all().filter(s=>selected.includes(s));const parent=doc.parent(ordered[0]);const position=parent.children.indexOf(ordered[0]);const group=new Group(args[0]);for(const s of ordered){doc.parent(s).remove(s);group.insert(s);}parent.insert(group,position);return `g#${group.id} created with ${ordered.length} children`;}),
      ungroup: () => this.edit(doc => {this.arity(args,1);const group=doc.container(args[0]),parent=doc.parent(group);if(parent===doc.root)throw new Error(`cannot ungroup top-level container: ${group.id}`);const index=parent.children.indexOf(group);parent.remove(group);group.children.forEach((child,i)=>parent.insert(child,index+i));return `g#${group.id} ungrouped`;}),
      addto: () => this.edit(doc => {this.arity(args,2);const parent=doc.container(args[0]),s=doc.find(args[1]);if(s===parent||doc.all(s).includes(parent))throw new Error(`cannot group a container into its own descendant: ${s.id}`);doc.parent(s).remove(s);parent.insert(s);return `${s.tag}#${s.id} added to g#${parent.id}`;}),
      front: () => this.order(args,true), back: () => this.order(args,false)
    };
    const handler=handlers[name];if(!handler)throw new Error(`unknown command: ${name}`);return handler();
  }
  private current(): Document {if(!this.document)throw new Error("no document. use 'init' or 'read' first");return this.document;}
  private edit(action: (document:Document)=>string): string {const result=this.history.execute(new EditCommand(action),this.current());this.document=result.document;return result.message;}
  private order(args: string[],front: boolean): string {return this.edit(doc=>{this.arity(args,1);const s=doc.find(args[0]),p=doc.parent(s);p.remove(s);p.insert(s,front?p.children.length:0);return `${s.tag}#${s.id} moved ${front?'front':'back'}`;});}
}
