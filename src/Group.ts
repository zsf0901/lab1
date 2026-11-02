import { Shape } from './Shape.ts';
export class Group extends Shape {
  readonly tag = 'g'; readonly geometry = []; readonly horizontal = []; readonly vertical = [];
  private members: Shape[] = [];
  override get children(): readonly Shape[] { return [...this.members]; }
  insert(shape: Shape, index = this.members.length): void { this.members.splice(index,0,shape); }
  remove(shape: Shape): void {
    const index = this.members.indexOf(shape);
    if (index < 0) throw new Error('shape is not a child');
    this.members.splice(index,1);
  }
}
