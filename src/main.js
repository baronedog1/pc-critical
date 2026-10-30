import * as THREE from '../assets/three.module.js';
import { OrbitControls } from '../assets/OrbitControls.js';
import { GLTFExporter } from '../assets/GLTFExporter.js';
import { buildHospital } from './scene.js';
import { createCharacter } from './characters.js';
import { batchStatic, batchActors } from './optimize.js';
import library from './prescriptions.json';

const $=s=>document.querySelector(s), viewport=$('#world');
const scene=new THREE.Scene();scene.background=new THREE.Color('#e7eadc');scene.fog=new THREE.Fog('#e7eadc',57,100);
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){$('#loading').innerHTML='<h2>这片森林需要 WebGL</h2><p>请使用支持 WebGL 的浏览器，并开启硬件加速后重新打开。</p>';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;viewport.appendChild(renderer.domElement);renderer.domElement.id='hospital-canvas';
const camera=new THREE.OrthographicCamera(-21,21,13,-13,.1,170);camera.position.set(7,16,39);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,7,0);controls.enableDamping=true;controls.dampingFactor=.065;controls.enablePan=false;controls.minZoom=.7;controls.maxZoom=1.65;controls.minPolarAngle=.72;controls.maxPolarAngle=1.38;controls.minAzimuthAngle=-.55;controls.maxAzimuthAngle=.65;controls.rotateSpeed=.38;controls.zoomSpeed=.55;controls.maxDistance=75;controls.update();
scene.add(new THREE.HemisphereLight('#fff7dd','#697c64',1.8));scene.add(new THREE.AmbientLight('#f8e8ce',.4));
const sun=new THREE.DirectionalLight('#fff0c9',2.6);sun.position.set(-15,30,22);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-24;sun.shadow.camera.right=24;sun.shadow.camera.top=26;sun.shadow.camera.bottom=-20;sun.shadow.camera.near=1;sun.shadow.camera.far=85;sun.shadow.normalBias=.045;sun.shadow.bias=-.00015;sun.target.position.set(0,6,0);scene.add(sun,sun.target);
const rim=new THREE.DirectionalLight('#d7eece',1.5);rim.position.set(18,14,-15);scene.add(rim);
const ground=new THREE.Mesh(new THREE.CircleGeometry(65,64),new THREE.MeshStandardMaterial({color:'#ced6b9',roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-1.13;ground.receiveShadow=true;scene.add(ground);
const hospital=buildHospital(THREE);scene.add(hospital.group);
const departments=new Map(hospital.departments.map(d=>[d.id,d]));
const meta={
 memory:{name:'内存科',en:'MEMORY WARD',detail:'把病床留给真正需要的任务。',topics:['memory_pressure'],color:'#91ad8e'},
 cpu:{name:'CPU科',en:'PROCESSOR CLINIC',detail:'忙碌也有节奏，先听听算力的心跳。',topics:['cpu_busy','startup_slow','app_hang'],color:'#d9a663'},
 disk:{name:'磁盘科',en:'STORAGE CLINIC',detail:'给每一份文件，留一个舒舒服服的位置。',topics:['disk_low','disk_growth','duplicate_files','dev_cache','trash_review','backup_check','audio_video_cache'],color:'#bc9772'},
 temperature:{name:'温度科',en:'COOLING ROOM',detail:'放慢一点，让设备好好透一口气。',topics:['temperature_high','battery_drain'],color:'#82bbc4'},
 desktop:{name:'桌面科',en:'DESKTOP STUDIO',detail:'帮桌面上的小文件，排好自己的队。',topics:['desktop_crowded','downloads_pile','batch_rename'],color:'#d1b077'},
 network:{name:'网络科',en:'NETWORK CLINIC',detail:'一根根连接里，藏着通信的小秘密。',topics:['network_dns','network_busy','port_conflict','cloud_sync','device_or_update_error'],color:'#83a9b6'}
};
const state={active:null,pinned:false,paused:matchMedia('(prefers-reduced-motion: reduce)').matches,elapsed:0,scenario:'normal',statuses:{memory:'healthy',cpu:'healthy',disk:'healthy',temperature:'unknown',desktop:'healthy',network:'healthy'},manual:{},target:'系统盘',lastCopied:null,copyMethod:null,mode:'demo'};
// Room materials are isolated for hover tint; shared geometry is retained.
for(const d of hospital.departments){const mats=new Map();d.group.traverse(o=>{if(!o.isMesh)return;if(o.material?.transparent&&o.material.opacity===0)return;const arr=Array.isArray(o.material)?o.material:[o.material];const out=arr.map(m=>{if(!mats.has(m)){const c=m.clone();c.userData.baseEmissive=c.emissive?.getHex()??0;c.userData.baseIntensity=c.emissiveIntensity??1;mats.set(m,c);}return mats.get(m);});o.material=Array.isArray(o.material)?out:out[0];});d.isolatedMaterials=[...mats.values()];}
// Independent, editable animated actors. The wrapper owns world movement; the character owns local gait.
const actors=hospital.walkers.map((route,i)=>{const model=createCharacter(THREE,{role:route.role,color:['#8da68b','#c89770','#80a8b7','#bf9aa4'][i%4],scale:.92,seed:i+1});const holder=new THREE.Group();holder.name=route.id;holder.add(model.group);hospital.group.add(holder);const pts=route.points.map(p=>new THREE.Vector3(...p));let lengths=[],total=0;for(let j=0;j<pts.length-1;j++){const l=pts[j].distanceTo(pts[j+1]);total+=l;lengths.push(l);}return {route,model,holder,pts,lengths,total,offset:i*.47,speed:.32+(i%3)*.04};});
// Stationary doctors stay beside examination beds and workbenches.
for(const [i,d] of hospital.departments.entries()){const m=createCharacter(THREE,{role:'doctor',color:i%2?'#68a09b':'#93a47b',scale:.9,seed:30+i});m.group.position.set(i%2?-1.8:1.8,.52,.1);d.group.add(m.group);actors.push({model:m,stationary:true,baseY:.52});}
for(const d of hospital.departments)batchStatic(THREE,d.group,{exclude:new Set(actors.map(a=>a.model.group))});
batchStatic(THREE,hospital.group,{exclude:new Set([...hospital.departments.map(d=>d.group),...actors.map(a=>a.model.group)])});
const peopleBatch=batchActors(THREE,hospital.group,actors);
const halo=new THREE.Mesh(new THREE.RingGeometry(3.12,3.21,80),new THREE.MeshBasicMaterial({color:'#ffe0a0',side:THREE.DoubleSide,transparent:true,opacity:.75,depthWrite:false}));halo.rotation.x=-Math.PI/2;halo.visible=false;scene.add(halo);
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();let hoverTimer,leaveTimer,pointerDown=null,dragging=false;
const selectable=hospital.departments.flatMap(d=>d.hitMeshes.length?d.hitMeshes:[d.group]);
const card=$('#department-card'),choices=$('#rx-choice'),target=$('#target-choice');
let previewRenderer=null,previewCache=new Map();
function makePreview(id){if(previewCache.has(id)){ $('#room-preview').src=previewCache.get(id);return; }const d=departments.get(id);try{previewRenderer ||= new THREE.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});previewRenderer.setSize(540,280);previewRenderer.setPixelRatio(1);previewRenderer.outputColorSpace=THREE.SRGBColorSpace;previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;previewRenderer.toneMappingExposure=1.3;const s=new THREE.Scene();s.background=new THREE.Color('#f1ecdd');s.add(new THREE.HemisphereLight('#fff2ce','#8b9b83',3));const l=new THREE.DirectionalLight('#fff6df',3);l.position.set(-6,10,12);s.add(l);const clone=d.group.clone(true);clone.position.set(0,0,0);clone.traverse(o=>{if(o.userData.dynamicSource)o.visible=true;if(o.material?.transparent&&o.material.opacity===0)o.visible=false;});s.add(clone);const b=new THREE.Box3().setFromObject(clone);const c=b.getCenter(new THREE.Vector3()),size=b.getSize(new THREE.Vector3());const height=Math.max(size.y*1.3,size.x/1.9*1.3,4.5);const cam=new THREE.OrthographicCamera(-height*1.93/2,height*1.93/2,height/2,-height/2,.1,80);cam.position.copy(c).add(new THREE.Vector3(6,4.2,12));cam.lookAt(c);previewRenderer.render(s,cam);const url=previewRenderer.domElement.toDataURL('image/png');previewCache.set(id,url);$('#room-preview').src=url;}catch(e){$('#room-preview').removeAttribute('src');}}
function statusLabel(s){return ({healthy:'状态健康',unknown:'等待检查',unsupported:'暂未接入',warning:'需要留意',critical:'建议处理'})[s]||'等待检查';}
function topicForOption(value){for(const t of library.topics){const o=t.options.find(o=>o.id===value);if(o)return {topic:t,option:o};}return null;}
function updateTargets(){const pair=topicForOption(choices.value);if(!pair)return;const kind=pair.topic.target_kind;$('#target-line').hidden=kind==='device';const defaults=kind==='disk_volume'?['系统盘','外接盘']:kind==='port'?['端口3000','端口8080']:kind==='app'?['当前选中的应用']:pair.topic.id==='downloads_pile'?['下载目录']:pair.topic.id==='audio_video_cache'?['剪辑缓存目录']:pair.topic.id==='cloud_sync'?['当前云同步目录']:['桌面','当前选中的文件夹'];target.replaceChildren(...defaults.map(v=>new Option(v,v)));refreshPrompt();}
function refreshPrompt(){const pair=topicForOption(choices.value);if(!pair)return;let text=pair.option.prompt;if(text.includes('{{target}}'))text=text.replaceAll('{{target}}',()=>target.value||'当前选中的对象');$('#prescription-text').textContent=text;$('#copy-rx').disabled=!text;$('#copy-feedback').textContent='';$('#manual-copy').hidden=true;}
function fillChoices(id){const ids=meta[id].topics;choices.replaceChildren();for(const topicId of ids){const t=library.topics.find(t=>t.id===topicId);if(!t)continue;const g=document.createElement('optgroup');g.label=t.label;for(const o of t.options)g.append(new Option(o.label,o.id));choices.append(g);}const kind=library.selection_policy[state.statuses[id]]||'check';const primary=library.topics.find(t=>t.id===ids[0]);choices.value=state.manual[id]||primary.options.find(o=>o.kind===kind)?.id||primary.options[0].id;updateTargets();}
function setActive(id,{pin=false,fromKeyboard=false}={}){clearTimeout(leaveTimer);if(!departments.has(id))return;if(state.pinned&&!pin&&state.active!==id)return;state.active=id;if(pin)state.pinned=true;const d=departments.get(id),m=meta[id];card.hidden=false;card.classList.add('visible');$('#card-name').textContent=m.name;$('#card-eyebrow').textContent=m.en;$('#card-detail').textContent=m.detail;const badge=$('#card-status');badge.textContent=statusLabel(state.statuses[id]);badge.dataset.status=state.statuses[id];$('#pin-card').setAttribute('aria-pressed',state.pinned);$('#pin-card').title=state.pinned?'取消固定':'固定卡片';$('#pin-card').textContent=state.pinned?'已固定':'固定';card.style.setProperty('--accent',m.color);document.querySelectorAll('.department-tab').forEach(b=>b.classList.toggle('active',b.dataset.department===id));fillChoices(id);makePreview(id);halo.position.copy(d.group.position);halo.position.y+=.49;halo.scale.set(1,.68,1);halo.visible=true;for(const dep of hospital.departments){for(const mat of dep.isolatedMaterials){if(!mat.emissive)continue;mat.emissive.setHex(mat.userData.baseEmissive);mat.emissiveIntensity=mat.userData.baseIntensity;if(dep.id===id){mat.emissive.lerp(new THREE.Color('#d99c4c'),.13);mat.emissiveIntensity=.34;}}}if(fromKeyboard)$('#rx-choice').focus({preventScroll:true});}
function closeCard(){state.active=null;state.pinned=false;card.classList.remove('visible');card.hidden=true;halo.visible=false;for(const d of hospital.departments)for(const m of d.isolatedMaterials){if(m.emissive){m.emissive.setHex(m.userData.baseEmissive);m.emissiveIntensity=m.userData.baseIntensity;}}document.querySelectorAll('.department-tab').forEach(b=>b.classList.remove('active'));}
function picked(event){const rect=renderer.domElement.getBoundingClientRect();mouse.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);const hits=raycaster.intersectObjects(selectable,true);for(const h of hits){let o=h.object;while(o){if(o.userData.departmentId)return o.userData.departmentId;o=o.parent;}}return null;}
renderer.domElement.addEventListener('pointerdown',e=>{pointerDown={x:e.clientX,y:e.clientY};dragging=false;});
renderer.domElement.addEventListener('pointermove',e=>{if(pointerDown&&Math.hypot(e.clientX-pointerDown.x,e.clientY-pointerDown.y)>5)dragging=true;if(dragging)return;const id=picked(e);renderer.domElement.style.cursor=id?'pointer':'grab';clearTimeout(hoverTimer);if(id){if(id===state.active)return;hoverTimer=setTimeout(()=>setActive(id),110);}else if(!state.pinned){clearTimeout(leaveTimer);leaveTimer=setTimeout(()=>{if(!card.matches(':hover'))closeCard();},450);}});
renderer.domElement.addEventListener('pointerup',e=>{const wasDragging=dragging;pointerDown=null;dragging=false;if(!wasDragging){const id=picked(e);if(id)setActive(id,{pin:true});else if(!state.pinned)closeCard();}});
renderer.domElement.addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);pointerDown=null;if(!state.pinned)leaveTimer=setTimeout(()=>{if(!card.matches(':hover'))closeCard();},450);});
card.addEventListener('pointerenter',()=>clearTimeout(leaveTimer));card.addEventListener('pointerleave',()=>{if(!state.pinned)leaveTimer=setTimeout(closeCard,500);});
$('#close-card').onclick=closeCard;$('#pin-card').onclick=()=>{state.pinned=!state.pinned;$('#pin-card').textContent=state.pinned?'已固定':'固定';$('#pin-card').setAttribute('aria-pressed',state.pinned);};
choices.onchange=()=>{state.manual[state.active]=choices.value;updateTargets();};target.onchange=refreshPrompt;
$('#copy-rx').onclick=async()=>{const text=$('#prescription-text').textContent;state.lastCopied=text;try{await navigator.clipboard.writeText(text);state.copyMethod='clipboard';$('#copy-feedback').textContent='处方已复制，交给你的本机 Agent 就好。';}catch{state.copyMethod='manual';const area=$('#manual-copy');area.hidden=false;area.value=text;area.focus();area.select();$('#copy-feedback').textContent='已选中处方，请按 ⌘C / Ctrl+C 复制。';}};
for(const [id,m] of Object.entries(meta)){const b=document.createElement('button');b.className='department-tab';b.dataset.department=id;b.innerHTML='<span class="status-dot"></span>'+m.name;b.onclick=()=>setActive(id,{pin:true,fromKeyboard:false});$('#department-nav').append(b);}
function applyScenario(name){state.scenario=name;state.manual={};Object.keys(state.statuses).forEach(id=>state.statuses[id]=id==='temperature'?'unknown':'healthy');if(name==='memory')state.statuses.memory='warning';if(name==='disk')state.statuses.disk='critical';if(name==='cooling')state.statuses.temperature='warning';for(const [id,s] of Object.entries(state.statuses)){$(`[data-department="${id}"]`)?.setAttribute('data-status',s);}if(state.active)setActive(state.active,{pin:state.pinned});}
$('#scenario').onchange=e=>applyScenario(e.target.value);applyScenario('normal');
$('#pause-motion').textContent=state.paused?'继续巡诊':'暂停动效';$('#pause-motion').setAttribute('aria-pressed',state.paused);
$('#pause-motion').onclick=()=>{state.paused=!state.paused;$('#pause-motion').textContent=state.paused?'继续巡诊':'暂停动效';$('#pause-motion').setAttribute('aria-pressed',state.paused);};
function resetView(){camera.position.set(7,16,39);camera.zoom=1;controls.target.set(0,7,0);controls.update();resize();}$('#reset-view').onclick=resetView;
addEventListener('keydown',e=>{if(e.key==='Escape')closeCard();});
function resize(){const a=innerWidth/innerHeight;let h=26;if(a<1.25)h=32/a;camera.left=-h*a/2;camera.right=h*a/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();
let last=performance.now(),frame=0;const point=new THREE.Vector3(),dir=new THREE.Vector3();
function animate(now){requestAnimationFrame(animate);const dt=Math.max(0,Math.min((now-last)/1000,.06));last=now;if(!state.paused&&!document.hidden)state.elapsed+=dt;const t=state.elapsed;
 if(!state.paused&&!document.hidden){hospital.update(t,dt);for(const a of actors){if(a.stationary){a.model.update(t,dt,{walking:false});continue;}let distance=((t*a.speed+a.offset)%(a.total*2)),back=distance>a.total;if(back)distance=a.total*2-distance;let j=0;while(j<a.lengths.length-1&&distance>a.lengths[j]){distance-=a.lengths[j];j++;}const part=a.lengths[j]?distance/a.lengths[j]:0;point.lerpVectors(a.pts[j],a.pts[j+1],part);a.holder.position.copy(point);dir.subVectors(a.pts[j+1],a.pts[j]);if(back)dir.negate();const angle=Math.atan2(dir.x,dir.z);a.holder.rotation.y+=Math.atan2(Math.sin(angle-a.holder.rotation.y),Math.cos(angle-a.holder.rotation.y))*.12;a.model.update(t,dt,{walking:true,speed:a.speed});}halo.material.opacity=.6+Math.sin(t*2.1)*.15;}
 peopleBatch.update();controls.update();renderer.render(scene,camera);frame++;
 if(frame===2){$('#loading').classList.add('done');setTimeout(()=>$('#loading').remove(),500);window.__hospitalReady=true;}
}
requestAnimationFrame(animate);
// Small, documented boundary for a future local agent to connect a data service.
const adapter={
 getState:()=>({active:state.active,pinned:state.pinned,paused:state.paused,scenario:state.scenario,statuses:{...state.statuses},elapsed:state.elapsed,lastCopied:state.lastCopied,copyMethod:state.copyMethod,departments:[...departments.keys()],renderer:renderer.info.render,actorCount:actors.length,actorBatchCount:peopleBatch.batches,mode:state.mode}),
 selectDepartment:(id)=>setActive(id,{pin:true}),
 applySnapshot(data){if(!data||typeof data!=='object')throw Error('snapshot must be an object');for(const [id,value] of Object.entries(data.departments||{})){if(departments.has(id)&&['healthy','warning','critical','unknown','unsupported'].includes(value.status))state.statuses[id]=value.status;}state.mode='adapter';for(const [id,status] of Object.entries(state.statuses)){$(`[data-department="${id}"]`)?.setAttribute('data-status',status);}if(state.active)setActive(state.active,{pin:state.pinned});},
 getDepartmentScreenPositions(){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);return hospital.departments.map(d=>{const v=d.group.localToWorld(new THREE.Vector3(0,1.8,.4)).project(camera);return {id:d.id,x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};});},
 async exportModel(id='scene'){
  const exporter=new GLTFExporter();let object;
  if(id==='doctor'||id==='visitor')object=createCharacter(THREE,{seed:101,role:id}).group;
  else if(id==='scene'){
   // Export editable source meshes, avoiding the runtime-only instance batches.
   object=buildHospital(THREE).group;hospital.group.updateWorldMatrix(true,true);
   for(const a of actors){const clone=a.model.group.clone(true);clone.traverse(o=>{if(o.userData.dynamicSource)o.visible=true;});a.model.group.matrixWorld.decompose(clone.position,clone.quaternion,clone.scale);object.add(clone);}
  }else{const d=departments.get(id);if(!d)throw Error('unknown department');object=d.group.clone(true);object.position.set(0,0,0);object.traverse(o=>{if(o.userData.dynamicSource)o.visible=true;});}
  object.traverse(o=>{if(o.material?.transparent&&o.material.opacity===0)o.visible=false;});object.updateMatrixWorld(true);
  window.__modelExport={id,phase:'encoding'};
  const binary=await exporter.parseAsync(object,{binary:true,onlyVisible:true});
  window.__modelExport={id,phase:'base64',bytes:binary.byteLength};
  return await new Promise((resolve,reject)=>{const f=new FileReader();f.onload=()=>{window.__modelExport={id,phase:'done',bytes:binary.byteLength};resolve(f.result.split(',')[1]);};f.onerror=()=>reject(f.error);f.readAsDataURL(new Blob([binary],{type:'model/gltf-binary'}));});
 }

};window.ForestHospital=adapter;
