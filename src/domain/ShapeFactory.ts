import { Shape } from './Shape.ts';
import { Rect } from './Rect.ts';
import { Circle } from './Circle.ts';
import { Ellipse } from './Ellipse.ts';
import { Line } from './Line.ts';
import { Text } from './Text.ts';
import { Group } from './Group.ts';
export class ShapeFactory {
  private readonly types: Record<string, new (id: string) => Shape> = {rect: Rect, circle: Circle, ellipse: Ellipse, line: Line, text: Text, g: Group};
  create(type: string, id: string, parameters?: string[]): Shape {
    const Constructor = this.types[type];
    if (!Constructor) throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    const shape = new Constructor(id);
    if (parameters) {
      const keys = [...shape.geometry, ...(shape instanceof Text ? ['text'] : [])];
      const optionalStyle = !(shape instanceof Text || shape instanceof Group);
      if (parameters.length < keys.length || parameters.length > keys.length + Number(optionalStyle)) throw new Error('invalid create arguments');
      keys.forEach((key,i) => shape.set(key,parameters[i]));
      if (parameters.length > keys.length) shape.set(shape instanceof Line ? 'stroke' : 'fill',parameters[keys.length]);
    }
    return shape;
  }
}
