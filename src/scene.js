export function buildHospital(THREE) {
  const group = new THREE.Group(); group.name = 'Forest Hospital';
  const departments = [], walkers = [], animated = [];
  const mats = {};
  const mat = (name, color, roughness=.82, extra={}) => mats[name] ||= new THREE.MeshStandardMaterial({color,roughness,...extra});
  const M = {
    bark:mat('bark','#805438'), barkLight:mat('barkLight','#a8764d'), cut:mat('cut','#d8ae78'),
    leaf1:mat('leaf1','#638653'), leaf2:mat('leaf2','#78975c'), leaf3:mat('leaf3','#426b49'),
    wood:mat('wood','#bc804b'), woodDark:mat('woodDark','#8c5935'), plank:mat('plank','#d4a56d'),
    cream:mat('cream','#fff7e8'), cream2:mat('cream2','#f5e8ce'), gold:mat('gold','#ffcc78'),
    sage:mat('sage','#83a789'), teal:mat('teal','#4c8f90'), ink:mat('ink','#385052'),
    blue:mat('blue','#5d9eb0'), blue2:mat('blue2','#a8d4d5'), red:mat('red','#cf795d'),
    green:mat('green','#4c7555'), metal:mat('metal','#71817b',.34,{metalness:.38}), dark:mat('dark','#293e42',.42),
    paper:mat('paper','#fffdf4'), glow:mat('glow','#ffd988',.25,{emissive:'#e99b36',emissiveIntensity:.45}),
    soil:mat('soil','#54704c'), stone:mat('stone','#a7a18a'), water:mat('water','#74b7b4',.25,{metalness:.1}),
    cpu:mat('cpu','#d6a24c',.45,{metalness:.28}), screen:mat('screen','#173d4c',.28,{emissive:'#1a5969',emissiveIntensity:.26}),
  };
  const geo = {};
  const G = (key,make) => geo[key] ||= make();
  const boxG = (x,y,z)=>G(`b${x},${y},${z}`,()=>new THREE.BoxGeometry(x,y,z));
  const sphereG = (x,y,z,seg=12)=>G(`s${x},${y},${z},${seg}`,()=>new THREE.SphereGeometry(1,seg,Math.max(8,seg-2)).scale(x,y,z));
  const cylG = (a,b,h,n=10)=>G(`c${a},${b},${h},${n}`,()=>new THREE.CylinderGeometry(a,b,h,n));
  const coneG = (r,h,n=8)=>G(`n${r},${h},${n}`,()=>new THREE.ConeGeometry(r,h,n));
  const mesh=(parent,geometry,material,pos=[0,0,0],rot=[0,0,0],name='')=>{
    const o=new THREE.Mesh(geometry,material); o.position.set(...pos); o.rotation.set(...rot); o.castShadow=true; o.receiveShadow=true; if(name)o.name=name; parent.add(o); return o;
  };
  const box=(p,s,m,pos,rot,name)=>mesh(p,boxG(...s),m,pos,rot,name);
  const ball=(p,s,m,pos,name)=>mesh(p,sphereG(...s),m,pos,[0,0,0],name);
  const rod=(p,a,b,r,m,n=8)=>{const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=B.clone().sub(A);const o=mesh(p,cylG(r*.88,r,d.length(),n),m,A.clone().add(B).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
  const label=(parent,text,w=2.6,h=.64)=>{
    const c=document.createElement('canvas'); c.width=512;c.height=128;const x=c.getContext('2d');
    x.fillStyle='#fff4d9';x.beginPath();x.roundRect(5,5,502,118,26);x.fill();x.strokeStyle='#a97848';x.lineWidth=9;x.stroke();
    x.fillStyle='#4a3829';x.font='bold 60px system-ui, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,256,67,460);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const lm=new THREE.MeshStandardMaterial({map:tex,roughness:.9,side:THREE.DoubleSide});
    return mesh(parent,boxG(w,h,.1),lm,[0,0,0],[0,0,0],`sign-${text}`);
  };
  const cylinder=(p,r1,r2,h,m,pos,n=10)=>mesh(p,cylG(r1,r2,h,n),m,pos);
  const heartLeaf=(p,x,y,z,size,m)=>{
    const leaf=ball(p,[size*.72,size*.9,size*.32],m,[x,y,z]);leaf.rotation.z=(x*.18+y*.11)%1;
    rod(p,[x,y-size*.55,z],[x+size*.22,y-size*.95,z],size*.035,M.sage,5);
  };
  // Forest floor and root-island stones
  const floor=mesh(group,new THREE.CylinderGeometry(15.5,16.4,.85,12),M.soil,[0,-.45,-1.2]);floor.scale.z=.74;
  ball(group,[13,.34,7],M.leaf3,[0,-.66,-1.2],'moss island');
  for(let i=0;i<23;i++){const a=i*Math.PI*2/23,r=12+(i%3)*.6;ball(group,[.55+(i%2)*.2,.35,.48],i%3?M.stone:M.leaf2,[Math.cos(a)*r,-.2,-1.2+Math.sin(a)*r*.66]);}
  for(let i=0;i<9;i++){const a=i*2.4;rod(group,[Math.cos(a)*1.2,.0,-3+Math.sin(a)],[Math.cos(a)*4.2,.32,-3+Math.sin(a)*2],.42,M.bark,8);}
  // Tapered old tree with rising roots, ridged bark and a fine leaf canopy.
  const trunkZ=-6.2;
  const trunkLower=mesh(group,cylG(1.72,2.35,5.2,14),M.bark,[0,2.6,trunkZ]);trunkLower.rotation.z=-.035;
  const trunkMid=mesh(group,cylG(1.12,1.72,4.8,14),M.bark,[.08,7.6,trunkZ-.05]);trunkMid.rotation.z=.025;
  const trunkTop=mesh(group,cylG(.28,1.12,3.8,12),M.bark,[.35,11.9,trunkZ-.22]);trunkTop.rotation.z=.08;
  for(let i=0;i<11;i++){
    const a=i*Math.PI*2/11,dx=Math.cos(a),dz=Math.sin(a),r=1.15+(i%3)*.16;
    rod(group,[dx*r,.5,trunkZ+dz*r],[dx*.68,4.2,trunkZ+dz*.65],.34,M.barkLight,8);
    const bx=.35+Math.cos(a)*(4.4+(i%3)*1.1),by=10.2+(i%4)*.65,bz=trunkZ-1.8+Math.sin(a)*2.0;
    rod(group,[.25,8.7,trunkZ-.12],[bx,by,bz],.42-(i%3)*.055,M.bark,9);
    rod(group,[bx,by,bz],[bx+Math.cos(a)*1.4,by+1.4,bz+Math.sin(a)*.8],.17,M.barkLight,7);
  }
  // Small overlapping leaf clusters create a soft crown without giant floating ellipsoids.
  let seed=41;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
  const canopyBands=[[-12,13,-10,3.2],[-8,15,-10,2.8],[-3,16,-10,2.7],[3,16,-10,2.8],[8,14.7,-10,3.1],[12,12.5,-9,2.8],[-13,9,-9,2.0],[13,9.5,-9,2.1],[0,14,-11,3.2]];
  for(const [cx,cy,cz,r] of canopyBands){
    // Broad, tapered bough reaches from the trunk to the underside of each crown.
    const end=[cx,cy-1.05,cz];
    const knots=[[0,8.9,trunkZ-.2],[cx*.38,9.65,trunkZ-1.45],[cx*.76,cy-.72,cz+.55],end];
    for(let k=0;k<knots.length-1;k++)rod(group,knots[k],knots[k+1],[.62,.48,.32][k],M.bark,k===0?10:8);
    rod(group,[cx*.76,cy-.72,cz+.55],[cx+(cx<0?-1:1)*.95,cy-.12,cz-.12],.22,M.barkLight,7);
    for(let i=0;i<12;i++){
      const a=rand()*Math.PI*2,rad=Math.sqrt(rand())*r;
      const x=cx+Math.cos(a)*rad,y=cy+(rand()-.5)*1.3,z=cz+Math.sin(a)*rad*.42;
      const size=.58+rand()*.42, lm=[M.leaf1,M.leaf2,M.leaf3][Math.floor(rand()*3)];
      ball(group,[size*1.15,size*.82,size*.8],lm,[x,y,z]);
    }
  }
  // Hanging vines with tiny alternating leaves.
  for(let i=0;i<10;i++){const x=-13+i*2.85,y=13.6+(i%3)*.45,z=-7.7;rod(group,[x,y,z],[x+.25,y-(1.5+(i%3)*.45),z+.25],.055,M.green,5);for(let j=0;j<3;j++)heartLeaf(group,x+(j%2?.42:-.18),y-.5-j*.48,z+.23,.3,j%2?M.leaf1:M.leaf2);}

  // room utilities
  function makeLamp(p,pos){
    rod(p,[pos[0],pos[1]+.28,pos[2]],[pos[0],pos[1]+.65,pos[2]],.045,M.woodDark,6);
    box(p,[.3,.32,.3],M.woodDark,[pos[0],pos[1],pos[2]]);
    ball(p,[.16,.18,.16],M.glow,[pos[0],pos[1],pos[2]+.015]);
  }
  function planter(p,x,z){cylinder(p,.32,.4,.48,M.wood,[x,.26,z],8);ball(p,[.35,.55,.35],M.leaf2,[x,.72,z]);for(let j=0;j<4;j++)heartLeaf(p,x+Math.cos(j*1.57)*.25,.8+((j%2)*.18),z+Math.sin(j*1.57)*.25,.32,M.leaf1);}
  function bed(p,x,z,color=M.sage){
    box(p,[1.6,.22,1.02],M.woodDark,[x,.82,z]);box(p,[1.48,.2,.9],M.cream2,[x,.97,z]);
    box(p,[.43,.18,.72],M.cream,[x-.45,1.11,z-.02]);box(p,[.82,.12,.9],color,[x+.24,1.12,z+.03]);
    for(const dx of [-.65,.65])for(const dz of [-.37,.37])box(p,[.1,.55,.1],M.woodDark,[x+dx,.35,z+dz]);
    // Cute little sleeping hardware patient (face plate + eyes + smile)
    const face=box(p,[.48,.35,.09],M.cream,[x-.45,1.29,z+.41]);
    ball(p,[.045,.055,.025],M.ink,[x-.57,1.31,z+.47]);ball(p,[.045,.055,.025],M.ink,[x-.35,1.31,z+.47]);
    const smile=mesh(p,new THREE.TorusGeometry(.075,.018,5,12,Math.PI),M.red,[x-.46,1.23,z+.48],[0,0,Math.PI]);
    return face;
  }
  function roomFrame(g,w=5.8,h=4.4,accent=M.wood){
    // A warm raised timber room with a solid cream back, open front and arched doorway.
    box(g,[w,.28,4.25],M.woodDark,[0,.18,0],[0,0,0],'platform');
    box(g,[w-.16,.12,4.08],M.plank,[0,.38,.04]);
    box(g,[w-.42,h-.35,.28],M.cream2,[0,(h+.35)/2,-1.96]);
    box(g,[w-.42,.62,.08],accent,[0,.72,-1.78]);
    // Cream side returns and small framed windows.
    for(const side of [-1,1]){
      const x=side*(w/2-.14);
      box(g,[.28,h,.38],M.cream2,[x,h/2+.44,-1.83]);
      box(g,[.1,1.0,.84],M.blue2,[side*(w/2-.3),h*.61,-1.59]);
      box(g,[.11,.08,.96],M.woodDark,[side*(w/2-.3),h*.61,-1.59]);
      box(g,[.11,.92,.08],M.woodDark,[side*(w/2-.3),h*.61,-1.59]);
      box(g,[.34,.18,.42],M.woodDark,[x,.92,.02]);
    }
    // Rounded timber arch and pale inner trim frame an open facade.
    const outer=new THREE.TorusGeometry(2.22,.19,8,28,Math.PI);
    const inner=new THREE.TorusGeometry(2.00,.095,8,28,Math.PI);
    mesh(g,outer,M.woodDark,[0,2.3,1.82]);mesh(g,inner,M.plank,[0,2.3,1.84]);
    for(const x of [-2.22,2.22]){
      box(g,[.38,1.98,.35],M.woodDark,[x,1.31,1.82]);
      box(g,[.16,1.68,.39],M.plank,[x,1.3,2.02]);
    }
    // Rounded half-dome roof sits toward the back so hardware stays visible.
    const domeGeo=G('clinic-dome',()=>new THREE.SphereGeometry(1,18,10,0,Math.PI*2,0,Math.PI/2));
    const dome=mesh(g,domeGeo,M.wood,[0,h+.36,-.68]);dome.scale.set(w*.57,1.28,2.55);
    const domeRim=mesh(g,new THREE.TorusGeometry(w*.53,.14,8,32,Math.PI),M.plank,[0,h+.36,-.68]);
    domeRim.rotation.x=-Math.PI/2;domeRim.scale.set(1,1,.8);
    // Fascia beads and carved timber band soften the roof edge.
    for(let i=-4;i<=4;i++)ball(g,[.13,.11,.13],i%2?M.woodDark:M.gold,[i*.61,h+.28,.14]);
    // Low front rail with wide central doorway.
    for(const x of [-2.7,-2.1,2.1,2.7])box(g,[.12,.6,.12],M.woodDark,[x,.68,1.78]);
    rod(g,[-2.72,.98,1.78],[-2.05,.98,1.78],.07,M.plank,7);
    rod(g,[2.05,.98,1.78],[2.72,.98,1.78],.07,M.plank,7);
    for(let x=-2.55;x<=2.55;x+=.55)if(Math.abs(x)>1.8)box(g,[.08,.08,.36],M.wood,[x,.44,1.8]);
  }
  function shelf(p,x,y,z,w=1.25){
    for(const dx of [-w/2,w/2])box(p,[.09,1.55,.12],M.woodDark,[x+dx,y+.78,z]);
    for(const yy of [y+.18,y+.7,y+1.24, y+1.55])box(p,[w,.1,.58],M.plank,[x,yy,z]);
  }
  function screen(p,x,y,z,w=1.1,h=.76,blue=true){
    box(p,[w+.16,h+.16,.13],M.woodDark,[x,y,z]);box(p,[w,h,.07],M.dark,[x,y,z+.08]);box(p,[w-.12,h-.12,.025],blue?M.screen:M.cream,[x,y,z+.13]);
    box(p,[.13,.3,.15],M.metal,[x,y-h*.63,z]);box(p,[.52,.08,.36],M.metal,[x,y-h*.85,z]);
    if(blue){for(let i=0;i<3;i++)box(p,[.23,.035,.015],M.blue2,[x-.24+i*.23,y+.16-i*.08,z+.15]);}
    return p.children[p.children.length-1];
  }
  function makeDepartment(id,name,accent,center,kind){
    const [cx,cy,cz]=center, g=new THREE.Group();g.name=`${id} clinic`;g.position.set(cx,cy,cz);group.add(g);
    roomFrame(g,6.0,4.0,accent);
    const sg=label(g,name,3.45,.82);sg.position.set(0,4.62,2.13);
    // small awning and side hanging lanterns
    for(let i=-2;i<=2;i++)box(g,[1.1,.09,.2],i%2?M.plank:M.wood,[i*1.1,3.92,2.02],[.08,0,0]);
    makeLamp(g,[-2.45,2.65,1.28]);makeLamp(g,[2.45,2.65,1.28]);
    planter(g,-2.3,1.18);planter(g,2.3,1.18);
    const hitMeshes=[];
    // department body is a single invisible interaction volume alongside visible prominent platform
    const hit=box(g,[5.8,4.8,4.15],new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}),[0,2.55,0],[0,0,0],`${id}-hit`);hit.userData.departmentId=id;hitMeshes.push(hit);
    const addHit=o=>{o.userData.departmentId=id;hitMeshes.push(o);return o;};
    departments.push({id,name,group:g,hitMeshes,anchor:new THREE.Vector3(0,3.3,.95),accent:`#${accent.color.getHexString()}`});
    return {g,hit:addHit,center};
  }
  // Treehouse rooms in two staggered levels, all faces aimed toward initial camera.
  const room={
    memory:makeDepartment('memory','内存科',M.sage,[-8.25,7.0,1.1],'memory'),
    cpu:makeDepartment('cpu','CPU 科',M.gold,[0,8.05,-1.0],'cpu'),
    temperature:makeDepartment('temperature','温度科',M.blue2,[8.25,7.0,1.1],'temperature'),
    desktop:makeDepartment('desktop','桌面科',M.teal,[-8.25,1.15,1.75],'desktop'),
    disk:makeDepartment('disk','磁盘科',M.red,[0,1.2,1.5],'disk'),
    network:makeDepartment('network','网络科',M.blue,[8.25,1.15,1.75],'network'),
  };
  // Warm, circular reception counter in front of trunk between lower departments.
  const rec=new THREE.Group();rec.position.set(0,.15,5.2);group.add(rec);
  cylinder(rec,1.36,1.52,.8,M.woodDark,[0,.4,0],12);cylinder(rec,1.42,1.48,.16,M.plank,[0,.85,0],12);box(rec,[1.36,.58,.12],M.cream,[0,.45,.89]);
  const plusH=box(rec,[.56,.13,.1],M.red,[0,.55,.97]);box(rec,[.13,.56,.1],M.red,[0,.55,.97]);
  box(rec,[.56,.28,.48],M.dark,[-.48,1.12,-.18]);box(rec,[.48,.2,.35],M.paper,[.52,1.1,-.15]);
  const recv=label(rec,'接待处',2.15,.54);recv.position.set(0,1.63,.65);
  // Clinic hardware props
  {const p=room.memory.g;
    for(let i=0;i<3;i++){const x=-1.72+i*1.72;bed(p,x,-.08,i===1?M.teal:M.sage);
      // RAM module headboards: PCB, gold contacts, chips
      box(p,[.84,.1,.11],M.green,[x,1.7,-.61]);for(let j=0;j<5;j++){box(p,[.1,.12,.13],M.cpu,[x-.34+j*.17,1.69,-.54]);}
      box(p,[.37,.2,.16],M.dark,[x,1.79,-.61]);box(p,[.17,.07,.1],M.metal,[x-.62,1.66,-.6]);box(p,[.17,.07,.1],M.metal,[x+.62,1.66,-.6]);}
    screen(p,-2.1,2.75,-1.55,.8,.62);for(let i=0;i<2;i++)box(p,[.25,.22,.22],M.cream,[1.68+i*.36,2.05,-1.3]);
  }
  {const p=room.cpu.g;
    // Large CPU patient on examination plinth, cheek pins and playful chip face
    box(p,[2.05,.38,1.18],M.woodDark,[0,.72,.05]);box(p,[1.9,.2,1.05],M.gold,[0,1.02,.05]);box(p,[1.55,.95,.32],M.cpu,[0,1.63,-.04]);box(p,[1.28,.7,.12],M.cream2,[0,1.64,.2]);
    box(p,[.12,.12,.08],M.ink,[-.24,1.75,.29]);box(p,[.12,.12,.08],M.ink,[.24,1.75,.29]);
    const sm=mesh(p,new THREE.TorusGeometry(.15,.026,6,16,Math.PI),M.red,[0,1.53,.29],[0,0,Math.PI]);
    for(let i=-2;i<=2;i++){for(const y of [1.25,2.0])box(p,[.13,.12,.13],M.metal,[i*.29,y,.02]);}
    for(let i=-1;i<=1;i++){box(p,[.13,.55,.13],M.metal,[-1.12,1.62,i*.3]);box(p,[.13,.55,.13],M.metal,[1.12,1.62,i*.3]);}
    // screwdriver tray, tiny capacitors, diagnostic screen
    box(p,[1.2,.1,.48],M.cream2,[-1.75,.75,-.75]);for(let i=0;i<4;i++)cylinder(p,.1,.1,.28,[M.blue,M.red,M.green,M.gold][i],[-2.1+i*.23,.94,-.75],8);
    screen(p,1.8,2.5,-1.45,.85,.65);
  }
  {const p=room.temperature.g;
    bed(p,-.45,-.12,M.blue);box(p,[.85,.18,.65],M.blue,[.32,1.3,.03]);
    // ice compress and frost blocks on the bedside table
    box(p,[.9,.72,.72],M.cream2,[1.8,.86,-.58]);box(p,[.96,.12,.78],M.blue2,[1.8,1.28,-.58]);
    for(let i=0;i<4;i++)box(p,[.27,.28,.28],M.blue2,[1.47+(i%2)*.42,1.48+Math.floor(i/2)*.31,-.54]);
    const fan=new THREE.Group();fan.position.set(-2.0,2.0,-1.1);p.add(fan);cylinder(fan,.48,.48,.16,M.metal,[0,0,0],12);ball(fan,[.38,.38,.1],M.dark,[0,0,.11]);
    const rotor=new THREE.Group();rotor.name='animated-fan-rotor';rotor.position.z=.2;fan.add(rotor);
    for(let i=0;i<4;i++)box(rotor,[.16,.58,.1],M.blue,[0,.23,0],[0,0,i*Math.PI/2]);
    ball(rotor,[.14,.14,.12],M.gold,[0,0,.09]);animated.push({type:'fan',object:rotor,speed:2.1});
    screen(p,2.0,2.65,-1.46,.85,.65);
  }
  {const p=room.desktop.g;
    shelf(p,-1.85,1.0,-1.18,1.35);for(let i=0;i<6;i++){box(p,[.32,.52,.42],i%2?M.blue:M.cream2,[-2.27+(i%3)*.42,1.5+Math.floor(i/3)*.55,-.8]);box(p,[.23,.04,.03],M.gold,[-2.27+(i%3)*.42,1.57+Math.floor(i/3)*.55,-.57]);}
    screen(p,.15,2.22,-1.43,1.45,1.02);box(p,[1.15,.08,.48],M.cream2,[.15,1.42,-1.05]);
    box(p,[.75,.09,.5],M.wood,[.15,1.02,-.98]);box(p,[.12,.06,.3],M.cream,[.82,1.07,-.98]);
    for(let i=0;i<3;i++)box(p,[.2,.22,.1],M.paper,[1.95,1.55+i*.36,-.65]);planter(p,2.25,-.05);
  }
  {const p=room.disk.g;
    shelf(p,-1.65,.8,-1.28,1.42);shelf(p,1.65,.8,-1.28,1.42);
    for(let i=0;i<6;i++){const x=i<3?-1.65:1.65,j=i%3,y=1.2+j*.58;
      box(p,[.75,.4,.45],M.metal,[x,y,-.9]);box(p,[.61,.29,.08],M.dark,[x,y,-.64]);box(p,[.14,.09,.04],M.gold,[x-.2,y,-.59]);box(p,[.1,.09,.04],M.blue2,[x+.12,y,-.59]);
      cylinder(p,.13,.13,.06,M.cream2,[x+.22,y,-.59],12);}
    box(p,[1.25,.18,.56],M.wood,[0,.77,-.95]);for(let i=0;i<3;i++)box(p,[.35,.42,.44],M.blue,[ -.4+i*.4,1.06,-.95]);
  }
  {const p=room.network.g;
    for(let rack=0;rack<2;rack++){const x=-1.25+rack*2.5;box(p,[1.25,2.5,.65],M.dark,[x,1.78,-1.15]);box(p,[1.09,2.32,.1],M.metal,[x,1.78,-.78]);
      for(let row=0;row<5;row++){box(p,[.85,.29,.09],M.ink,[x, .86+row*.42,-.7]);for(let k=0;k<4;k++)ball(p,[.045,.045,.035],k%2?M.glow:M.blue2,[x-.3+k*.2,.86+row*.42,-.63]);}}
    screen(p,0,2.85,-1.45,1.2,.84); // router table
    box(p,[1.45,.26,.72],M.metal,[0,.83,-.48]);box(p,[1.2,.12,.6],M.dark,[0,1.02,-.48]);
    for(let i=0;i<4;i++){const cable=rod(p,[-.48+i*.28,.98,-.2],[-.78+i*.45,.42,.9],.045,[M.blue,M.gold,M.red,M.sage][i],7);}
    for(const x of [-.42,.42])rod(p,[x,1.13,-.5],[x*1.2,2.3,-.95],.035,M.metal,6);
  }

  // Inter-room rope bridges, curved stair treads, platforms and tiny lantern strings.
  function bridge(points){
    for(let i=0;i<points.length-1;i++){
      const a=points[i],b=points[i+1],dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz);
      const along=new THREE.Vector3(dx,dy,dz).normalize(), up=new THREE.Vector3(0,1,0).addScaledVector(along,-along.y).normalize(), across=new THREE.Vector3().crossVectors(along,up).normalize();
      const plank=box(group,[len,.13,.82],M.plank,[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]);plank.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(along,up,across));
      for(const side of [-1,1]){rod(group,[a[0],a[1]+.7,a[2]+side*.43],[b[0],b[1]+.7,b[2]+side*.43],.045,M.woodDark,6);}
    }
    for(let i=0;i<points.length;i++)for(const side of [-1,1]){const [x,y,z]=points[i];rod(group,[x,y,z+side*.43],[x,y+.72,z+side*.43],.055,M.wood,6);if(i%2===0)makeLamp(group,[x,y+.82,z]);}
    for(let i=1;i<points.length-1;i++){const [x,y,z]=points[i];for(let j=-1;j<=1;j++)box(group,[.75,.1,.75],M.plank,[x,y-.05,z+j*.05]);}
  }
  bridge([[-5.3,7.44,2.35],[-3.8,7.62,3.25],[-2.1,7.62,3.3],[0,7.44,3.0]]);
  bridge([[0,7.44,3.0],[2.0,7.62,3.3],[3.8,7.62,3.25],[5.35,7.44,2.35]]);
  bridge([[-5.3,1.59,3.0],[-3.5,1.93,4.1],[-1.8,1.93,4.2],[0,1.64,2.95]]);
  bridge([[0,1.64,2.95],[1.9,1.93,4.2],[3.6,1.93,4.1],[5.4,1.59,3.0]]);
  // stairs descend to front reception deck
  for(let i=0;i<6;i++){box(group,[1.25,.15,.72],M.plank,[0,.95-i*.14,5.0+i*.55]);}
  // root-side hanging bridge to forest edge with rope hoops
  bridge([[0,2.1,7.0],[1.7,1.8,8.0],[3.4,1.45,8.2],[5.2,1.15,7.5]]);
  // scattered low pots and flowers at ground level
  for(let i=0;i<12;i++){const x=-11+(i*2.05)%22,z=4.2+(i%4)*.75;planter(group,x,z);}

  // Walker routes are exported for characters.js/root to instantiate and animate.
  const routes=[
    {id:'doctor-memory',role:'doctor',points:[[-7.7,7.44,2.65],[-6.5,7.44,2.7],[-5.45,7.44,2.6],[-6.3,7.44,2.15]]},
    {id:'visitor-upper-bridge',role:'visitor',points:[[-5.3,7.505,2.35],[-3.8,7.685,3.25],[-2.1,7.685,3.3],[0,7.505,3.0],[2,7.685,3.3],[3.8,7.685,3.25],[5.35,7.505,2.35]]},
    {id:'doctor-cpu',role:'doctor',points:[[-1.65,8.49,2.65],[0,8.49,2.7],[1.65,8.49,2.65],[0,8.49,2.1]]},
    {id:'doctor-temp',role:'doctor',points:[[7.7,7.44,2.65],[6.5,7.44,2.7],[5.45,7.44,2.6],[6.3,7.44,2.15]]},
    {id:'visitor-lower-bridge',role:'visitor',points:[[-5.3,1.655,3.0],[-3.5,1.995,4.1],[-1.8,1.995,4.2],[0,1.705,2.95],[1.9,1.995,4.2],[3.6,1.995,4.1],[5.4,1.655,3.0]]},
    {id:'visitor-desktop',role:'visitor',points:[[-7.7,1.59,2.7],[-6.0,1.59,2.65],[-5.45,1.59,2.6],[-6.6,1.59,2.25]]},
    {id:'doctor-disk',role:'doctor',points:[[-1.65,1.64,2.65],[0,1.64,2.7],[1.65,1.64,2.65],[0,1.64,2.1]]},
    {id:'visitor-network',role:'visitor',points:[[7.7,1.59,2.7],[6.0,1.59,2.65],[5.45,1.59,2.6],[6.5,1.59,2.25]]},
    {id:'receptionist',role:'doctor',points:[[-1.1,0,5.2],[0,0,5.2],[1.1,0,5.2]]},
  ];walkers.push(...routes);

  function update(t,dt){for(const a of animated)if(a.type==='fan')a.object.rotation.z+=dt*a.speed;}
  function dispose(){
    group.traverse(o=>{if(o.isMesh && o.material?.map && o.material.map.userData?.generatedLabel)o.material.map.dispose();});
  }
  return {group,departments,walkers,update,dispose};
}
