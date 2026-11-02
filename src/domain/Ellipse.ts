import { Shape } from './Shape.ts';
export class Ellipse extends Shape {
  readonly tag = 'ellipse'; readonly geometry = ['cx','cy','rx','ry'];
  readonly horizontal = ['cx']; readonly vertical = ['cy'];
}
