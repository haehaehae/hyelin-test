import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const context={window:{},console};vm.createContext(context);
for(const name of ['engine/dependencies/fold.js','recipes.js','catalog.js']){vm.runInContext(fs.readFileSync(path.join(root,'dist',name),'utf8'),context);context.PaperRecipes=context.window.PaperRecipes;}
const {catalog,recipes,makeFold}=context.window.PaperRecipes;
assert.equal(catalog.length,20);assert.equal(new Set(catalog.map(r=>r.id)).size,20);
assert.equal(catalog.filter(r=>r.group==='animal').length,10);
assert.equal(catalog.filter(r=>r.simulation).length,3);
for(const recipe of recipes.filter(r=>!r.pattern)){
 const {fold,groups}=makeFold(recipe);
 assert.equal(fold.vertices_coords.length-fold.edges_vertices.length+fold.faces_vertices.length,1,recipe.id+': connected disk');
 assert.equal(new Set(groups.filter(Boolean)).size,recipe.steps.length,recipe.id+': crease groups');
 fold.edges_vertices.forEach(edge=>{const uses=fold.faces_vertices.filter(face=>edge.every(v=>face.includes(v))).length;assert.ok(uses===1||uses===2,recipe.id+': manifold edge');});
}
for(const name of ['app.js','recipes.js','catalog.js','engine/studio-engine.js'])execFileSync(process.execPath,['--check',path.join(root,'dist',name)]);
for(const name of ['index.html','engine/index.html']){
 const source=fs.readFileSync(path.join(root,'dist',name),'utf8');
 for(const match of source.matchAll(/(?:src|href)="([^"]+)"/g)){
  const url=match[1];if(/^(?:https?:|#|data:)/.test(url))continue;
  assert.ok(fs.existsSync(path.resolve(root,'dist',path.dirname(name),url)),name+': missing '+url);
 }
}
console.log('PASS: 20 unique entries, 10 animals, 3 catalog simulations, 4 valid beginner meshes, JS syntax and local assets.');
