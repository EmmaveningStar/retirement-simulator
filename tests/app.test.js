import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {defaults} from '../model.js';
class Element {
 set value(v){this._value=String(v);} get value(){return this._value;}
 constructor(){this.value='';this.textContent='';this.children=[];this.listeners={};this.hidden=false;}
 append(...nodes){this.children.push(...nodes);for(const n of nodes)if(n.id) elements.set(n.id,n);}
 replaceChildren(){this.children=[];}
 addEventListener(type,fn){this.listeners[type]=fn;}
}
let elements;
async function boot(stored=null,blocked=false){elements=new Map();globalThis.document={getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id);},createElement(){return new Element();}};const entries=new Map(stored?[[ 'retirement-simulator:v0.2',stored]]:[]);globalThis.localStorage={getItem:k=>{if(blocked)throw Error();return entries.get(k)??null;},setItem:(k,v)=>{if(blocked)throw Error();entries.set(k,v);},removeItem:k=>{if(blocked)throw Error();entries.delete(k);}};const source=(await readFile(new URL('../app.js',import.meta.url),'utf8')).replace("'./model.js'",JSON.stringify(new URL('../model.js',import.meta.url).href));await import('data:text/javascript;base64,'+Buffer.from(source+'\n//'+Math.random()).toString('base64'));return {get:id=>elements.get(id),entries};}
test('UI saves, restores, switches mode, hides stale results and clears only own key',async()=>{let ui=await boot();ui.get('cash').value='123456';ui.get('cash').listeners.input();const stored=ui.entries.get('retirement-simulator:v0.2');assert.equal(JSON.parse(stored).values.cash,123456);ui=await boot(stored);assert.equal(ui.get('cash').value,'123456');ui.get('mode').value='family';ui.get('mode').listeners.input();assert.equal(ui.get('partnerPanel').hidden,false);assert.equal(ui.get('share').disabled,true);ui.get('age').value='';ui.get('age').listeners.input();assert.equal(ui.get('results').hidden,true);assert.ok(ui.get('error').textContent);ui.entries.set('unrelated','keep');ui.get('clear').listeners.click();assert.equal(ui.entries.has('retirement-simulator:v0.2'),false);assert.equal(ui.entries.get('unrelated'),'keep');assert.equal(ui.get('cash').value,String(defaults.cash));assert.equal(ui.get('results').hidden,false);});
test('corrupted storage and denied access do not break calculator',async()=>{let ui=await boot('{broken');assert.equal(ui.get('results').hidden,false);assert.match(ui.get('storage').textContent,/無法讀取/);ui=await boot(null,true);ui.get('cash').listeners.input();assert.match(ui.get('storage').textContent,/無法儲存/);assert.equal(ui.get('results').hidden,false);});
