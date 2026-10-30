import { mergeGeometries } from '../assets/BufferGeometryUtils.js';
// Merge only immobile meshes. Procedural source modules retain the editable model.
export function batchStatic(T,root,{exclude=new Set()}={}){
 root.updateWorldMatrix(true,true);const inverse=root.matrixWorld.clone().invert(),buckets=new Map();
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material)||!o.visible||o.material.opacity===0)return;let p=o;while(p&&p!==root){if(exclude.has(p)||p.name.startsWith('animated'))return;p=p.parent;}const key=o.material.uuid+Object.keys(o.geometry.attributes).sort().join(',');if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);});
 const matrix=new T.Matrix4();let removed=0;
 for(const refs of buckets.values()){if(refs.length<2)continue;const geometries=refs.map(o=>{const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();matrix.multiplyMatrices(inverse,o.matrixWorld);return g.applyMatrix4(matrix);});const merged=mergeGeometries(geometries,false);geometries.forEach(g=>g.dispose());if(!merged)continue;const mesh=new T.Mesh(merged,refs[0].material);mesh.name='static batch '+(refs[0].name||'geometry');mesh.castShadow=refs.some(o=>o.castShadow);mesh.receiveShadow=true;refs.forEach(o=>{o.parent.remove(o);removed++;});merged.computeBoundingSphere();root.add(mesh);}return removed;
}
export function batchActors(T,root,actors){
 root.updateWorldMatrix(true,true);const buckets=new Map(),inverse=root.matrixWorld.clone().invert(),m=new T.Matrix4();
 for(const a of actors)a.model.group.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const key=o.geometry.uuid+o.material.uuid;if(!buckets.has(key))buckets.set(key,[]);buckets.get(key).push(o);o.userData.dynamicSource=true;o.visible=false;});
 const batches=[];for(const refs of buckets.values()){const mesh=new T.InstancedMesh(refs[0].geometry,refs[0].material,refs.length);mesh.name='animated people batch';mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);batches.push({mesh,refs});}
 function update(){root.updateWorldMatrix(true,true);for(const b of batches){b.refs.forEach((o,i)=>{m.multiplyMatrices(inverse,o.matrixWorld);b.mesh.setMatrixAt(i,m);});b.mesh.instanceMatrix.needsUpdate=true;}}
 update();return {update,batches:batches.length,meshes:[...buckets.values()].reduce((n,a)=>n+a.length,0)};
}
