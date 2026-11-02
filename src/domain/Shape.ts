export abstract class Shape {
  private attributes: Record<string, string> = {};
  abstract readonly tag: string;
  abstract readonly geometry: readonly string[];
  abstract readonly horizontal: readonly string[];
  abstract readonly vertical: readonly string[];
  readonly id: string;
  constructor(id: string) {
    this.id = id;
    if (!id || /\s/.test(id)) throw new Error('invalid id');
  }
  get attrs(): Readonly<Record<string, string>> { return { ...this.attributes }; }
  get children(): readonly Shape[] { return []; }
  set(attr: string, value: string): void {
    if (![...this.geometry, 'fill', 'stroke', 'stroke-width'].includes(attr))
      throw new Error(`unknown attribute: ${attr}`);
    if (this.geometry.includes(attr) || attr === 'stroke-width') {
      const number = Number(value);
      if (!value.trim() || !Number.isFinite(number)) throw new Error(`invalid number: ${value}`);
      if (['width', 'height', 'r', 'rx', 'ry', 'stroke-width'].includes(attr) && number < 0)
        throw new Error(`${attr} must be nonnegative`);
    }
    this.attributes[attr] = value;
  }
  move(dx: number, dy: number): void {
    for (const key of this.horizontal) this.set(key, String(Number(this.attributes[key] ?? 0) + dx));
    for (const key of this.vertical) this.set(key, String(Number(this.attributes[key] ?? 0) + dy));
    for (const child of this.children) child.move(dx, dy);
  }
  scale(factor: number): void {
    for (const key of this.geometry) this.set(key, String(Number(this.attributes[key] ?? 0) * factor));
    for (const child of this.children) child.scale(factor);
  }
  describe(): string { return `${this.tag}#${this.id} ${Object.entries(this.attrs).map(([k,v]) => `${k}=${v}`).join(' ')}`.trim(); }
}
