import { Shape } from './Shape.ts';
export class Circle extends Shape {
  readonly tag = 'circle'; readonly geometry = ['cx','cy','r'];
  readonly horizontal = ['cx']; readonly vertical = ['cy'];
}
