import { Shape } from './Shape.ts';
export class Line extends Shape {
  readonly tag = 'line'; readonly geometry = ['x1','y1','x2','y2'];
  readonly horizontal = ['x1','x2']; readonly vertical = ['y1','y2'];
}
