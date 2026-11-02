import { Shape } from './Shape.ts';
export class Rect extends Shape {
  readonly tag = 'rect'; readonly geometry = ['x','y','width','height'];
  readonly horizontal = ['x']; readonly vertical = ['y'];
  override describe(): string { return super.describe().replace('width=','w=').replace('height=','h='); }
}
