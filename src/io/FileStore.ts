import { readFileSync, writeFileSync } from 'node:fs';
import { SvgCodec } from './SvgCodec.ts';
import { Document } from '../domain/Document.ts';
export class FileStore {
  private readonly codec = new SvgCodec();
  read(path: string): ReturnType<SvgCodec['decode']> {
    let xml: string;
    try { xml = readFileSync(path,'utf8'); } catch { throw new Error(`cannot read file: ${path}`); }
    return this.codec.decode(xml);
  }
  save(path: string,document: Document): void {
    try { writeFileSync(path,this.codec.encode(document),'utf8'); } catch { throw new Error(`cannot write file: ${path}`); }
  }
}
