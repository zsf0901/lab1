import { Shape } from './Shape.ts';
export class Text extends Shape {
  readonly tag = 'text'; readonly geometry = ['x','y'];
  readonly horizontal = ['x']; readonly vertical = ['y'];
  private content = '';
  override get attrs(): Readonly<Record<string,string>> { return {...super.attrs, text: this.content}; }
  override set(key: string, value: string): void {
    if (key === 'text') this.content = value; else super.set(key,value);
  }
}
