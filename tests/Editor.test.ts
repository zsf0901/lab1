import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Editor } from '../src/cli/Editor.ts';
import { SvgCodec } from '../src/io/SvgCodec.ts';
import { Document } from '../src/domain/Document.ts';
import { ShapeFactory } from '../src/domain/ShapeFactory.ts';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
test('file commands preserve state on failure and establish history barriers',()=>{
  const folder=mkdtempSync(join(tmpdir(),'svg-editor-test-'));
  try {
    const e=new Editor(),path=join(folder,'drawing.svg');e.execute('init 400 300');e.execute('create text t 1 2 "中文 & <test>"');
    assert.match(e.execute(`save "${path}"`),/^saved to/);assert.match(e.execute('undo'),/not allowed after io/);
    e.execute('set t text changed');assert.match(e.execute('save'),/^saved to/);e.execute('init');assert.match(e.execute(`read "${path}"`),/^read /);assert.match(e.execute('show t'),/changed/);
    e.execute('set t text preserved');const before=e.execute('tree');assert.match(e.execute(`read "${join(folder,'absent.svg')}"`),/^error: cannot read file:/);assert.match(e.execute(`save "${join(folder,'absent','x.svg')}"`),/^error: cannot write file:/);assert.equal(e.execute('tree'),before);assert.equal(e.execute('undo'),'undone');
    writeFileSync(path,'<svg><rect></svg>');const previous=e.execute('tree');assert.match(e.execute(`read "${path}"`),/^error:/);assert.equal(e.execute('tree'),previous);
  } finally {rmSync(folder,{recursive:true,force:true});}
});
test('all built-in shapes, composite transformations and history',()=>{
  const e=new Editor();
  assert.match(e.execute('tree'),/^error: no document/);
  e.execute('init');e.execute('create g scene');
  for(const command of ['rect r 1 2 3 4 red','circle c 1 2 3','ellipse el 1 2 3 4','line l 1 2 3 4 black','text t 1 2 "hello world"'])assert.doesNotMatch(e.execute(`create ${command} in scene`),/^error:/);
  const before=e.execute('tree');
  assert.doesNotMatch(e.execute('move scene 10 20'),/^error:/);
  assert.match(e.execute('show r'),/x="11" y="22"/);
  e.execute('undo');assert.equal(e.execute('tree'),before);
  e.execute('redo');assert.match(e.execute('show t'),/x="11" y="22"/);
  e.execute('scale scene 2');assert.match(e.execute('show c'),/cx="22" cy="44" r="6"/);
});
test('failure preserves document and redo history; new edit discards redo',()=>{
  const e=new Editor();e.execute('init');e.execute('create rect r 1 2 3 4');e.execute('move r 5 5');e.execute('undo');
  const before=e.execute('tree');
  for(const command of ['scale r 0','set r width -1','create circle r 0 0 2','move r NaN 1','set r id other','create rect bad 0 0 1 1 in absent'])assert.match(e.execute(command),/^error:/);
  assert.equal(e.execute('tree'),before);assert.equal(e.execute('redo'),'redone');e.execute('undo');e.execute('set r fill blue');assert.equal(e.execute('redo'),'error: nothing to redo');
});
test('group, cycle rejection, nested ungroup, order and subtree deletion',()=>{
  const e=new Editor();e.execute('init');e.execute('create g outer');e.execute('create rect a 0 0 1 1 in outer');e.execute('create circle b 0 0 1 in outer');
  e.execute('group inner b a');assert.ok(e.execute('tree').indexOf('rect#a')<e.execute('tree').indexOf('circle#b'));
  const before=e.execute('tree');assert.match(e.execute('addto inner outer'),/^error:/);assert.match(e.execute('group bad inner a'),/^error:/);assert.equal(e.execute('tree'),before);
  assert.match(e.execute('ungroup outer'),/cannot ungroup top-level/);assert.doesNotMatch(e.execute('ungroup inner'),/^error:/);
  e.execute('back b');assert.ok(e.execute('tree').indexOf('circle#b')<e.execute('tree').indexOf('rect#a'));e.execute('front b');
  e.execute('delete outer');assert.match(e.execute('show a'),/^error:/);e.execute('undo');assert.doesNotMatch(e.execute('show a'),/^error:/);
});
test('document operations block history; display commands do not',()=>{
  const e=new Editor();e.execute('init');assert.match(e.execute('undo'),/not allowed after io/);e.execute('create g g');e.execute('tree');e.execute('show g');e.execute('help');assert.equal(e.execute('undo'),'undone');e.execute('canvas 100 200');assert.match(e.execute('redo'),/not allowed after io/);
});
test('SVG round trip escapes text; generated IDs avoid later explicit IDs',()=>{
  const codec=new SvgCodec();const {document,warnings}=codec.decode('<svg width="400" height="300"><rect/><rect id="rect1"/><g id="g"><text id="t" x="1" y="2">A &amp; B &lt; C</text></g></svg>');
  assert.equal(warnings[0],'warning: assigned id rect2 to unnamed <rect>');assert.equal(document.find('t').attrs.text,'A & B < C');
  assert.equal(codec.decode(codec.encode(document)).document.tree(),document.tree());
  assert.throws(()=>codec.decode('<svg><rect id="a"/><circle id="a"/></svg>'),/id already exists/);
  assert.throws(()=>codec.decode('<svg><rect></svg>'),/invalid SVG/);
  assert.throws(()=>codec.decode('<!DOCTYPE svg><svg/>'),/invalid SVG/);
});
test('unsupported types and malformed quotes fail without mutation',()=>{
  const e=new Editor();e.execute('init');const before=e.execute('tree');assert.match(e.execute('create box n 0 0 1 1 "x"'),/unknown shape type/);assert.match(e.execute('create text t 1 2 "unterminated'),/^error:/);assert.equal(e.execute('tree'),before);
  const d=new Document();const s=new ShapeFactory().create('rect','r',['1','2','3','4']);d.root.insert(s);const copy=d.clone();copy.find('r').move(10,0);assert.equal(d.find('r').attrs.x,'1');
});
