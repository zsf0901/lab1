import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { Document } from './Document.ts';
import { Shape } from './Shape.ts';
import { Group } from './Group.ts';
import { ShapeFactory } from './ShapeFactory.ts';
export class SvgCodec {
  private escape(value: string): string { return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;'); }
  encode(document: Document): string {
    const element = (shape: Shape): string => {
      const attributes = Object.entries(shape.attrs).filter(([key]) => key !== 'text').map(([key,value]) => ` ${key}="${this.escape(value)}"`).join('');
      return `<${shape.tag} id="${this.escape(shape.id)}"${attributes}>${this.escape(shape.attrs.text ?? '')}${shape.children.map(element).join('')}</${shape.tag}>`;
    };
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">${document.root.children.map(element).join('')}</svg>\n`;
  }
  decode(xml: string): {document: Document; warnings: string[]} {
    if (/<!DOCTYPE|<!ENTITY/i.test(xml) || XMLValidator.validate(xml) !== true) throw new Error('invalid SVG XML');
    const nodes = new XMLParser({preserveOrder:true,ignoreAttributes:false,attributeNamePrefix:'',parseTagValue:false,trimValues:false}).parse(xml) as any[];
    const roots = nodes.filter(node => !Object.keys(node)[0].startsWith('?'));
    if (roots.length !== 1 || !roots[0].svg) throw new Error('expected SVG root');
    const root = roots[0]; const warnings: string[] = []; const reserved = new Set<string>();
    const reserve = (items: any[]): void => { for (const item of items) {
      const tag = Object.keys(item)[0]; if (tag.startsWith('#')) continue;
      const id = item[':@']?.id; if (id) { if (reserved.has(id)) throw new Error(`id already exists: ${id}`); reserved.add(id); }
      reserve(item[tag]);
    }};
    reserve(root.svg);
    const size = (value: string | undefined, fallback: number): number => {
      const result = value === undefined ? fallback : Number(value);
      if (!Number.isFinite(result) || result <= 0) throw new Error('invalid canvas size'); return result;
    };
    const document = new Document(size(root[':@']?.width,800),size(root[':@']?.height,600));
    const factory = new ShapeFactory();
    const load = (items: any[],parent: Group): void => { for (const item of items) {
      const tag = Object.keys(item)[0]; if (tag.startsWith('#') || tag.startsWith('?')) continue;
      const attributes = item[':@'] ?? {}; let id = attributes.id;
      if (!id) { let i=1; while (reserved.has(`${tag}${i}`)) i++; id=`${tag}${i}`; reserved.add(id); warnings.push(`warning: assigned id ${id} to unnamed <${tag}>`); }
      const shape = factory.create(tag,id);
      for (const [key,value] of Object.entries(attributes)) {
        if (key === 'id' || key === 'data-kind' || key.startsWith('xmlns')) continue;
        shape.set(key,String(value));
      }
      if (tag === 'text') shape.set('text',item[tag].filter((entry:any) => '#text' in entry).map((entry:any) => entry['#text']).join(''));
      parent.insert(shape);
      if (shape instanceof Group) load(item[tag],shape);
    }};
    load(root.svg,document.root); return {document,warnings};
  }
}
