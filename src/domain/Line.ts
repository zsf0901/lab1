import { Shape } from './Shape.ts';
export class Line extends Shape {
  readonly tag = 'line'; readonly geometry = ['x1','y1','x2','y2'];
  readonly horizontal = ['x1','x2']; readonly vertical = ['y1','y2'];
  override describe(): string { const {x1='0',y1='0',x2='0',y2='0',...style}=this.attrs; return `line#${this.id} (${x1},${y1}) -> (${x2},${y2}) ${Object.entries(style).map(([k,v])=>`${k}=${v}`).join(' ')}`.trim(); }
}
