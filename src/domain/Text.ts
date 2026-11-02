import { Shape } from './Shape.ts';
export class Text extends Shape {
  readonly tag = 'text'; readonly geometry = ['x','y'];
  readonly horizontal = ['x']; readonly vertical = ['y'];
  private content = '';
  override describe(): string { const {x='0',y='0',text,...style}=this.attrs; return `text#${this.id} (${x},${y}) ${JSON.stringify(text)} ${Object.entries(style).map(([k,v])=>`${k}=${v}`).join(' ')}`.trim(); }
  override get attrs(): Readonly<Record<string,string>> { return {...super.attrs, text: this.content}; }
  override set(key: string, value: string): void {
    if (key === 'text') this.content = value; else super.set(key,value);
  }
}
