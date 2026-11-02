import { Group } from './Group.ts';
import { Shape } from './Shape.ts';
import { ShapeFactory } from './ShapeFactory.ts';
export class Document {
  readonly root = new Group('__root__');
  width: number;
  height: number;
  constructor(width = 800, height = 600) { this.width=width; this.height=height; }
  all(parent: Shape = this.root): Shape[] { return parent.children.flatMap(child => [child,...this.all(child)]); }
  find(id: string): Shape {
    const shape = this.all().find(shape => shape.id === id);
    if (!shape) throw new Error(`no such shape: ${id}`);
    return shape;
  }
  unique(id: string): void { if (this.all().some(shape => shape.id === id)) throw new Error(`id already exists: ${id}`); }
  parent(shape: Shape, parent = this.root): Group {
    if (parent.children.includes(shape)) return parent;
    for (const child of parent.children) if (child instanceof Group && this.all(child).includes(shape)) return this.parent(shape,child);
    throw new Error(`no such shape: ${shape.id}`);
  }
  container(id?: string): Group {
    if (id === undefined) return this.root;
    const shape = this.all().find(shape => shape.id === id);
    if (!shape) throw new Error(`no such container: ${id}`);
    if (!(shape instanceof Group)) throw new Error(`not a container: ${id}`);
    return shape;
  }
  clone(): Document {
    const copy = new Document(this.width,this.height);
    const factory = new ShapeFactory();
    const populate = (source: Shape, target: Group): void => {
      for (const child of source.children) {
        const next = factory.create(child.tag,child.id);
        for (const [key,value] of Object.entries(child.attrs)) next.set(key,value);
        target.insert(next);
        if (next instanceof Group) populate(child,next);
      }
    };
    populate(this.root,copy.root); return copy;
  }
  tree(shape: Shape = this.root): string {
    const lines = [shape === this.root ? `svg (${this.width}x${this.height})` : shape.describe()];
    const visit = (parent: Shape, prefix: string): void => parent.children.forEach((child,i) => {
      const last = i === parent.children.length-1;
      lines.push(prefix + (last ? '└── ' : '├── ') + child.describe());
      visit(child,prefix + (last ? '    ' : '│   '));
    });
    visit(shape,''); return lines.join('\n');
  }
}
