
(function(){
'use strict';
const SAVE_KEY='tinker-island-v1';

/* ---------- studio sting ----------
   Quiz Keep IntroSequence: portrait bounce, wink, Zaffr wordmark, wipe.
   The 2s white hold there is the tap-to-start wait; playback begins at the portrait. */
(function(){
  const root=document.getElementById('zafrSting');
  if(!root)return;
  const portrait=document.getElementById('zafrPortrait');
  const pop=document.getElementById('zafrPop');
  const me=document.getElementById('zafrMe');
  const wink=document.getElementById('zafrWink');
  const logoStage=document.getElementById('zafrLogoStage');
  const logo=document.getElementById('zafrLogo');
  const hint=root.querySelector('.studio-hint');
  if(!portrait||!pop||!me||!wink||!logoStage||!logo){root.remove();return;}
  const MS={WHITE_INITIAL:2000,PORTRAIT_SCALE_DURATION:700,PORTRAIT_HOLD_1:1000,PORTRAIT_TO_WINK:100,PORTRAIT_FROM_WINK:100,PORTRAIT_HOLD_2:2000,PORTRAIT_FADEOUT:400,WHITE_AFTER_PORTRAIT:1000,LOGO_FADEIN:500,LOGO_HOLD:2000,LOGO_FADEOUT:500,WIPE_DURATION:250};
  const T={
    WHITE_END:MS.WHITE_INITIAL,
    PORTRAIT_SCALE_END:MS.WHITE_INITIAL+MS.PORTRAIT_SCALE_DURATION,
    PORTRAIT_HOLD_1_END:MS.WHITE_INITIAL+MS.PORTRAIT_SCALE_DURATION+MS.PORTRAIT_HOLD_1
  };
  T.TO_WINK_END=T.PORTRAIT_HOLD_1_END+MS.PORTRAIT_TO_WINK;
  T.FROM_WINK_END=T.TO_WINK_END+MS.PORTRAIT_FROM_WINK;
  T.PORTRAIT_HOLD_2_END=T.FROM_WINK_END+MS.PORTRAIT_HOLD_2;
  T.PORTRAIT_FADEOUT_END=T.PORTRAIT_HOLD_2_END+MS.PORTRAIT_FADEOUT;
  T.WHITE_2_END=T.PORTRAIT_FADEOUT_END+MS.WHITE_AFTER_PORTRAIT;
  T.LOGO_FADEIN_END=T.WHITE_2_END+MS.LOGO_FADEIN;
  T.LOGO_HOLD_END=T.LOGO_FADEIN_END+MS.LOGO_HOLD;
  T.LOGO_FADEOUT_END=T.LOGO_HOLD_END+MS.LOGO_FADEOUT;
  T.WIPE_END=T.LOGO_FADEOUT_END+MS.WIPE_DURATION;
  const PLAY=T.WIPE_END-T.WHITE_END;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let finished=false,started=false,raf=0,failSafe=0,winked=false,logoed=false,wiped=false,opened=false;
  const failed=new Set();
  document.documentElement.classList.add('studio-intro');
  function finish(){
    if(finished)return;
    finished=true;
    cancelAnimationFrame(raf);
    clearTimeout(failSafe);
    window.removeEventListener('keydown',onKey,true);
    root.removeEventListener('pointerdown',onPointer);
    document.documentElement.classList.remove('studio-intro');
    if(root.parentNode)root.parentNode.removeChild(root);
  }
  function onImgError(src){failed.add(src);if(failed.size>=3)finish();}
  function easeOutBounce(t){
    if(t<1/2.75)return 7.5625*t*t;
    if(t<2/2.75)return 7.5625*(t-=1.5/2.75)*t+.75;
    if(t<2.5/2.75)return 7.5625*(t-=2.25/2.75)*t+.9375;
    return 7.5625*(t-=2.625/2.75)*t+.984375;
  }
  let stingAc=null,soundOn=true;
  try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(saved&&saved.ui&&saved.ui.sound===false)soundOn=false;}catch(e){}
  function stingAudio(){
    if(!soundOn)return null;
    try{
      stingAc=stingAc||new (window.AudioContext||window.webkitAudioContext)();
      if(stingAc.state==='suspended'){const r=stingAc.resume();if(r&&r.catch)r.catch(function(){});}
      return stingAc.state==='running'?stingAc:null;
    }catch(e){return null;}
  }
  function stingTone(f,d,vol,delay,to){
    const a=stingAudio();if(!a||!(f>0)||!(d>0))return;
    const t0=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();
    o.type='sine';o.frequency.setValueAtTime(f,t0);
    if(to>0)o.frequency.exponentialRampToValueAtTime(to,t0+d);
    g.gain.setValueAtTime(vol||.05,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
    o.connect(g);g.connect(a.destination);o.start(t0);o.stop(t0+d+.02);
  }
  function stingNoise(d,vol,f0,f1){
    const a=stingAudio();if(!a)return;
    const n=Math.max(1,Math.floor(a.sampleRate*d)),buf=a.createBuffer(1,n,a.sampleRate),ch=buf.getChannelData(0);
    let pink=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;pink=pink*.98+w*.02;ch[i]=pink;}
    const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain(),t0=a.currentTime;
    s.buffer=buf;f.type='lowpass';f.frequency.setValueAtTime(f0,t0);f.frequency.exponentialRampToValueAtTime(Math.max(1,f1),t0+d);
    g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);
    s.connect(f);f.connect(g);g.connect(a.destination);s.start(t0);s.stop(t0+d);
  }
  function cueOpen(){if(opened)return;opened=true;stingTone(392,.18,.04,0,587);stingTone(784,.14,.016,.08);}
  function cueWink(){stingTone(880,.06,.16);stingTone(1320,.06,.14,.055);}
  function cueLogo(){const f=196*(1+(Math.random()*2-1)*.015);stingTone(f,.5,.14);stingTone(f*1.5,.42,.04);}
  function cueWipe(){stingNoise(.2,.12,1100,180);stingTone(180,.22,.1,0,80);}
  function paint(t){
    if(!opened)cueOpen();
    if(t>=T.PORTRAIT_HOLD_1_END&&!winked){winked=true;cueWink();}
    if(t>=T.WHITE_2_END&&!logoed){logoed=true;cueLogo();}
    if(t>=T.LOGO_FADEOUT_END&&!wiped){wiped=true;cueWipe();}
    const scaleT=t>=T.PORTRAIT_SCALE_END?1:t>=T.WHITE_END?Math.min(1,(t-T.WHITE_END)/MS.PORTRAIT_SCALE_DURATION):0;
    const portraitOn=t>=T.WHITE_END&&t<T.PORTRAIT_FADEOUT_END;
    portrait.hidden=!portraitOn;
    if(portraitOn){
      const meOp=t<T.PORTRAIT_HOLD_1_END?1:t<T.TO_WINK_END?1-(t-T.PORTRAIT_HOLD_1_END)/MS.PORTRAIT_TO_WINK:t<T.FROM_WINK_END?(t-T.TO_WINK_END)/MS.PORTRAIT_FROM_WINK:1;
      const winkOp=t<T.PORTRAIT_HOLD_1_END?0:t<T.TO_WINK_END?(t-T.PORTRAIT_HOLD_1_END)/MS.PORTRAIT_TO_WINK:t<T.FROM_WINK_END?1-(t-T.TO_WINK_END)/MS.PORTRAIT_FROM_WINK:0;
      const fade=t>=T.PORTRAIT_HOLD_2_END?Math.max(0,1-(t-T.PORTRAIT_HOLD_2_END)/MS.PORTRAIT_FADEOUT):1;
      portrait.style.opacity=String(fade);
      pop.style.transform='scale('+easeOutBounce(scaleT)+')';
      me.style.opacity=String(meOp);
      wink.style.opacity=String(winkOp);
    }
    let logoOp=0;
    if(t>=T.LOGO_FADEOUT_END)logoOp=0;
    else if(t>=T.LOGO_HOLD_END)logoOp=Math.max(0,1-(t-T.LOGO_HOLD_END)/MS.LOGO_FADEOUT);
    else if(t>=T.LOGO_FADEIN_END)logoOp=1;
    else if(t>=T.WHITE_2_END)logoOp=(t-T.WHITE_2_END)/MS.LOGO_FADEIN;
    const showLogo=t>=T.WHITE_2_END&&t<T.LOGO_FADEOUT_END;
    logoStage.hidden=!showLogo;
    if(showLogo)logo.style.opacity=String(logoOp);
    const wipe=t>=T.LOGO_FADEOUT_END&&t<T.WIPE_END?(t-T.LOGO_FADEOUT_END)/MS.WIPE_DURATION:t>=T.WIPE_END?1:0;
    root.classList.toggle('is-wiping',wipe>0);
    root.style.transform=wipe>0?'translate3d(0,'+(wipe*-100)+'%,0)':'';
    if(hint)hint.hidden=!(t>=T.WHITE_END&&t<T.LOGO_FADEOUT_END);
  }
  function startClock(){
    const t0=performance.now();
    const tick=()=>{
      if(finished)return;
      if(!failSafe)failSafe=setTimeout(finish,PLAY+1500);
      const e=(performance.now()-t0)+T.WHITE_END;
      try{paint(e);}catch(err){finish();return;}
      if(e<T.WIPE_END)raf=requestAnimationFrame(tick);
      else finish();
    };
    raf=requestAnimationFrame(tick);
  }
  function showEnd(){
    portrait.hidden=true;
    if(hint)hint.hidden=true;
    logoStage.hidden=false;
    logo.style.opacity='1';
    if(logo.complete&&logo.naturalWidth===0){finish();return;}
    logo.addEventListener('error',function(){finish();},{once:true});
    failSafe=setTimeout(finish,700);
  }
  function begin(){
    if(finished||started||!root.isConnected)return;
    started=true;
    if(reduce)showEnd();
    else startClock();
  }
  function onKey(e){
    if(e.key!=='Escape')return;
    e.preventDefault();e.stopPropagation();
    finish();
  }
  function onPointer(e){
    e.preventDefault();e.stopPropagation();
    setTimeout(finish,0);
  }
  window.addEventListener('keydown',onKey,true);
  root.addEventListener('pointerdown',onPointer);
  [me,wink,logo].forEach(img=>{img.addEventListener('error',function(){onImgError(img.getAttribute('src')||img.src);});});
  for(const src of ['images/intro/Me.PNG','images/intro/Me-wink.PNG','images/intro/ZG-Logo.svg']){
    const img=new Image();img.onerror=function(){onImgError(src);};img.src=src;
  }
  const arm=setTimeout(begin,1500);
  if(me.complete&&me.naturalWidth>0){clearTimeout(arm);begin();}
  else{
    me.addEventListener('load',function(){clearTimeout(arm);begin();},{once:true});
    me.addEventListener('error',function(){clearTimeout(arm);begin();},{once:true});
  }
})();

const STEP=1/60, MAX_OBJS=450, MAX_TEMP=70;let HALF=12;
const SIZES=[.5,1,1.8];
const PAINT=['#d9443a','#f2c14e','#6fb34f','#4f9fd8','#9b6ad6','#f08fb4','#f4efe6','#3b3a40','#e8892b','#7ad3c7'];

/* ---------- pixel icons ---------- */
const PAL={k:'#2a1e17',w:'#9a6b45',W:'#c89a64',m:'#b9c2c9',M:'#7f8a93',y:'#e8c25a',b:'#8fc7ff',B:'#4f9fd8',s:'#f1c9a0',S:'#c99872',r:'#d9443a',R:'#ff7b4a'};
function pix(rows){const c=document.createElement('canvas');c.width=c.height=10;const x=c.getContext('2d');
  rows.forEach((r,j)=>[...r].forEach((ch,i)=>{if(PAL[ch]){x.fillStyle=PAL[ch];x.fillRect(i,j,1,1);}}));return c.toDataURL();}
const ICON={
  place:pix(['..........','...kkkk...','..kWWWWk..','.kWWWWWWk.','.kwWWWWwk.','.kwwWWwwk.','.kwwwwwwk.','.kwwwwwwk.','..kwwwwk..','...kkkk...']),
  grab:pix(['..........','..ss.ss...','.ssssssss.','.sSsSsSss.','.ssssssss.','.ssssssss.','..ssssss..','..ssssss..','...SSSS...','..........']),
  poke:pix(['....s.....','....s.....','....s.....','....sss...','...sssss.s','..ssssssss','..sssssss.','..ssssss..','...ssss...','...SSSS...']),
  paint:pix(['.......kk.','......kWk.','.....kWk..','....kWk...','...kWk....','..rrk.....','.rrrr.....','.rrr......','rr........','..........']),
  freeze:pix(['....b.....','..b.b.b...','...bbb....','bbbbbbbbb.','...bbb....','..b.b.b...','....b.....','..........','..........','..........']),
  pan:pix(['....m.....','...mmm....','....m.....','.m..m..m..','mmmmmmmmm.','.m..m..m..','....m.....','...mmm....','....m.....','..........']),
  rotate:pix(['..bbbbb...','.b.....b..','b.......b.','b......bbb','b.......b.','b.........','.b.....b..','..bbbbb...','..........','..........']),
  del:pix(['...MM.....','.MMMMMM...','..........','..mmmmm...','..mMmMm...','..mMmMm...','..mMmMm...','..mMmMm...','..mmmmm...','..........'])
};
const CAMTOOLS=[{id:'pan',name:'Pan',key:'SPACE'},{id:'rotate',name:'Rotate',key:'R'}];
const TOOLS=[{id:'place',name:'Place'},{id:'grab',name:'Grab'},{id:'poke',name:'Poke'},{id:'paint',name:'Paint'},{id:'freeze',name:'Freeze'},{id:'del',name:'Delete'}];
const CATS=['Blocks','Nature','Machines','Boom'];

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rnd=(a,b)=>a+Math.random()*(b-a);
const store={get(){try{return JSON.parse(localStorage.getItem(SAVE_KEY)||'null');}catch(e){return null;}},set(v){try{localStorage.setItem(SAVE_KEY,JSON.stringify(v));}catch(e){}}};

function boot(hotData){
  const saved=(hotData&&hotData.save)||store.get();
  const state=Object.assign({tool:'place',kind:'crate',cat:'Blocks',size:1,rotY:0,snap:true,paused:false,speed:1,grav:'earth',wind:false,sun:0,pixel:3,sound:true,rot:0,voidCount:0,paint:0},
    saved&&saved.v===1?saved.ui||{}:{});
  state.paused=false;state.pixel=1;state.sun=0;state.snap=true;state.speed=1;state.grav='earth';
  let mode='menu',camp=null,zone=null;

  /* ---------- three ---------- */
  const canvas=document.getElementById('view');
  let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});}catch(e){toast('WebGL is not available in this browser');return;}
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,300);
  const M=(color,o)=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:.92,metalness:0,flatShading:true},o||{}));
  const mats={
    dirt:M('#8b5e3c'),dirt2:M('#6e4a32'),rock:M('#5d5650'),rock2:M('#4a4440'),tuft:M('#5e9e42'),
    dark:M('#2f3036'),post:M('#3c3a3f'),woodDark:M('#7a5236'),trunk:M('#7a5236'),leaf2:M('#3f8a3a'),paper:M('#f4efe6'),
    comb:M('#d9443a'),snout:M('#e07d92'),beak:M('#f0a830'),duckHead:M('#2f6b45'),metal:M('#8f979e',{roughness:.5}),red:M('#d9443a'),
    glass:M('#d4f1f8',{transparent:true,opacity:.28,roughness:.1,depthWrite:false}),
    water:M('#4fa3d1',{transparent:true,opacity:.62,roughness:.15,depthWrite:false}),
    lampHead:M('#fff1c2',{emissive:new THREE.Color('#ffc45e'),emissiveIntensity:.2}),
    flame:new THREE.MeshBasicMaterial({color:'#ffb34a'}),hole:new THREE.MeshBasicMaterial({color:'#07040f'}),
    ring:new THREE.MeshBasicMaterial({color:'#b07bff',transparent:true,opacity:.85}),ring2:new THREE.MeshBasicMaterial({color:'#ffb36b',transparent:true,opacity:.7}),
    cloud:M('#c9c5bf',{transparent:true,opacity:.75})
  };
  const geo={};
  const boxG=(w,h,d)=>{const k='b'+w+'|'+h+'|'+d;return geo[k]||(geo[k]=new THREE.BoxGeometry(w,h,d));};
  const icoG=(r,d)=>{const k='i'+r+'|'+(d||0);return geo[k]||(geo[k]=new THREE.IcosahedronGeometry(r,d||0));};
  const cylG=(r,h,n)=>{const k='c'+r+'|'+h+'|'+n;return geo[k]||(geo[k]=new THREE.CylinderGeometry(r,r,h,n||10));};
  function mesh(p,g,mat,x,y,z){const m=new THREE.Mesh(g,mat);m.position.set(x||0,y||0,z||0);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
  const box=(p,w,h,d,mat,x,y,z)=>mesh(p,boxG(w,h,d),mat,x,y,z);
  const ico=(p,r,mat,x,y,z,d)=>mesh(p,icoG(r,d),mat,x,y,z);
  const cyl=(p,r,h,mat,x,y,z,n)=>mesh(p,cylG(r,h,n),mat,x,y,z);

  /* island */
  let groundMesh=null,baseG=null,tufts=null,groundBody=null;
  const tiers=[mats.dirt2,mats.rock,mats.rock2,mats.rock,mats.rock2];
  function buildIsland(h){HALF=h;const n=h*2;
    if(groundMesh){scene.remove(groundMesh);scene.remove(baseG);scene.remove(tufts);}
    const px=4,gc=document.createElement('canvas');gc.width=gc.height=n*px;const gx=gc.getContext('2d');
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){gx.fillStyle=(i+j)%2?'#71b452':'#7abd5a';gx.fillRect(i*px,j*px,px,px);}
    for(let k=0;k<n*n*.75;k++){gx.fillStyle=Math.random()<.5?'#65a84a':'#88c766';gx.fillRect(Math.floor(Math.random()*n*px),Math.floor(Math.random()*n*px),1,1);}
    const gtex=new THREE.CanvasTexture(gc);gtex.magFilter=THREE.NearestFilter;gtex.minFilter=THREE.NearestFilter;gtex.generateMipmaps=false;
    groundMesh=new THREE.Mesh(new THREE.BoxGeometry(n,.6,n),[mats.dirt,mats.dirt,M('#ffffff',{map:gtex}),mats.dirt,mats.dirt,mats.dirt]);
    groundMesh.position.y=-.3;groundMesh.receiveShadow=true;scene.add(groundMesh);
    baseG=new THREE.Group();scene.add(baseG);let w=n-.6,y=-.9,k=0;while(w>1.2&&k<5){box(baseG,w,.6,w,tiers[k],0,y,0);w-=k===0?1.8:Math.max(1.6,n*.12);y-=.6;k++;}
    const tc=Math.round(n*n*.55);tufts=new THREE.InstancedMesh(boxG(.07,.06,.07),mats.tuft,tc);const m4=new THREE.Matrix4();
    for(let q=0;q<tc;q++){m4.makeTranslation(rnd(-h+.2,h-.2),.03,rnd(-h+.2,h-.2));tufts.setMatrixAt(q,m4);}scene.add(tufts);
    if(groundBody)world.remove(groundBody);groundBody=new CANNON.Body({mass:0,material:mDef});groundBody.addShape(new CANNON.Box(V(h,.5,h)));groundBody.position.set(0,-.5,0);world.addBody(groundBody);
    const sc=sun.shadow.camera;sc.left=sc.bottom=-(h+5);sc.right=sc.top=h+5;sc.updateProjectionMatrix();pickDirty=true;}

  /* lights */
  const hemi=new THREE.HemisphereLight('#d8ecff','#5a5040',.75);scene.add(hemi);
  const sun=new THREE.DirectionalLight('#fff3dc',1.25);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-17,right:17,top:17,bottom:-17,near:1,far:90});sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;
  scene.add(sun);scene.add(sun.target);
  const lampLights=[];for(let k=0;k<8;k++){const l=new THREE.PointLight('#ffc45e',0,5,2);l.visible=false;scene.add(l);lampLights.push(l);}
  const flash=new THREE.PointLight('#ffb34a',0,14,2);scene.add(flash);
  const SUNS=[
    {n:'DAY',sky:'#9ed5ec',sun:'#fff3dc',si:1.25,hs:'#d8ecff',hg:'#5a5040',hi:.75,dir:[-.55,1,.5],night:0},
    {n:'GOLD',sky:'#f2a978',sun:'#ffb27a',si:1.05,hs:'#f6c7a0',hg:'#4a3a30',hi:.6,dir:[-1,.45,.3],night:.35},
    {n:'NIGHT',sky:'#141b38',sun:'#8394d6',si:.32,hs:'#3a4a86',hg:'#141428',hi:.45,dir:[.6,1,-.3],night:1},
    {n:'DAWN',sky:'#e9b7c9',sun:'#ffd2b0',si:.95,hs:'#f0d0e0',hg:'#4a3a40',hi:.65,dir:[1,.5,.6],night:.15}];
  function applySun(){const s=SUNS[state.sun];renderer.setClearColor(s.sky);document.body.style.background=s.sky;
    sun.color.set(s.sun);sun.intensity=s.si;hemi.color.set(s.hs);hemi.groundColor.set(s.hg);hemi.intensity=s.hi;
    sun.position.set(...s.dir).normalize().multiplyScalar(40);mats.lampHead.emissiveIntensity=.2+s.night*1.8;
    lampLights.forEach(l=>l.intensity=s.night*1.4);}

  /* particles */
  const PN=900,pMesh=new THREE.InstancedMesh(boxG(1,1,1),new THREE.MeshBasicMaterial({color:'#ffffff'}),PN);pMesh.frustumCulled=false;scene.add(pMesh);
  const P={x:new Float32Array(PN),y:new Float32Array(PN),z:new Float32Array(PN),vx:new Float32Array(PN),vy:new Float32Array(PN),vz:new Float32Array(PN),l:new Float32Array(PN),ml:new Float32Array(PN),s:new Float32Array(PN),g:new Float32Array(PN)};
  let pNext=0;const tmpM=new THREE.Matrix4(),tmpC=new THREE.Color(),zeroM=new THREE.Matrix4().makeScale(0,0,0);
  for(let k=0;k<PN;k++){pMesh.setMatrixAt(k,zeroM);pMesh.setColorAt(k,tmpC.set('#ffffff'));}
  function emit(x,y,z,vx,vy,vz,col,size,life,grav){const k=pNext;pNext=(pNext+1)%PN;
    P.x[k]=x;P.y[k]=y;P.z[k]=z;P.vx[k]=vx;P.vy[k]=vy;P.vz[k]=vz;P.l[k]=life;P.ml[k]=life;P.s[k]=size;P.g[k]=grav;pMesh.setColorAt(k,tmpC.set(col));}
  const FIRE=['#fff1a8','#ffc34a','#ff7b2e','#e0402a'],SMOKE=['#6b6560','#8a847d','#4a4540','#a8a29a'],SPLASH=['#bfe3f5','#ffffff','#8cc8ec'],VOID=['#b07bff','#6a3bd1','#f0d0ff'],DUST=['#d8c9a8','#bfae8a','#e9dfc8'];
  const pick=a=>a[Math.floor(Math.random()*a.length)];
  function burst(x,y,z,n,cols,spd,size,life,grav,up){for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,e=Math.random()*Math.PI-Math.PI/2*(up?0:1),v=spd*rnd(.3,1);
    emit(x,y,z,Math.cos(a)*Math.cos(e)*v,Math.abs(Math.sin(e))*v*(up?1:Math.sign(Math.random()-.3)),Math.sin(a)*Math.cos(e)*v,pick(cols),size*rnd(.6,1.3),life*rnd(.6,1.2),grav);}}
  function updateParticles(dt){for(let k=0;k<PN;k++){if(P.l[k]<=0)continue;P.l[k]-=dt;
    if(P.l[k]<=0){pMesh.setMatrixAt(k,zeroM);continue;}
    P.vy[k]-=9.8*P.g[k]*dt;P.x[k]+=P.vx[k]*dt;P.y[k]+=P.vy[k]*dt;P.z[k]+=P.vz[k]*dt;
    if(P.y[k]<0&&P.g[k]>0&&Math.abs(P.x[k])<HALF&&Math.abs(P.z[k])<HALF){P.y[k]=0;P.vy[k]*=-.3;P.vx[k]*=.6;P.vz[k]*=.6;}
    const sc=P.s[k]*Math.min(1,P.l[k]/P.ml[k]*1.6);tmpM.makeScale(sc,sc,sc);tmpM.setPosition(P.x[k],P.y[k],P.z[k]);pMesh.setMatrixAt(k,tmpM);}
    pMesh.instanceMatrix.needsUpdate=true;if(pMesh.instanceColor)pMesh.instanceColor.needsUpdate=true;}

  /* ---------- physics ---------- */
  const V=(x,y,z)=>new CANNON.Vec3(x,y,z);
  const world=new CANNON.World();world.gravity.set(0,-9.82,0);world.broadphase=new CANNON.SAPBroadphase(world);world.allowSleep=true;world.solver.iterations=12;
  const mDef=new CANNON.Material('def'),mBounce=new CANNON.Material('bounce'),mIce=new CANNON.Material('ice'),mGrip=new CANNON.Material('grip');
  [[mGrip,mDef,.9,0],[mGrip,mGrip,0,0],[mGrip,mBounce,.4,.5],[mGrip,mIce,.02,0],[mDef,mDef,.45,.12],[mBounce,mDef,.4,.85],[mBounce,mBounce,.4,.9],[mIce,mDef,.01,.05],[mIce,mIce,0,.05],[mIce,mBounce,.01,.6]]
    .forEach(([a,b,f,r])=>world.addContactMaterial(new CANNON.ContactMaterial(a,b,{friction:f,restitution:r})));
  const MAT={def:mDef,bounce:mBounce,ice:mIce,grip:mGrip};
  const qUp=new CANNON.Quaternion();qUp.setFromAxisAngle(V(1,0,0),-Math.PI/2);
  const qSide=new CANNON.Quaternion();qSide.setFromAxisAngle(V(0,1,0),Math.PI/2);
  const DYN=CANNON.Body.DYNAMIC,STAT=CANNON.Body.STATIC;
  function nb(mass,mat,lin){return new CANNON.Body({mass,material:MAT[mat||'def'],linearDamping:lin==null?.04:lin,angularDamping:.1,allowSleep:true,sleepSpeedLimit:.15,sleepTimeLimit:1});}
  const bx=(b,hx,hy,hz,ox,oy,oz,q)=>{b.addShape(new CANNON.Box(V(hx,hy,hz)),V(ox||0,oy||0,oz||0),q);return b;};

  /* ---------- kinds ---------- */
  const K={};
  function def(id,o){o.id=id;o.space=o.space||1;K[id]=o;}
  function boxKind(id,o){const [w,h,d]=o.size;def(id,Object.assign({scal:true,bottom:h/2,hr:h/2,half:Math.max(w,d)/2,
    mesh(s,mm){const g=new THREE.Group();box(g,w*s,h*s,d*s,mm,0,0,0);if(o.detail)o.detail(g,s,mm);return g;},
    body(s){return bx(nb(o.mass*s*s*s,o.mat),w*s/2,h*s/2,d*s/2);}},o));}
  function ballKind(id,o){def(id,Object.assign({scal:true,bottom:o.r,hr:o.r,half:o.r,
    mesh(s,mm){const g=new THREE.Group();ico(g,o.r*s,mm,0,0,0,1);if(o.detail)o.detail(g,s,mm);return g;},
    body(s){const b=nb(o.mass*s*s*s,o.mat,o.lin);b.addShape(new CANNON.Sphere(o.r*s));return b;}},o));}

  boxKind('crate',{cat:'Blocks',name:'Crate',size:[.8,.8,.8],mass:2,col:'#c89a5a',dens:.5,space:.85,tip:'Wooden crate. Floats.',
    detail(g,s){for(const y of[-.34,.34])box(g,.84*s,.1*s,.84*s,mats.woodDark,0,y*s,0);for(const x of[-.34,.34])box(g,.1*s,.7*s,.84*s,mats.woodDark,x*s,0,0);}});
  boxKind('stone',{cat:'Blocks',name:'Stone',size:[.8,.8,.8],mass:8,col:'#a39d93',dens:2.5,space:.85,tip:'Heavy stone block. Sinks.'});
  boxKind('plank',{cat:'Blocks',name:'Plank',size:[2,.16,.45],mass:1.2,col:'#d6a86c',dens:.5,space:.5,align:true,tip:'Long plank for bridges and levers.'});
  boxKind('domino',{cat:'Blocks',name:'Domino',size:[.2,1,.5],mass:.7,mat:'grip',col:'#f4efe6',dens:.9,space:.5,align:true,tip:'Drag to lay a line, then poke the first one.',
    detail(g,s){for(const y of[-.24,.24])box(g,.21*s,.08*s,.08*s,mats.dark,0,y*s,0);box(g,.21*s,.03*s,.4*s,mats.dark,0,0,0);}});
  boxKind('pillar',{cat:'Blocks',name:'Pillar',size:[.45,2,.45],mass:4,col:'#d9d2c3',dens:2.2,space:.6,tip:'Tall column. Topples nicely.',
    detail(g,s,mm){for(const y of[-.94,.94])box(g,.56*s,.12*s,.56*s,mm,0,y*s,0);}});
  boxKind('brick',{cat:'Blocks',name:'Brick',size:[.6,.3,.3],mass:.6,col:'#b5523b',dens:1.9,space:.62,align:true,tip:'Single brick.'});
  def('wall',{cat:'Blocks',name:'Brick wall',col:'#b5523b',scal:true,bottom:0,half:.2,many:true,space:3.2,align:true,tip:'Thirty bricks, ready to knock down.',
    layout(s){const out=[];for(let r=0;r<6;r++)for(let c=0;c<5;c++){const off=r%2?.31:0;if(r%2&&c===4)continue;out.push([(c-2)*.62*s+off*s,(.15+r*.305)*s,0]);}return out;},
    mesh(s,mm){const g=new THREE.Group();this.layout(s).forEach(p=>box(g,.6*s,.3*s,.3*s,mm,p[0],p[1],p[2]));return g;}});
  ballKind('ball',{cat:'Blocks',name:'Ball',r:.35,mass:2,col:'#d9443a',dens:1.1,space:.8,tip:'Rubber ball. Rolls a long way.'});
  ballKind('beach',{cat:'Blocks',name:'Beach ball',r:.5,mass:.25,col:'#f4efe6',mat:'bounce',dens:.08,space:1.1,tip:'Very bouncy and very light.',
    detail(g,s){cyl(g,.505*s,.22*s,mats.red,0,0,0,10);cyl(g,.36*s,.12*s,PAINTM[3],0,.44*s,0,8);}});
  boxKind('steel',{cat:'Blocks',name:'Steel',size:[.8,.8,.8],mass:40,col:'#7a828c',dens:7,space:.85,frozen:true,fixed:true,mm:{roughness:.3,metalness:.55},tip:'Immovable. Shields what’s behind it from blasts.',
    detail(g,s){for(const y of[-.3,.3])box(g,.84*s,.07*s,.84*s,mats.dark,0,y*s,0);for(const a of[-.28,.28])for(const b of[-.28,.28])box(g,.08*s,.08*s,.82*s,mats.metal,a*s,b*s,0);}});
  boxKind('glass',{cat:'Blocks',name:'Glass',size:[.8,.8,.8],mass:1,col:'#cdeefa',dens:1,space:.85,frozen:true,glass:true,mm:{transparent:true,opacity:.42,roughness:.05,metalness:.1},tip:'Fixed in place. Shatters on a hard hit or a blast.',
    detail(g,s){const e=new THREE.LineSegments(new THREE.EdgesGeometry(boxG(.8*s,.8*s,.8*s)),new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.8}));g.add(e);}});
  boxKind('ice',{cat:'Blocks',name:'Ice',size:[.8,.8,.8],mass:1.5,col:'#c4ebf7',mat:'ice',dens:.9,space:.85,mm:{transparent:true,opacity:.78,roughness:.15},tip:'Almost no friction.'});
  def('barrel',{cat:'Blocks',name:'Barrel',col:'#9a5a34',scal:true,bottom:.45,hr:.45,half:.32,dens:.6,space:.7,tip:'Rolls when it falls over.',
    mesh(s,mm){const g=new THREE.Group();cyl(g,.32*s,.9*s,mm,0,0,0,10);for(const y of[-.3,.3])cyl(g,.335*s,.06*s,mats.metal,0,y*s,0,10);return g;},
    body(s){const b=nb(2.2*s*s*s);b.addShape(new CANNON.Cylinder(.32*s,.32*s,.9*s,10),V(0,0,0),qUp);return b;}});
  def('anvil',{cat:'Blocks',name:'Anvil',col:'#4a4d55',scal:true,bottom:.33,hr:.33,half:.45,dens:7,space:1,tip:'Thirty kilos of cartoon justice.',
    mesh(s,mm){const g=new THREE.Group();box(g,.9*s,.22*s,.45*s,mm,0,.2*s,0);box(g,.3*s,.14*s,.3*s,mm,.55*s,.22*s,0);box(g,.35*s,.22*s,.3*s,mm,0,-.02*s,0);box(g,.72*s,.16*s,.45*s,mm,0,-.24*s,0);return g;},
    body(s){return bx(nb(30*s*s*s),.45*s,.33*s,.225*s);}});
  def('ramp',{cat:'Blocks',name:'Ramp',col:'#c9b48f',frozen:true,bottom:.42,half:.6,space:2.2,tip:'Fixed slope. Unfreeze it to drop it.',
    mesh(s,mm){const g=new THREE.Group(),r=new THREE.Group();r.rotation.z=.32;g.add(r);box(r,2.2,.16,1.2,mm,0,0,0);
      for(const z of[-.56,.56])box(r,2.2,.12,.06,mats.woodDark,0,.1,z);return g;},
    body(){const b=nb(3);const q=new CANNON.Quaternion();q.setFromAxisAngle(V(0,0,1),.32);bx(b,1.1,.08,.6,0,0,0,q);return b;}});
  ballKind('cball',{cat:null,name:'Cannonball',r:.2,mass:6,col:'#2f3036',dens:7,mm:{roughness:.45}});

  def('tree',{cat:'Nature',name:'Tree',col:'#4f9a47',frozen:true,bottom:0,half:.6,space:1.4,tip:'Rooted. Freeze tool lets it fall.',
    mesh(s,mm){const g=new THREE.Group();box(g,.22,1.2,.22,mats.trunk,0,.6,0);ico(g,.62,mm,0,1.45,0);ico(g,.42,mats.leaf2,.18,1.88,-.1);return g;},
    body(){const b=nb(6);bx(b,.11,.6,.11,0,.6,0);b.addShape(new CANNON.Sphere(.6),V(0,1.5,0));return b;}});
  def('rock',{cat:'Nature',name:'Rock',col:'#7d776f',scal:true,bottom:.42,hr:.42,half:.45,dens:2.6,space:1,tip:'Lumpy and heavy.',
    mesh(s,mm){const g=new THREE.Group(),m=ico(g,.5*s,mm,0,0,0);m.scale.set(1,.85,.92);m.rotation.set(.4,1.1,.2);return g;},
    body(s){const b=nb(10*s*s*s);b.addShape(new CANNON.Sphere(.42*s));return b;}});
  def('pumpkin',{cat:'Nature',name:'Pumpkin',col:'#e8892b',scal:true,bottom:.36,hr:.36,half:.4,dens:.7,space:.85,tip:'Round, orange, rollable.',
    mesh(s,mm){const g=new THREE.Group(),m=ico(g,.42*s,mm,0,0,0,1);m.scale.set(1,.8,1);box(g,.06*s,.14*s,.06*s,mats.leaf2,0,.38*s,0);return g;},
    body(s){const b=nb(1.5*s*s*s);b.addShape(new CANNON.Sphere(.36*s));return b;}});
  def('hay',{cat:'Nature',name:'Hay bale',col:'#e3c169',scal:true,bottom:.45,hr:.45,half:.5,dens:.3,space:1.05,align:true,tip:'Rolls along its side.',
    mesh(s,mm){const g=new THREE.Group(),m=cyl(g,.45*s,1*s,mm,0,0,0,10);m.rotation.z=Math.PI/2;for(const x of[-.2,.2]){const r=cyl(g,.46*s,.05*s,mats.woodDark,x*s,0,0,10);r.rotation.z=Math.PI/2;}return g;},
    body(s){const b=nb(1.6*s*s*s);b.addShape(new CANNON.Cylinder(.45*s,.45*s,1*s,10),V(0,0,0),qSide);return b;}});
  function henMesh(s,mm){const g=new THREE.Group(),inner=new THREE.Group();inner.scale.setScalar(1.5*s);inner.position.y=-.26*s;g.add(inner);
    box(inner,.22,.18,.28,mm,0,.17,0);box(inner,.12,.15,.07,mm,0,.27,-.15);
    const head=new THREE.Group();head.position.set(0,.3,.12);inner.add(head);
    box(head,.12,.13,.12,mm,0,0,0);box(head,.04,.06,.09,mats.comb,0,.09,0);box(head,.05,.04,.06,mats.beak,0,-.01,.08);box(head,.03,.04,.02,mats.comb,0,-.06,.07);
    box(inner,.03,.09,.03,mats.beak,-.05,.045,0);box(inner,.03,.09,.03,mats.beak,.05,.045,0);g.userData.head=head;return g;}
  def('hen',{cat:'Nature',name:'Hen',col:'#f6f2e8',scal:true,bottom:.26,hr:.26,half:.25,dens:.4,space:.7,alive:true,tip:'Wanders about. Rights herself.',
    mesh:henMesh,body(s){return bx(nb(.7*s*s*s),.17*s,.26*s,.24*s);}});
  def('duck',{cat:'Nature',name:'Duck',col:'#8b7b66',scal:true,bottom:.17,hr:.17,half:.26,dens:.3,space:.7,alive:true,tip:'Heads for the nearest water tank.',
    mesh(s,mm){const g=new THREE.Group(),inner=new THREE.Group();inner.scale.setScalar(1.5*s);inner.position.y=-.17*s;g.add(inner);
      box(inner,.24,.13,.32,mm,0,.07,0);box(inner,.12,.12,.12,mats.duckHead,0,.2,.13);box(inner,.07,.03,.09,mats.beak,0,.18,.23);box(inner,.1,.06,.07,mm,0,.13,-.18);
      g.userData.head=inner.children[1];return g;},
    body(s){return bx(nb(.6*s*s*s),.18*s,.17*s,.26*s);}});
  def('lamp',{cat:'Nature',name:'Lamp',col:'#3c3a3f',frozen:true,bottom:0,half:.15,space:1,tip:'Glows at night.',
    mesh(s,mm){const g=new THREE.Group();box(g,.08,1.4,.08,mm,0,.7,0);box(g,.24,.24,.24,mats.lampHead,0,1.5,0);box(g,.3,.05,.3,mm,0,1.64,0);box(g,.26,.04,.26,mm,0,.02,0);return g;},
    body(){const b=nb(2);bx(b,.05,.75,.05,0,.75,0);bx(b,.12,.12,.12,0,1.5,0);return b;}});

  def('spring',{cat:'Machines',name:'Spring pad',col:'#e05a8a',frozen:true,bottom:0,half:.5,space:1.05,tip:'Launches anything that lands on it.',
    mesh(s,mm){const g=new THREE.Group();box(g,1,.08,1,mats.post,0,.04,0);for(let k=0;k<3;k++)box(g,.5-k*.05,.04,.5-k*.05,mats.metal,0,.1+k*.04,0);
      const pad=new THREE.Group();pad.position.y=.2;g.add(pad);box(pad,.92,.1,.92,mm,0,0,0);g.userData.pad=pad;return g;},
    body(){return bx(nb(3),.5,.13,.5,0,.13,0);}});
  def('fan',{cat:'Machines',name:'Fan',col:'#4f9fd8',frozen:true,bottom:0,half:.4,space:1,tip:'Blows things away. Light things fly.',
    mesh(s,mm){const g=new THREE.Group();box(g,.5,.12,.5,mats.post,0,.06,0);box(g,.1,.5,.1,mats.post,0,.35,0);
      box(g,.9,.12,.24,mm,0,1.3,0);box(g,.9,.12,.24,mm,0,.4,0);box(g,.12,.9,.24,mm,-.39,.85,0);box(g,.12,.9,.24,mm,.39,.85,0);
      const bl=new THREE.Group();bl.position.set(0,.85,.06);g.add(bl);box(bl,.1,.1,.1,mats.post,0,0,0);
      for(let k=0;k<4;k++){const b=new THREE.Group();b.rotation.z=k*Math.PI/2;bl.add(b);box(b,.12,.32,.03,mats.paper,0,.18,0);}g.userData.blades=bl;return g;},
    body(){const b=nb(4);bx(b,.25,.06,.25,0,.06,0);bx(b,.05,.25,.05,0,.35,0);bx(b,.45,.45,.12,0,.85,0);return b;}});
  def('cannon',{cat:'Machines',name:'Cannon',col:'#6b4430',frozen:true,bottom:0,half:.5,space:1.2,tip:'Fires a cannonball every few seconds.',
    mesh(s,mm){const g=new THREE.Group();box(g,.8,.3,.9,mm,0,.25,0);for(const x of[-.44,.44]){const w=cyl(g,.26,.08,mats.woodDark,x,.26,-.15,10);w.rotation.z=Math.PI/2;}
      const piv=new THREE.Group();piv.position.set(0,.55,0);piv.rotation.x=-.26;g.add(piv);const br=new THREE.Group();piv.add(br);
      const b=cyl(br,.17,1.1,mats.dark,0,0,.3,10);b.rotation.x=Math.PI/2;const lip=cyl(br,.21,.1,mats.dark,0,0,.85,10);lip.rotation.x=Math.PI/2;g.userData.barrel=br;return g;},
    body(){const b=nb(8);bx(b,.4,.2,.45,0,.25,0);bx(b,.17,.17,.5,0,.65,.3);return b;}});
  const beltC=document.createElement('canvas');beltC.width=8;beltC.height=2;{const bc=beltC.getContext('2d');bc.fillStyle='#2f3036';bc.fillRect(0,0,8,2);bc.fillStyle='#55565e';bc.fillRect(0,0,3,2);}
  const beltTex=new THREE.CanvasTexture(beltC);beltTex.magFilter=beltTex.minFilter=THREE.NearestFilter;beltTex.generateMipmaps=false;beltTex.wrapS=THREE.RepeatWrapping;beltTex.repeat.set(6,1);
  const beltMat=M('#ffffff',{map:beltTex});
  def('conveyor',{cat:'Machines',name:'Conveyor',col:'#f2c14e',frozen:true,bottom:0,half:.5,space:3,align:true,tip:'Carries things along. Turn with R.',
    mesh(s,mm){const g=new THREE.Group();box(g,3,.06,.9,beltMat,0,.24,0);for(const z of[-.48,.48])box(g,3.04,.14,.06,mm,0,.24,z);
      for(const x of[-1.3,1.3])for(const z of[-.4,.4])box(g,.08,.2,.08,mats.post,x,.1,z);
      for(const x of[1.2,1.32])box(g,.06,.02,.3,mats.paper,x,.28,0);return g;},
    body(){return bx(nb(4),1.5,.13,.5,0,.14,0);}});
  def('spawner',{cat:'Machines',name:'Spawner',col:'#9b6ad6',frozen:true,bottom:0,half:.6,space:1.5,tip:'Drops a random object every second or so.',
    mesh(s,mm){const g=new THREE.Group();box(g,.6,.1,.6,mats.post,-.7,.05,0);box(g,.12,3.6,.12,mats.post,-.7,1.8,0);box(g,.7,.08,.08,mats.post,-.35,3.6,0);
      box(g,.9,.6,.9,mm,0,3.7,0);box(g,.5,.25,.5,mats.post,0,3.3,0);box(g,.6,.06,.6,mats.paper,0,4.02,0);return g;},
    body(){const b=nb(4);bx(b,.3,.05,.3,-.7,.05,0);bx(b,.06,1.8,.06,-.7,1.8,0);bx(b,.45,.3,.45,0,3.7,0);return b;}});
  def('seesaw',{cat:'Machines',name:'Seesaw',col:'#d6a86c',bottom:.35,half:.3,space:3.2,align:true,tip:'Drop something heavy on one end.',
    mesh(s,mm){const g=new THREE.Group();box(g,.3,.7,.6,mats.post,0,0,0);box(g,3,.12,.6,mm,0,.41,0);return g;},
    build(o,p,yaw,q){const base=bx(nb(1),.15,.35,.3);base.collisionFilterGroup=2;base.type=STAT;base.mass=0;base.updateMassProperties();
      const plank=bx(nb(3),1.5,.06,.3);plank.collisionFilterMask=0xffff&~2;
      const qq=new CANNON.Quaternion();if(q)qq.set(q[0],q[1],q[2],q[3]);else qq.setFromAxisAngle(V(0,1,0),yaw);
      base.position.set(p[0],p[1],p[2]);base.quaternion.copy(qq);plank.quaternion.copy(qq);
      const off=qq.vmult(V(0,.41,0));plank.position.set(p[0]+off.x,p[1]+off.y,p[2]+off.z);
      const bm=new THREE.Group();box(bm,.3,.7,.6,mats.post,0,0,0);const pm=new THREE.Group();box(pm,3,.12,.6,o.mm,0,0,0);box(pm,.2,.14,.62,mats.woodDark,1.35,0,0);box(pm,.2,.14,.62,mats.woodDark,-1.35,0,0);
      const h=new CANNON.HingeConstraint(base,plank,{pivotA:V(0,.41,0),axisA:V(0,0,1),pivotB:V(0,0,0),axisB:V(0,0,1)});
      return {parts:[{mesh:bm,body:base,lock:true},{mesh:pm,body:plank,mass:3}],cons:[h]};}});
  def('tornado',{cat:'Machines',name:'Tornado',col:'#c9c5bf',nobody:true,bottom:0,half:1,space:4,tip:'Wanders the island lifting everything.',
    mesh(s,mm){const g=new THREE.Group(),sp=new THREE.Group();g.add(sp);for(let k=0;k<44;k++){const t=k/44,r=.25+t*1.6,a=k*2.4;
      const c=box(sp,.2+t*.25,.14,.2+t*.25,mats.cloud,Math.cos(a)*r,t*6,Math.sin(a)*r);c.castShadow=false;}g.userData.spin=sp;return g;}});
  def('hole',{cat:'Machines',name:'Black hole',col:'#6a3bd1',nobody:true,bottom:2.6,half:1,space:4,tip:'Pulls everything in and eats it.',
    mesh(s,mm){const g=new THREE.Group();const c=ico(g,.45,mats.hole,0,0,0,1);c.castShadow=false;const r=new THREE.Group();g.add(r);
      for(let k=0;k<26;k++){const a=k/26*Math.PI*2,m=box(r,.16,.05,.16,k%3?mats.ring:mats.ring2,Math.cos(a)*.85,0,Math.sin(a)*.85);m.castShadow=false;}
      r.rotation.x=.35;g.userData.ring=r;g.userData.core=c;return g;}});
  def('tank',{cat:'Machines',name:'Water tank',col:'#9a6b45',frozen:true,bottom:0,half:1.5,space:3.2,tip:'Things float or sink by weight.',
    mesh(s,mm){const g=new THREE.Group();const w=box(g,2.9,1.0,2.9,mats.water,0,.5,0);w.castShadow=false;
      for(const z of[-1.5,1.5]){const gl=box(g,3.1,1.2,.1,mats.glass,0,.6,z);gl.castShadow=false;box(g,3.1,.08,.14,mm,0,1.2,z);}
      for(const x of[-1.5,1.5]){const gl=box(g,.1,1.2,3.1,mats.glass,x,.6,0);gl.castShadow=false;box(g,.14,.08,3.1,mm,x,1.2,0);}
      for(const x of[-1.5,1.5])for(const z of[-1.5,1.5])box(g,.14,1.24,.14,mm,x,.62,z);return g;},
    body(){const b=nb(20);for(const z of[-1.5,1.5])bx(b,1.55,.6,.05,0,.6,z);for(const x of[-1.5,1.5])bx(b,.05,.6,1.55,x,.6,0);return b;}});

  def('tnt',{cat:'Boom',name:'TNT',col:'#d9443a',scal:true,bottom:.35,hr:.35,half:.35,dens:.8,space:.75,tip:'Explodes when hit, poked or near a blast.',
    mesh(s,mm){const g=new THREE.Group();box(g,.7*s,.7*s,.7*s,mm,0,0,0);box(g,.72*s,.24*s,.72*s,mats.paper,0,0,0);
      for(const x of[-.18,0,.18])box(g,.08*s,.12*s,.73*s,mats.dark,x*s,0,0);box(g,.04*s,.18*s,.04*s,mats.dark,0,.43*s,0);return g;},
    body(s){return bx(nb(1.5*s*s*s),.35*s,.35*s,.35*s);}});
  def('rocket',{cat:'Boom',name:'Rocket',col:'#f4efe6',bottom:.55,hr:.55,half:.2,dens:.5,space:.8,tip:'Poke to launch. Explodes at the top.',
    mesh(s,mm){const g=new THREE.Group();cyl(g,.14,1.1,mm,0,0,0,8);const n=mesh(g,new THREE.ConeGeometry(.14,.32,8),mats.red,0,.71,0);
      for(let k=0;k<3;k++){const f=new THREE.Group();f.rotation.y=k*Math.PI*2/3;g.add(f);box(f,.03,.3,.22,mats.red,0,-.42,.18);}
      box(g,.29,.06,.29,mats.dark,0,.2,0);const fl=mesh(g,new THREE.ConeGeometry(.12,.5,6),mats.flame,0,-.8,0);fl.rotation.x=Math.PI;fl.visible=false;fl.castShadow=false;g.userData.flame=fl;return g;},
    body(){const b=nb(.8);b.addShape(new CANNON.Cylinder(.14,.14,1.1,8),V(0,0,0),qUp);return b;}});
  def('balloon',{cat:'Boom',name:'Balloon',col:'#e5534b',scal:true,bottom:.4,hr:.4,half:.4,dens:.05,space:.9,tip:'Floats off. Pops when poked.',
    mesh(s,mm){const g=new THREE.Group(),m=ico(g,.4*s,mm,0,0,0,1);m.scale.set(1,1.15,1);box(g,.08*s,.08*s,.08*s,mm,0,-.48*s,0);const st=box(g,.012,.8*s,.012,mats.paper,0,-.9*s,0);st.castShadow=false;return g;},
    body(s){const b=nb(.1*s*s*s,'def',.6);b.addShape(new CANNON.Sphere(.4*s));return b;}});

  def('pig',{cat:'Nature',name:'Pig',col:'#f2a0b0',bottom:.27,hr:.27,half:.3,dens:.6,space:.8,tip:'The target in campaign mode.',
    mesh(s,mm){const g=new THREE.Group();box(g,.5,.4,.6,mm,0,.02,0);box(g,.2,.14,.06,mats.snout,0,.0,.32);box(g,.04,.05,.02,mats.dark,-.05,0,.355);box(g,.04,.05,.02,mats.dark,.05,0,.355);
      box(g,.07,.07,.02,mats.dark,-.13,.12,.31);box(g,.07,.07,.02,mats.dark,.13,.12,.31);box(g,.11,.1,.07,mm,-.17,.26,.16);box(g,.11,.1,.07,mm,.17,.26,.16);
      for(const x of[-.16,.16])for(const z of[-.2,.2])box(g,.1,.1,.1,mats.snout,x,-.22,z);box(g,.05,.05,.1,mats.snout,0,.1,-.33);return g;},
    body(){return bx(nb(.6),.25,.27,.3);}});
  K.pig.mat='grip';{const pb=K.pig.body;K.pig.body=function(){const b=pb();b.material=MAT.grip;return b;};}
  const PAINTM=PAINT.map(c=>M(c));
  const ITEM_ORDER={Blocks:['crate','stone','steel','glass','plank','domino','pillar','brick','wall','ball','beach','ice','barrel','anvil','ramp'],
    Nature:['tree','rock','pumpkin','hay','hen','duck','pig','lamp'],Machines:['spring','fan','cannon','conveyor','spawner','seesaw','tank','tornado','hole'],Boom:['tnt','rocket','balloon']};
  const SPAWN_POOL=['crate','ball','beach','pumpkin','barrel','domino','hay','crate','ball','balloon'];

  /* ---------- objects ---------- */
  let clearing=false,objs=[],nextId=1,pickDirty=true,simT=0;
  const pending=[];
  function setFrozen(o,f){o.frozen=f;for(const p of o.parts){if(!p.body||p.lock)continue;const b=p.body;
      if(f){b.type=STAT;b.mass=0;}else{b.type=DYN;b.mass=p.mass;}b.updateMassProperties();b.velocity.set(0,0,0);b.angularVelocity.set(0,0,0);b.wakeUp();}
    tint(o);wakeAll();}
  function tint(o){const e=o.mm.emissive;if(o.hover){e.set('#ffffff');o.mm.emissiveIntensity=.22;}
    else if(o.frozen&&!K[o.k].frozen){e.set('#5b8fd6');o.mm.emissiveIntensity=.45;}else{o.mm.emissiveIntensity=0;}}
  function hook(o,b){b.obj=o;b.addEventListener('collide',e=>onCollide(o,b,e));}
  function addObj(k,opt){
    const kd=K[k];if(!kd)return null;opt=opt||{};
    if(objs.length>=MAX_OBJS){if(!opt.temp)toast('The island is full. Delete a few things first.');return null;}
    const s=kd.scal?(opt.s||1):1,p=opt.p||[0,kd.bottom,0],yaw=opt.yaw||0;
    const o={id:nextId++,k,s,col:opt.col||kd.col,frozen:opt.frozen!=null?opt.frozen:!!kd.frozen,temp:!!opt.temp,parts:[],cons:[],t:rnd(0,1),age:0,ai:{t:0,h:Math.random()*6.28,walk:false,tip:0},extra:opt.extra||{}};
    o.mm=M(o.col,kd.mm);
    if(kd.build){const r=kd.build(o,p,yaw,opt.q);o.parts=r.parts;o.cons=r.cons||[];o.parts.forEach(pt=>{scene.add(pt.mesh);world.addBody(pt.body);hook(o,pt.body);});o.cons.forEach(c=>world.addConstraint(c));}
    else{const m=kd.mesh(s,o.mm);scene.add(m);
      if(kd.nobody){o.pos=new THREE.Vector3(p[0],p[1],p[2]);o.yaw=yaw;o.target=o.pos.clone();m.position.copy(o.pos);m.rotation.y=yaw;o.parts.push({mesh:m,body:null});}
      else{const b=kd.body(s);b.position.set(p[0],p[1],p[2]);if(opt.q)b.quaternion.set(opt.q[0],opt.q[1],opt.q[2],opt.q[3]);else b.quaternion.setFromAxisAngle(V(0,1,0),yaw);
        if(opt.vel)b.velocity.set(opt.vel[0],opt.vel[1],opt.vel[2]);world.addBody(b);hook(o,b);o.parts.push({mesh:m,body:b,mass:b.mass});m.position.copy(b.position);m.quaternion.copy(b.quaternion);}}
    o.parts.forEach(pt=>{if(pt.mass==null&&pt.body)pt.mass=pt.body.mass;pt.mesh.traverse(n=>{n.userData.obj=o;});});
    if(o.frozen)setFrozen(o,true);
    if(k==='hole')o.size=opt.extra&&opt.extra.size||1;if(k==='pig')o.startY=p[1];
    if(k==='lamp')syncLamps();
    objs.push(o);pickDirty=true;
    if(o.temp){const temps=objs.filter(x=>x.temp);if(temps.length>MAX_TEMP)removeObj(temps[0],true);}
    return o;
  }
  function removeObj(o,fx){if(o.dead)return;o.dead=true;
    if(fx){const c=mainPos(o);burst(c.x,c.y,c.z,10,DUST,2.5,.12,.5,.4);}
    o.cons.forEach(c=>world.removeConstraint(c));
    o.parts.forEach(p=>{scene.remove(p.mesh);if(p.body)world.remove(p.body);});
    if(grab&&grab.o===o)releaseGrab();
    const i=objs.indexOf(o);if(i>=0)objs.splice(i,1);
    if(o.k==='lamp')syncLamps();
    pickDirty=true;wakeAll();if(o.k==='pig')onPigGone();}
  function wakeAll(){for(const b of world.bodies)if(b.type===DYN)b.wakeUp();}
  const mainPos=o=>o.parts[0].body?o.parts[0].body.position:o.pos;
  function syncLamps(){const ls=objs.filter(o=>o.k==='lamp'&&!o.dead);lampLights.forEach((l,k)=>{const o=ls[k];l.visible=!!o;if(o)l.userData.o=o;});}
  function clearAll(){clearing=true;try{[...objs].forEach(o=>removeObj(o));objs=[];}finally{clearing=false;}}

  /* ---------- sound ---------- */
  let ac=null,bus=null,lastThud=0,noiseBuf=null,voices=[];
  const clips={};
  function menuQuiet(){const m=$('menu');return mode==='menu'||!!(m&&!m.hidden);}
  function ensureBus(a){if(!bus){bus=a.createGain();bus.gain.value=1;bus.connect(a.destination);}return bus;}
  function hold(n){voices.push(n);n.addEventListener('ended',()=>{const i=voices.indexOf(n);if(i>=0)voices.splice(i,1);});return n;}
  function hush(keepBed){for(const k in clips){const c=clips[k];if(c&&c.q)c.q.length=0;}if(!keepBed){try{stopBed();}catch(e){}}
    const v=voices.splice(0);for(const n of v){try{n.stop();}catch(e){}}
    try{if(powerOsc){try{powerOsc.o.stop();}catch(e){}powerOsc=null;}}catch(e){}
    if(ac&&bus){try{bus.gain.cancelScheduledValues(ac.currentTime);bus.gain.setValueAtTime(0,ac.currentTime);}catch(e){}}}
  function actx(ui){if(!state.sound)return null;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();ensureBus(ac);if(ac.state==='suspended'){const r=ac.resume();if(r&&r.catch)r.catch(()=>{});}if(menuQuiet()&&!ui)return null;bus.gain.cancelScheduledValues(ac.currentTime);bus.gain.setValueAtTime(1,ac.currentTime);return ac;}catch(e){return null;}}
  function tone(f,d,type,vol,to,delay,ui){const a=actx(ui);if(!a)return;const t0=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t0);
    if(to)o.frequency.exponentialRampToValueAtTime(to,t0+d);g.gain.setValueAtTime(vol||.05,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(g);g.connect(bus);hold(o);o.start(t0);o.stop(t0+d+.02);}
  function noise(d,vol,freq,ui){const a=actx(ui);if(!a)return;if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate,a.sampleRate);const ch=noiseBuf.getChannelData(0);for(let k=0;k<ch.length;k++)ch[k]=Math.random()*2-1;}
    const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain(),t0=a.currentTime;s.buffer=noiseBuf;f.type='lowpass';f.frequency.setValueAtTime(freq||900,t0);f.frequency.exponentialRampToValueAtTime(80,t0+d);
    g.gain.setValueAtTime(vol,t0);g.gain.exponentialRampToValueAtTime(.0001,t0+d);s.connect(f);f.connect(g);g.connect(bus);hold(s);s.start(t0);s.stop(t0+d);}
  function playBuf(a,buf,vol,rate,ui){if(!state.sound||(!ui&&menuQuiet()))return;const s=a.createBufferSource(),g=a.createGain();s.buffer=buf;s.playbackRate.value=rate||1;g.gain.value=vol==null?.4:vol;s.connect(g);g.connect(bus||a.destination);hold(s);s.start();}
  function decodeClip(name,a){const c=clips[name];if(!c||c.buf||c.bad||c.decoding||!c.raw)return;c.decoding=true;
    a.decodeAudioData(c.raw.slice(0)).then(buf=>{c.buf=buf;c.raw=null;c.decoding=false;const q=c.q.splice(0);if(!state.sound||!ac)return;for(const p of q)playBuf(ac,buf,p.v,p.r,p.ui);}).catch(()=>{c.bad=true;c.decoding=false;c.q.length=0;});}
  function cue(name,vol,rate,ui){const c=clips[name];if(!c||c.bad)return false;const a=actx(!!ui);if(!a)return false;if(c.buf){playBuf(a,c.buf,vol,rate,ui);return true;}if(c.raw||c.decoding){c.q.push({v:vol,r:rate,ui:!!ui});decodeClip(name,a);return true;}return false;}
  function grunt(){const k=Math.floor(Math.random()*4);if(cue(k?'grunt'+k:'oink',.4,.9+Math.random()*.2))return;
    if(k===1){tone(280,.13,'triangle',.05,140);noise(.1,.03,420);tone(360,.07,'sawtooth',.028,200,.08);}
    else if(k===2){tone(780,.05,'square',.036,520);tone(540,.1,'sawtooth',.04,300,.05);}
    else if(k===3){tone(920,.04,'triangle',.03,700);tone(410,.14,'sawtooth',.046,160,.05);noise(.06,.016,1500);}
    else{tone(620,.09,'sawtooth',.05,420);tone(560,.13,'sawtooth',.05,320,.1);}}
  function loadSfx(){['place','pop','del','thud','boom','bang','oink','grunt1','grunt2','grunt3','win','boing','bok','quack','freeze','thaw','paint','whoosh','gulp','no','splash','shatter','poke','shoot','tick','tock','laugh','bleep','react','quake','slomo','downer','aim','charge','cancel','lose','ping','hover','swoosh'].forEach(name=>{clips[name]={buf:null,raw:null,bad:false,decoding:false,q:[]};
    fetch('/sfx/'+name+'.mp3').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();}).then(ab=>{const c=clips[name];if(!c||c.bad)return;c.raw=ab;if(ac)decodeClip(name,ac);}).catch(()=>{if(clips[name])clips[name].bad=true;});});}
  loadSfx();
  const sfx={
    place:()=>cue('place',.38)||tone(330,.07,'triangle',.06,520),
    pop:()=>cue('pop',.32)||tone(700,.06,'triangle',.06,400),
    del:()=>cue('del',.34)||tone(300,.08,'square',.035,120),
    thud(v){const n=performance.now(),hard=v>7.5,light=v<4.2;if(n-lastThud<(light?130:hard?65:90))return;lastThud=n;
      if(light){tone(rnd(200,320),.028,'triangle',.018+Math.min(.02,v*.004),110);noise(.02,.01,1800);return;}
      if(!cue('thud',Math.min(hard?1.6:.8,.2+v*.06),hard?.76+Math.random()*.08:1.04+Math.random()*.14)){if(hard){tone(rnd(50,78),.13,'sine',Math.min(.1,.018+v*.007),30);noise(.12,.055,520);}else{tone(rnd(100,160),.06,'triangle',Math.min(.055,v*.007),55);noise(.05,.026,1200);}}
      if(hard)tone(rnd(42,64),.18,'sine',.04,28);},
    boom(){if(!cue('boom',.48)){noise(.85,.4,1300);tone(70,.45,'sine',.2,28);}tone(44,.32,'sine',.045,26,.02);noise(.16,.04,420);},
    bang(){if(!cue('bang',.5)){noise(.3,.18,2400);tone(130,.16,'square',.045,55);}noise(.07,.035,3400);tone(96,.09,'sine',.03,48);},
    oink(){grunt();},
    win:()=>cue('win',.46)||[523,659,784,1047].forEach((f,i)=>tone(f,.18,'square',.05,null,i*.11)),
    boing:()=>cue('boing',.75)||tone(220,.22,'sine',.09,880),
    bok(){if(cue('bok',.36,.96+Math.random()*.08))return;tone(320,.06,'square',.04,230);tone(300,.06,'square',.04,210,.09);},
    quack(){if(cue('quack',.36,.96+Math.random()*.08))return;tone(520,.16,'sawtooth',.04,280);},
    freeze:()=>cue('freeze',.36)||(tone(1400,.08,'sine',.05,1800),tone(1800,.1,'sine',.04,2400,.06)),
    thaw:()=>cue('thaw',.34)||tone(500,.08,'triangle',.05,250),
    paint:()=>cue('paint',.85)||tone(600,.05,'sine',.05,900),
    whoosh:()=>cue('whoosh',.34)||noise(.6,.12,3000),
    gulp:()=>cue('gulp',.38)||tone(200,.18,'sine',.08,60),
    no:()=>cue('no',.85)||tone(140,.12,'square',.035,110),
    splash:()=>cue('splash',1.1)||noise(.25,.08,2500),
    shatter(){if(cue('shatter',.46))return;[1800,2400,3100,2100].forEach((f,k)=>tone(f*rnd(.9,1.1),.12,'triangle',.035,f*.7,k*.04));noise(.25,.1,6000);},
    poke:()=>cue('poke',.34)||tone(400,.05,'square',.04,200),
    shoot(pw){pw=pw||0;if(cue('shoot',4.5+pw*4,.9+pw*.18))return;noise(.12+pw*.15,.12+pw*.25,1200+pw*2800);tone(120+pw*80,.14,'sine',.12+pw*.1,50);tone(700+pw*600,.06,'square',.03,300,.01);if(pw>.85)tone(1320,.12,'triangle',.04,1760,.06);},
    tick:()=>cue('tick',.22,1.12)||tone(2400,.018,'square',.012),
    tock(sec){if(cue('tock',sec<=3?.4:.28,sec%2?1.08:.94))return;tone(sec%2?1250:950,.06,'square',.05);if(sec<=3)tone(1900,.05,'triangle',.04,null,.08);},
    laugh(){if(cue('laugh',.4,.96+Math.random()*.08))return;[0,1,2,3].forEach(k=>tone(k%2?520:680,.09,'sawtooth',.045,k%2?420:560,k*.11));},
    bleep:()=>cue('bleep',.3)||tone(1000,.32,'square',.05),
    react(){grunt();},
    ui(){if(cue('ping',.34,1,1))return;tone(860,.018,'sine',.02,520,0,1);},
    hover(){if(cue('hover',.2,.98+Math.random()*.06,1))return;tone(1280,.012,'sine',.012,1680,0,1);},
    swoosh(dir){if(cue('swoosh',.4,dir<0?.9:1.08,1))return;noise(.16,.03,2200,1);},
    panel(){tone(410,.045,'triangle',.026,760,0,1);tone(880,.04,'sine',.014,null,.032,1);},
    splat(){noise(.14,.065,650);tone(86,.16,'sine',.055,34);tone(220,.05,'triangle',.022,100);},
    quake:()=>cue('quake',.32)||noise(3.5,.12,300),
    slomo(){if(cue('slomo',.36))return;tone(420,.9,'sawtooth',.05,60);noise(1.1,.12,900);},
    downer(){if(cue('downer',.42))return;tone(180,.5,'sawtooth',.06,90);tone(140,.6,'sawtooth',.05,70,.15);noise(.8,.3,600);},
    aim:()=>cue('aim',.28)||tone(520,.05,'triangle',.05,700),
    charge:()=>cue('charge',.3)||tone(660,.06,'triangle',.05,990),
    cancel:()=>cue('cancel',.26)||tone(300,.08,'triangle',.04,180),
    lose:()=>cue('lose',.42)||tone(140,.12,'square',.035,110)
  };
  let bed=null;
  const tunes={play:{raw:null,buf:null,decoding:false},tension:{raw:null,buf:null,decoding:false},hit:{raw:null,buf:null,decoding:false}};
  function loadTunes(){['play','tension','hit'].forEach(name=>{fetch('/music/'+name+'.mp3?v=7').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer();}).then(ab=>{tunes[name].raw=ab;if(ac)decodeTune(name);}).catch(()=>{});});}
  function decodeTune(name){const t=tunes[name];if(!ac||!t.raw||t.buf||t.decoding)return;t.decoding=true;
    ac.decodeAudioData(t.raw.slice(0)).then(buf=>{t.buf=buf;t.raw=null;t.decoding=false;if(bed){if(name==='hit'){if(bed.dramatic)punch();}else armLoop(name);}}).catch(()=>{t.decoding=false;});}
  loadTunes();
  function stopBed(){if(!bed)return;const b=bed;bed=null;try{const t=b.a.currentTime;['playSrc','tensionSrc','hitSrc'].forEach(k=>{if(b[k]){try{b[k].stop(t);}catch(e){}}});b.master.gain.cancelScheduledValues(t);b.master.gain.setValueAtTime(0,t);b.master.disconnect();}catch(e){}}
  function bedOn(){if(!state.sound)return false;if(menuQuiet())return true;if(drama)return true;if(mode==='creative')return !document.body.classList.contains('chromeless');return mode==='campaign';}
  function bedDuck(){if(state.paused||!$('modal').hidden||!$('coach').hidden)return .4;return 1;}
  function bedDramatic(){return document.body.classList.contains('cinema')||document.body.classList.contains('slomo')||!!(drama&&drama.phase==='slow');}
  function ensureBed(){if(bed||!ac)return;try{const a=ac,master=a.createGain(),gPlay=a.createGain(),gTension=a.createGain(),gHit=a.createGain();
    master.gain.value=.5;gPlay.gain.value=1;gTension.gain.value=0;gHit.gain.value=0;
    gPlay.connect(master);gTension.connect(master);gHit.connect(master);master.connect(a.destination);
    bed={a,master,gPlay,gTension,gHit,playSrc:null,tensionSrc:null,hitSrc:null,dramatic:false,mix:0,quiet:0,dying:false};
    armLoop('play');armLoop('tension');}catch(e){bed=null;}}
  function armLoop(name){if(!bed||name==='hit')return;const buf=tunes[name].buf;if(!buf){decodeTune(name);return;}const key=name==='play'?'playSrc':'tensionSrc';if(bed[key])return;
    const s=bed.a.createBufferSource();s.buffer=buf;s.loop=true;s.connect(name==='play'?bed.gPlay:bed.gTension);s.start();bed[key]=s;}
  function restartLoop(name){if(!bed)return;const buf=tunes[name].buf;if(!buf)return;const key=name==='play'?'playSrc':'tensionSrc';const now=bed.a.currentTime;
    if(bed[key]){try{bed[key].stop(now);}catch(e){}}
    const s=bed.a.createBufferSource();s.buffer=buf;s.loop=true;s.connect(name==='play'?bed.gPlay:bed.gTension);s.start(now);bed[key]=s;}
  function punch(){const buf=tunes.hit.buf;if(!bed||!buf)return;const now=bed.a.currentTime;if(bed.hitSrc){try{bed.hitSrc.stop(now);}catch(e){}}
    const s=bed.a.createBufferSource();s.buffer=buf;s.connect(bed.gHit);s.start(now);bed.hitSrc=s;}
  function tickBed(dt){try{if(!state.sound){stopBed();return;}if(!bedOn()){if(bed&&!bed.dying){bed.dying=true;bed.master.gain.setValueAtTime(0,bed.a.currentTime);}if(bed){bed.quiet+=dt;if(bed.quiet>.2)stopBed();}return;}
    if(!ac||ac.state!=='running')return;if(!menuQuiet()&&bus&&bus.gain.value<0.5)bus.gain.value=1;
    decodeTune('play');decodeTune('tension');decodeTune('hit');if(!bed)ensureBed();if(!bed)return;if(bed.dying)bed.dying=false;bed.quiet=0;
    armLoop('play');armLoop('tension');
    const d=bedDramatic();
    if(d!==bed.dramatic){bed.dramatic=d;if(d){restartLoop('tension');punch();}}
    const step=dt/1.6;bed.mix=d?Math.min(1,bed.mix+step):Math.max(0,bed.mix-step);
    bed.gPlay.gain.value=1-bed.mix;bed.gTension.gain.value=bed.mix;bed.gHit.gain.value=d?1.2:1.2*bed.mix;
    if(!d&&bed.mix<=0&&bed.hitSrc){try{bed.hitSrc.stop(bed.a.currentTime);}catch(e){}bed.hitSrc=null;}
    bed.master.gain.value=(.5+.7*bed.mix)*bedDuck()*(quakeT>0?.45:1);}catch(e){}}
  function wakeAudio(){if(!state.sound)return;try{ac=ac||new (window.AudioContext||window.webkitAudioContext)();ensureBus(ac);if(ac.state==='suspended'){const r=ac.resume();if(r&&r.catch)r.catch(()=>{});}}catch(e){}}
  addEventListener('pointerdown',wakeAudio,true);
  addEventListener('keydown',wakeAudio,true);
  let hoverBtn=null,hoverAt=0;
  addEventListener('pointerover',e=>{
    const b=e.target.closest&&e.target.closest('button');
    if(!b||b===hoverBtn||b.disabled)return;
    hoverBtn=b;
    if(performance.now()-hoverAt<60)return;
    hoverAt=performance.now();
    sfx.hover();
  },true);
  addEventListener('pointerout',e=>{
    if(!hoverBtn)return;
    if(hoverBtn.contains(e.relatedTarget))return;
    hoverBtn=null;
  },true);

  /* ---------- collisions & explosions ---------- */
  function makeDormant(o){o.dormant=true;o.parts.forEach(pt=>{if(!pt.body)return;pt.body.type=STAT;pt.body.mass=0;pt.body.updateMassProperties();pt.body.velocity.set(0,0,0);pt.body.angularVelocity.set(0,0,0);});}
  function wakeDormant(o){if(!o.dormant||o.dead)return;o.dormant=false;o.parts.forEach(pt=>{if(!pt.body)return;pt.body.type=DYN;pt.body.mass=pt.mass;pt.body.updateMassProperties();pt.body.wakeUp();});}
  function shatter(o){if(o.dead)return;const c=mainPos(o);burst(c.x,c.y,c.z,30,['#e8f8ff','#bfe8f5','#ffffff','#9fd6ea'],4,.1,.8,.8);
    sfx.shatter();removeObj(o);}
  function onCollide(o,b,e){if(o.dead)return;const ob=e.body;
    if(K[o.k].glass&&ob.type===DYN){const rv=ob.velocity.norm();if(rv>3.2&&!o.cracking){o.cracking=true;pending.push(()=>shatter(o));}}
    if(o.dormant&&ob.type===DYN&&ob!==groundBody){const rv=ob.velocity.norm();if(rv>.6){pending.push(()=>{const c=mainPos(o);wakeDormant(o);objs.forEach(x=>{if(x.dormant){const q=mainPos(x);if(Math.hypot(q.x-c.x,q.y-c.y,q.z-c.z)<.75)wakeDormant(x);}});});}}
    const v=Math.hypot(b.velocity.x-ob.velocity.x,b.velocity.y-ob.velocity.y,b.velocity.z-ob.velocity.z);
    if(v>2.5)sfx.thud(v);
    if(o.k==='tnt'&&!o.fuse&&o.age>1&&v>1.5)light(o,.6);
    if(o.meteor&&v>4){o.meteor=false;pending.push(()=>{if(o.dead)return;const p=mainPos(o);blast(p.x,p.y,p.z,2.6,.6);});}
    if(o.k==='spring'&&ob.type===DYN&&ob.position.y>b.position.y+.15){pending.push(()=>{ob.velocity.y=Math.max(ob.velocity.y,13.5);ob.wakeUp();});o.squash=1;sfx.boing();}
    if(o.k==='hen'&&v>4&&Math.random()<.6)sfx.bok();
    if(o.k==='pig'&&ob!==groundBody&&o.age>.3&&v>1.2)o.disturbedAt=simT;
    if(o.k==='pig'&&ob===groundBody&&o.age>.3&&((o.startY||0)>.6||v>3))pending.push(()=>killPig(o));
  }
  function light(o,t){if(o.fuse)return;o.fuse=t;}
  function ignite(o){if(o.lit!=null)return;o.lit=2.6;sfx.whoosh();o.parts[0].body.wakeUp();o.parts[0].mesh.userData.flame.visible=true;}
  function pop(o){const p=mainPos(o);burst(p.x,p.y,p.z,14,[o.col,'#ffffff'],3,.1,.4,.3);sfx.pop();removeObj(o);}
  let shake=0;
  const shRay=new THREE.Raycaster();
  function shielded(x,y,z,tp,o,d){const from=new THREE.Vector3(x,y+.1,z),dir=new THREE.Vector3(tp.x-x,tp.y-y-.1,tp.z-z).normalize();shRay.set(from,dir);shRay.far=Math.max(0,d-.25);
    const hs=shRay.intersectObjects(picks(),true);for(const h of hs){const ho=h.object.userData.obj;if(!ho||ho===o||ho.dead)continue;if(ho.k==='steel'||(K[ho.k].glass))return .1;if(ho.k==='stone')return .45;}return 1;}
  function blast(x,y,z,R,P){
    burst(x,y,z,Math.round(46*P),FIRE,9*P,.26,.7,.3,true);burst(x,y,z,Math.round(24*P),SMOKE,4*P,.4,1.6,-.05,true);
    flash.position.set(x,y+1,z);flash.intensity=Math.max(flash.intensity,4*P);shake=Math.max(shake,.45*P);P>.8?sfx.boom():sfx.bang();
    for(const o of [...objs]){if(o.dead)continue;
      for(const pt of o.parts){const b=pt.body;if(!b)continue;const dx=b.position.x-x,dy=b.position.y-y,dz=b.position.z-z,d=Math.hypot(dx,dy,dz);if(d>R)continue;
        if(o.k==='tnt'&&!o.fuse){o.fuse=.1+Math.random()*.15;}
        if(o.k==='rocket')ignite(o);if(o.k==='balloon'){pending.push(()=>!o.dead&&pop(o));continue;}
        if(o.k==='hen')sfx.bok();
        if(o.frozen&&!K[o.k].frozen)setFrozen(o,false);
        if(K[o.k].glass){if(d<R)pending.push(()=>shatter(o));continue;}
        if(o.k==='pig'&&mode==='campaign')continue;
        if(o.dormant)wakeDormant(o);if(b.type!==DYN)continue;const sh=shielded(x,y,z,b.position,o,d),f=(1-d/R)*sh*(o.k==='pig'?.7:1),n=Math.max(d,.3),m=Math.min(b.mass,12);
        const imp=V(dx/n*f*16*P*m,(dy/n+.7)*f*16*P*m,dz/n*f*16*P*m);b.applyImpulse(imp,V(b.position.x+rnd(-.1,.1),b.position.y+rnd(-.1,.1),b.position.z));b.wakeUp();}}
  }
  function explode(o){if(o.dead)return;const p=mainPos(o),s=o.s||1;removeObj(o);blast(p.x,p.y,p.z,3.8*Math.sqrt(s),Math.min(1.4,s));}

  /* ---------- simulation step ---------- */
  const tmpV=V(0,0,0),UPV=V(0,1,0);
  function gmag(){const g=world.gravity;return Math.hypot(g.x,g.y,g.z);}
  let quakeT=0,windA=0;
  function simStep(h){
    simT+=h;windA+=h*.15;
    const tanks=[],fans=[],belts=[],holes=[],twisters=[];
    for(const o of objs){if(o.k==='tank')tanks.push(o);else if(o.k==='fan')fans.push(o);else if(o.k==='conveyor')belts.push(o);else if(o.k==='hole')holes.push(o);else if(o.k==='tornado')twisters.push(o);}
    const gm=gmag();
    for(const o of objs){o.age+=h;if(o.dead)continue;const kd=K[o.k];
      for(const pt of o.parts){const b=pt.body;if(!b||b.type!==DYN)continue;const p=b.position;
        // buoyancy
        let wet=0;for(const t of tanks){const tb=t.parts[0].body,l=tb.pointToLocalFrame(p);if(Math.abs(l.x)<1.45&&Math.abs(l.z)<1.45&&l.y<1.0+(kd.hr||.4)&&l.y>-.2){
          const hr=(kd.hr||.4)*(o.s||1);wet=clamp((1.0-(l.y-hr))/(2*hr),0,1);break;}}
        if(wet>0){const dens=kd.dens||1;b.applyForce(V(0,wet*b.mass/dens*Math.max(gm,2),0),p);const k=1-2.2*h*wet;b.velocity.x*=k;b.velocity.y*=k;b.velocity.z*=k;b.angularVelocity.scale(1-2*h*wet,b.angularVelocity);
          if(!o.wet&&Math.abs(b.velocity.y)>2){burst(p.x,p.y,p.z,12,SPLASH,3,.1,.5,1,true);sfx.splash();}}
        o.wet=wet>0;
        if(state.wind){const f=(kd.dens||1)<1?2.4:1.2;b.applyForce(V(Math.cos(windA)*f*Math.min(b.mass,3),0,Math.sin(windA)*f*Math.min(b.mass,3)),p);if(Math.random()<.02)b.wakeUp();}
        for(const fo of fans){const fb=fo.parts[0].body,dir=fb.quaternion.vmult(V(0,0,1)),org=fb.pointToWorldFrame(V(0,.85,.2));
          const rx=p.x-org.x,ry=p.y-org.y,rz=p.z-org.z,al=rx*dir.x+ry*dir.y+rz*dir.z;if(al<0||al>9)continue;
          const px=rx-dir.x*al,py=ry-dir.y*al,pz=rz-dir.z*al;if(al>7||Math.hypot(px,py,pz)>1+al*.12)continue;const fr=1-al/7,f=16*fr*fr*Math.min(1,.35/b.mass);b.applyForce(V(dir.x*f,dir.y*f+.8*fr,dir.z*f),p);b.wakeUp();}
        for(const bo of belts){const bb=bo.parts[0].body,l=bb.pointToLocalFrame(p);if(Math.abs(l.x)<1.6&&Math.abs(l.z)<.55&&l.y>.15&&l.y<1.3){
          const ax=bb.quaternion.vmult(V(1,0,0)),cur=b.velocity.x*ax.x+b.velocity.z*ax.z,dv=(3-cur)*.25;b.velocity.x+=ax.x*dv;b.velocity.z+=ax.z*dv;b.wakeUp();}}
        for(const ho of holes){const dx=ho.pos.x-p.x,dy=ho.pos.y-p.y,dz=ho.pos.z-p.z,d=Math.hypot(dx,dy,dz);if(d>12)continue;
          if(d<.55*ho.size+(kd.half||.3)*.5){pending.push(()=>{if(o.dead)return;burst(p.x,p.y,p.z,10,VOID,2,.12,.5,0);removeObj(o);ho.size=Math.min(2.6,ho.size+.025);if(Math.random()<.5)sfx.gulp();});break;}
          const f=Math.min(b.mass*45,b.mass*160*ho.size/Math.max(d*d,1));b.applyForce(V(dx/d*f,dy/d*f,dz/d*f),p);b.wakeUp();}
        for(const tw of twisters){const dx=p.x-tw.pos.x,dz=p.z-tw.pos.z,r=Math.hypot(dx,dz);if(r>3.6||p.y>10)continue;const rr=Math.max(r,.3),m=b.mass;
          b.applyForce(V((-dz/rr*16-dx/rr*7)*m,(14*(1-p.y/10)+2)*m,(dx/rr*16-dz/rr*7)*m),p);b.wakeUp();}
        if(o.k==='balloon'){b.applyForce(V(0,b.mass*Math.max(gm,3)*1.7,0),p);if(p.y>24)pending.push(()=>!o.dead&&pop(o));}
        if(o.k==='rocket'&&o.lit!=null){const up=b.quaternion.vmult(UPV);b.applyForce(V(up.x*30+rnd(-1,1),up.y*30,up.z*30+rnd(-1,1)),p);
          const tail=b.pointToWorldFrame(V(0,-.7,0));emit(tail.x,tail.y,tail.z,rnd(-.5,.5)-up.x*4,-up.y*4,rnd(-.5,.5)-up.z*4,pick(FIRE),.16,.35,0);
          if(Math.random()<.5)emit(tail.x,tail.y,tail.z,rnd(-.4,.4),rnd(-.4,.4),rnd(-.4,.4),pick(SMOKE),.22,1.2,-.05);}
        if(kd.alive)alive(o,b,h,tanks);
        if(quakeT>0&&p.y<2.5){b.velocity.x+=rnd(-1,1)*.9;b.velocity.z+=rnd(-1,1)*.9;if(Math.random()<.3)b.velocity.y+=rnd(0,1.2);b.wakeUp();}
        if(o.meteor){emit(p.x,p.y,p.z,rnd(-.5,.5),1,rnd(-.5,.5),pick(FIRE),.22,.4,0);}
        if(p.y<-22||p.y>60||Math.abs(p.x)>80||Math.abs(p.z)>80){pending.push(()=>{if(!o.dead){removeObj(o);if(!o.temp)state.voidCount++;}});}
      }
      // timers
      if(o.k==='pig'&&o.bx!=null&&o.age>.3){const b=o.parts[0].body;if(b&&(Math.hypot(b.position.x-o.bx,b.position.z-o.bz)>.16||b.quaternion.vmult(UPV).y<o.bup-.06))o.disturbedAt=o.disturbedAt&&simT-o.disturbedAt<.2?o.disturbedAt:simT;}
      if(o.k==='pig'&&o.age>.3&&(o.startY||0)>.6){const b=o.parts[0].body;if(b&&(b.position.y<o.startY-.8||(o.sx!=null&&Math.hypot(b.position.x-o.sx,b.position.z-o.sz)>1.0))&&b.velocity.norm()<1.5)pending.push(()=>killPig(o));}
      if(o.fuse!=null){o.fuse-=h;if(o.fuse<=0){pending.push(()=>explode(o));}}
      if(o.lit!=null){o.lit-=h;if(o.lit<=0)pending.push(()=>explode(o));}
      if(o.k==='cannon'&&o.frozen){if(o.shots==null)o.shots=mode==='campaign'?3:1e9;if(o.shots>0){o.t+=h;if(o.t>2.8){o.t=0;o.shots--;fireCannon(o);if(!o.shots){const c=mainPos(o);burst(c.x,c.y+.7,c.z,10,SMOKE,1,.2,1,-.05);}}}}
      if(o.k==='spawner'){o.t+=h;if(o.t>(o.extra.only?1.1:1.4)){o.t=0;const b=o.parts[0].body,d=b.pointToWorldFrame(V(0,2.95,0));
        const k=o.extra.only||(Math.random()<.04?'hen':pick(SPAWN_POOL));const n=addObj(k,{p:[d.x+rnd(-.05,.05),d.y,d.z+rnd(-.05,.05)],yaw:rnd(0,6.28),temp:true,s:k==='domino'?.7:1});
        if(n)burst(d.x,d.y,d.z,5,DUST,1,.08,.3,.3);}}
      if(o.k==='tornado'){const dx=o.target.x-o.pos.x,dz=o.target.z-o.pos.z,d=Math.hypot(dx,dz);if(d<.3)o.target.set(rnd(-9,9),0,rnd(-9,9));else{o.pos.x+=dx/d*1.3*h;o.pos.z+=dz/d*1.3*h;}
        if(Math.random()<.4)emit(o.pos.x+rnd(-1,1),.05,o.pos.z+rnd(-1,1),rnd(-1,1),rnd(1,3),rnd(-1,1),pick(DUST),.12,.8,.2);}
    }
    if(quakeT>0)quakeT-=h;
    world.step(h);
    while(pending.length)pending.shift()();
  }
  function fireCannon(o){const b=o.parts[0].body,m=b.pointToWorldFrame(V(0,.78,.95)),d=b.quaternion.vmult(V(0,.26,.97));
    addObj('cball',{p:[m.x,m.y,m.z],vel:[d.x*17,d.y*17,d.z*17],temp:true});
    burst(m.x,m.y,m.z,12,SMOKE,2,.2,.8,-.05);burst(m.x,m.y,m.z,8,FIRE,3,.12,.25,0);sfx.bang();o.recoil=1;}
  function alive(o,b,h,tanks){
    const ai=o.ai,up=b.quaternion.vmult(UPV),p=b.position;ai.t-=h;
    if(o.frozen)return;
    if(up.y<.55){ai.tip+=h;if(ai.tip>2.2&&b.velocity.norm()<1){b.quaternion.setFromAxisAngle(UPV,ai.h);b.velocity.y=3;b.angularVelocity.set(0,0,0);ai.tip=0;}return;}
    ai.tip=0;const ground=Math.abs(b.velocity.y)<.5;
    if(ai.t<=0){ai.t=rnd(1.2,3.5);ai.walk=Math.random()<.7;ai.h=Math.random()*Math.PI*2;if(ground&&!o.wet&&Math.random()<.12)b.velocity.y=3.2;}
    if(Math.abs(p.x)>HALF-1.5||Math.abs(p.z)>HALF-1.5)ai.h=Math.atan2(-p.x,-p.z);
    if(o.k==='duck'&&tanks.length){
      if(!o.wet){let best=null,bd=1e9;for(const t of tanks){const tp=t.parts[0].body.position,d=Math.hypot(tp.x-p.x,tp.z-p.z);if(d<bd){bd=d;best=tp;}}
        if(best&&bd<14){ai.h=Math.atan2(best.x-p.x,best.z-p.z);ai.walk=true;if(bd<2.4&&ground&&Math.random()<.05){b.velocity.y=5.5;b.velocity.x=(best.x-p.x)*.8;b.velocity.z=(best.z-p.z)*.8;sfx.quack();}}}
      else{const tp=tanks[0].parts[0].body;const l=tp.pointToLocalFrame(p);if(Math.abs(l.x)>1||Math.abs(l.z)>1){const c=tp.position;ai.h=Math.atan2(c.x-p.x,c.z-p.z);}}}
    if(ai.walk&&(ground||o.wet)){const sp=o.wet?.6:1.1,tx=Math.sin(ai.h)*sp,tz=Math.cos(ai.h)*sp;b.velocity.x+=(tx-b.velocity.x)*.12;b.velocity.z+=(tz-b.velocity.z)*.12;b.wakeUp();}
    if(up.y>.85){const q=new CANNON.Quaternion();q.setFromAxisAngle(UPV,ai.h);const cq=b.quaternion;
      const t=new THREE.Quaternion(cq.x,cq.y,cq.z,cq.w).slerp(new THREE.Quaternion(q.x,q.y,q.z,q.w),.08);b.quaternion.set(t.x,t.y,t.z,t.w);b.angularVelocity.x*=.8;b.angularVelocity.z*=.8;}
  }

  /* ---------- camera ---------- */
  const EL0=Math.atan2(30,40),EL_MIN=.1,EL_MAX=1.25;let camEl=EL0,camT=state.camA!=null?state.camA:Math.PI/4,camAng=camT,camZoom=1,zoomT=1,lookY=-.5,lookYT=-.5;const pan=new THREE.Vector3(),panT=new THREE.Vector3();
  function sizeView(){const w=innerWidth,h=innerHeight;renderer.setPixelRatio(state.pixel===1?Math.min(2,devicePixelRatio):1/state.pixel);renderer.setSize(w,h,false);
    const asp=w/h,vh=Math.max(19,30/asp)*((HALF+3)/15)/camZoom;camera.left=-vh*asp/2;camera.right=vh*asp/2;camera.top=vh/2;camera.bottom=-vh/2;camera.updateProjectionMatrix();}
  addEventListener('resize',sizeView);

  /* ---------- UI ---------- */
  const $=id=>document.getElementById(id);
  let toastT=0;function toast(msg,ms){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),ms||1900);}
  const toolsEl=$('tools');
  CAMTOOLS.forEach(t=>{const b=document.createElement('button');b.className='tool';b.dataset.tool=t.id;b.title=t.name+' (hold '+t.key+')';
    b.innerHTML='<img alt="" src="'+ICON[t.id]+'"><span>'+t.name+'</span>';b.onclick=()=>setTool(t.id);toolsEl.appendChild(b);});
  {const d=document.createElement('span');d.className='tdiv';d.setAttribute('aria-hidden','true');toolsEl.appendChild(d);}
  TOOLS.forEach((t,k)=>{const b=document.createElement('button');b.className='tool';b.dataset.tool=t.id;b.title=t.name+' ('+(k+1)+')';
    b.innerHTML='<i>'+(k+1)+'</i><img alt="" src="'+ICON[t.id]+'"><span>'+t.name+'</span>';b.onclick=()=>setTool(t.id);toolsEl.appendChild(b);});
  const CAT_LABEL={Blocks:'Objects',Nature:'Nature',Machines:'Machines',Boom:'Boom'};
  CATS.forEach(c=>{const op=document.createElement('option');op.value=c;op.textContent=CAT_LABEL[c];$('tabs').appendChild(op);});
  $('tabs').onchange=e=>{const c=e.target.value;state.cat=c;if(K[state.kind].cat!==c)state.kind=ITEM_ORDER[c][0];renderItems();rebuildGhost();sfx.ui();$('tabs').blur();};
  const TH={w:104,h:84,ppu:26},thumbCache={};let thumbR=null,thumbScene=null,thumbCam=null;
  function thumb(k){const kd=K[k],sz=kd.scal?SIZES[state.size]:1,key=k+'|'+sz;if(thumbCache[key])return thumbCache[key];
    try{if(!thumbR){thumbR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});thumbR.setPixelRatio(2);thumbR.setSize(TH.w,TH.h,false);
        thumbScene=new THREE.Scene();thumbScene.add(new THREE.HemisphereLight('#eaf4ff','#5a5040',.95));const d=new THREE.DirectionalLight('#fff3dc',1.15);d.position.set(-5,10,6);thumbScene.add(d);
        thumbCam=new THREE.OrthographicCamera(-TH.w/2/TH.ppu,TH.w/2/TH.ppu,TH.h/2/TH.ppu,-TH.h/2/TH.ppu,.1,200);}
      const m=kd.mesh(sz,M(kd.col));thumbScene.add(m);m.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(m),c=bb.getCenter(new THREE.Vector3()),dm=bb.getSize(new THREE.Vector3());
      const a=Math.PI/4;thumbCam.position.set(c.x+Math.sin(a)*30,c.y+22.5,c.z+Math.cos(a)*30);thumbCam.lookAt(c);
      const pw=(dm.x+dm.z)*.72,ph=dm.y*.85+(dm.x+dm.z)*.36;thumbCam.zoom=Math.min(1,(TH.w/TH.ppu*.9)/pw,(TH.h/TH.ppu*.9)/ph);thumbCam.updateProjectionMatrix();
      thumbR.render(thumbScene,thumbCam);const url=thumbR.domElement.toDataURL();thumbScene.remove(m);return thumbCache[key]=url;}catch(e){return '';}}
  function partRow(k,count,isNew){const kd=K[k],b=document.createElement('button');const teach=!!(camp&&camp.L.teach===k&&count!=null&&count===camp.L.inv[k]);b.className='prow'+(state.kind===k?' sel':'')+(count===0?' empty':'')+(teach?' pulse':'');b.title=kd.tip||'';
    b.innerHTML='<span class="thumb"><img alt="" draggable="false" src="'+thumb(k)+'"></span><span class="pname">'+kd.name+(isNew?'<span class="pnew">NEW</span>':'')+'</span>'+(count!=null?'<span class="pcount">×'+count+'</span>':'<span></span>');
    b.onclick=()=>{if(trayDrag&&trayDrag.done)return;const changed=state.kind!==k;state.kind=k;renderItems();rebuildGhost();if(changed)sfx.ui();};
    b.addEventListener('pointerdown',e=>{if(e.button!==0)return;trayDrag={k,x:e.clientX,y:e.clientY,active:false};});return b;}
  let trayDrag=null;
  function overUI(x,y){const el=document.elementFromPoint(x,y);return !el||el!==canvas;}
  addEventListener('pointermove',e=>{if(!trayDrag)return;if(!trayDrag.active){if(Math.hypot(e.clientX-trayDrag.x,e.clientY-trayDrag.y)<7)return;trayDrag.active=true;
      const toolChanged=state.tool!=='place';if(toolChanged)setTool('place');if(state.kind!==trayDrag.k){state.kind=trayDrag.k;renderItems();rebuildGhost();if(!toolChanged)sfx.ui();}document.body.style.cursor='grabbing';}
    mouse.x=e.clientX;mouse.y=e.clientY;mouse.in=!overUI(e.clientX,e.clientY);updateHover();});
  addEventListener('pointerup',e=>{if(!trayDrag)return;const td=trayDrag;trayDrag=null;document.body.style.cursor='';if(!td.active)return;td.done=true;trayDrag=td;setTimeout(()=>{if(trayDrag===td)trayDrag=null;},0);
    if(overUI(e.clientX,e.clientY)){ghost.visible=false;return;}const hit=castAt(e.clientX,e.clientY);if(!hit)return;const o=hit.object.userData.obj;
        dragSet=new Set();dragLast=null;applyTool(hit,o,true);dragSet=null;updateHover();},true);
  function renderItems(){const it=$('items');it.innerHTML='';
    if(mode==='campaign'&&camp){const ks=Object.keys(camp.inv);if(!ks.includes(state.kind)){state.kind=ks[0];rebuildGhost();}
      ks.forEach(k=>it.appendChild(partRow(k,camp.inv[k],camp.L.isNew&&camp.L.isNew.includes(k))));return;}
    $('tabs').value=state.cat;
    ITEM_ORDER[state.cat].forEach(k=>it.appendChild(partRow(k,null,false)));
    [...$('sizeSeg').children].forEach(b=>b.classList.toggle('on',+b.dataset.v===state.size));$('sizeSeg').classList.toggle('dis',!K[state.kind].scal);
    const sel=it.querySelector('.sel');if(sel)sel.scrollIntoView({block:'nearest'});}
  $('sizeSeg').onclick=e=>{const v=e.target.dataset.v;if(v==null)return;state.size=+v;renderItems();rebuildGhost();sfx.ui();};
      function setTool(id){const changed=state.tool!==id;if(aim)cancelAim();if(id==='place'){placePulse(false);shotWatch=null;}try{if(!spin)spinRing.visible=false;}catch(_){}state.tool=id;[...toolsEl.children].forEach(b=>b.classList.toggle('sel',b.dataset.tool===id));canvas.style.cursor=id==='pan'?'grab':id==='rotate'?'ew-resize':'crosshair';$('sub').hidden=id!=='place';ghost.visible=false;setHover(null);if(changed)sfx.ui();syncPokeHint();}

  function seg(id,key,fn){const el=$(id);const sync=()=>[...el.children].forEach(b=>b.classList.toggle('on',String(state[key])===b.dataset.v));
    el.onclick=e=>{const v=e.target.dataset.v;if(v==null)return;const next=isNaN(+v)?v:+v;if(String(state[key])===String(next))return;state[key]=next;sync();fn&&fn();sfx.ui();};sync();return sync;}
  const GRAV={earth:[0,-9.82,0],moon:[0,-1.62,0],zero:[0,0,0],flip:[0,4.5,0]};
  function applyGrav(){world.gravity.set(...GRAV[state.grav]);wakeAll();}
  $('playBtn').onclick=togglePause;
  function togglePause(){if(mode==='campaign'&&camp&&!camp.running)return;state.paused=!state.paused;syncPlay();sfx.ui();}
  function syncPlay(){$('playBtn').firstChild.textContent=state.paused?'Play':'Pause';$('playBtn').classList.toggle('on',state.paused);}
  const windBtn=$('windBtn'),quakeBtn=$('quakeBtn'),meteorBtn=$('meteorBtn'),boomBtn=$('boomBtn');
  if(windBtn)windBtn.onclick=()=>{state.wind=!state.wind;windBtn.classList.toggle('on',state.wind);windBtn.querySelector('small').textContent=state.wind?'ON':'OFF';wakeAll();};
  if(quakeBtn)quakeBtn.onclick=()=>{quakeT=3.5;shake=Math.max(shake,.25);sfx.quake();wakeAll();};
  if(meteorBtn)meteorBtn.onclick=()=>{let n=0;const iv=setInterval(()=>{if(++n>16)return clearInterval(iv);const x=rnd(-10,10),z=rnd(-10,10);
    const o=addObj('rock',{p:[x+rnd(-6,6),26,z+rnd(-6,6)],vel:[rnd(-3,3),-14,rnd(-3,3)],temp:true,s:rnd(.6,1.2)});if(o)o.meteor=true;},180);};
  if(boomBtn)boomBtn.onclick=detonate;
  function detonate(){let n=0;objs.forEach(o=>{if(o.k==='tnt'){o.fuse=.1+n*.08;n++;}if(o.k==='rocket'){ignite(o);n++;}});if(!n)toast('No TNT or rockets on the island');}
  document.querySelectorAll('[data-scene]').forEach(b=>b.onclick=()=>{loadScene(b.dataset.scene);$('sim').classList.remove('open');$('menuBtn').classList.remove('on');sfx.panel();});
  $('soundBtn').onclick=()=>{state.sound=!state.sound;syncBtns();if(!state.sound)hush();else actx(true);};
  function syncBtns(){$('soundBtn').style.opacity=state.sound?1:.45;const w=$('windBtn');if(!w)return;w.classList.toggle('on',state.wind);const s=w.querySelector('small');if(s)s.textContent=state.wind?'ON':'OFF';}

  /* ---------- ghost & picking ---------- */
  const ghostMat=new THREE.MeshStandardMaterial({color:'#9be35a',emissive:'#3e6e14',emissiveIntensity:.7,transparent:true,opacity:.9,roughness:.55,flatShading:true});
  const ghostLine=new THREE.LineBasicMaterial({color:'#ffffff',transparent:true,opacity:.9});
  const ghostArrowMat=new THREE.MeshStandardMaterial({color:'#f2c14e',emissive:'#a8772a',emissiveIntensity:.5,roughness:.4});
  const FACE={domino:2,brick:2,plank:2,hay:2,seesaw:2,wall:2,ramp:1,conveyor:1,cannon:3,fan:3};
  function setGhostOk(ok){ghostMat.color.set(ok?'#9be35a':'#ff7a6a');ghostMat.emissive.set(ok?'#3e6e14':'#7a2a1e');ghostLine.color.set(ok?'#ffffff':'#ffd0c8');}
  let ghost=new THREE.Group();scene.add(ghost);
  function rebuildGhost(){scene.remove(ghost);const kd=K[state.kind],s=kd.scal?SIZES[state.size]:1;ghost=kd.mesh(s,ghostMat);const ms=[];ghost.traverse(n=>{if(n.isMesh)ms.push(n);});
    ms.forEach(n=>{n.material=ghostMat;n.castShadow=true;n.receiveShadow=false;const e=new THREE.LineSegments(new THREE.EdgesGeometry(n.geometry,30),ghostLine);n.add(e);});
    const f=FACE[state.kind];if(f){const a=new THREE.Group();a.position.y=-(kd.bottom||0)*s+.04;if(f===3)a.rotation.y=-Math.PI/2;ghost.add(a);
      const reach=(f===3?.7:(state.kind==='domino'?.45:(kd.half||.5)))*s+.25,len=f===2?.9:1.1;
      const mk=(sg)=>{const sh=new THREE.Mesh(boxG(len,.05,.12),ghostArrowMat);sh.position.x=sg*(reach+len/2);a.add(sh);
        const hd=new THREE.Mesh(new THREE.ConeGeometry(.17,.34,4),ghostArrowMat);hd.rotation.z=-sg*Math.PI/2;hd.rotation.x=Math.PI/4;hd.position.x=sg*(reach+len+.15);a.add(hd);};
      mk(1);if(f===2)mk(-1);}
    ghost.visible=false;scene.add(ghost);}
  let pickList=[];
  function picks(){if(pickDirty){pickList=[groundMesh];for(const o of objs)for(const p of o.parts)pickList.push(p.mesh);pickDirty=false;}return pickList;}
  const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
  function castAt(cx,cy,exclude){ndc.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);ray.setFromCamera(ndc,camera);
    const hits=ray.intersectObjects(picks(),true);for(const h of hits){const o=h.object.userData.obj;if(exclude&&o&&exclude.has(o))continue;if(!h.object.visible)continue;return h;}return null;}
  function placement(hit){const kd=K[state.kind],s=kd.scal?SIZES[state.size]:1,n=hit.face?hit.face.normal.clone().transformDirection(hit.object.matrixWorld):new THREE.Vector3(0,1,0),p=hit.point.clone();
    if(n.y>.6){if(state.snap&&hit.object===groundMesh){p.x=Math.round(p.x*4)/4;p.z=Math.round(p.z*4)/4;}
      const ho=hit.object.userData.obj,hb=ho&&ho.parts&&ho.parts[0].body;if(hb&&hit.object!==groundMesh&&Math.hypot(p.x-hb.position.x,p.z-hb.position.z)<.45){p.x=hb.position.x;p.z=hb.position.z;}
      p.y+=(kd.bottom||0)*s+.005;}
    else{p.addScaledVector(n,(kd.half||.45)*s+.02);p.y=Math.max(p.y,(kd.bottom||0)*s);}
    return {p,s};}
  let hoverObj=null;
  function setHover(o){if(hoverObj===o)return;if(hoverObj){hoverObj.hover=false;tint(hoverObj);}hoverObj=o;if(o){o.hover=true;tint(o);}}

  function doPlace(pl,yaw){const kd=K[state.kind];
    if(kd.many){const n=spawnMany(state.kind,pl.p,yaw,pl.s);sfx.place();burst(pl.p.x,pl.p.y,pl.p.z,8,DUST,1.6,.1,.4,.5);return n>0;}
    const o=addObj(state.kind,{p:[pl.p.x,pl.p.y,pl.p.z],yaw,s:pl.s,col:state.kind==='hen'&&Math.random()<.4?'#b87a4b':null});
    if(o){sfx.place();burst(pl.p.x,pl.p.y-(kd.bottom||0)*pl.s,pl.p.z,6,DUST,1.4,.09,.35,.5);if(state.kind==='duck')sfx.quack();if(state.kind==='hen')sfx.bok();}
    return o;}
  function spawnMany(k,p,yaw,s){const pts=K[k].layout(s),q=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),yaw);let n=0;
    for(const pt of pts){const v=new THREE.Vector3(...pt).applyQuaternion(q);if(addObj('brick',{p:[p.x+v.x,p.y+v.y,p.z+v.z],yaw,s,col:PAINT_PICK()}))n++;}return n;}
  const PAINT_PICK=()=>{const r=Math.random();return r<.7?'#b5523b':r<.85?'#a8483a':'#c4654c';};

  /* ---------- input ---------- */
  let dragFirst=null,mouse={x:0,y:0,in:false,touch:false},down=false,dragLast=null,dragSet=null,grab=null;
  function updateHover(){const tip=$('tip');if(spin){ghost.visible=false;return;}if(camMode()){ghost.visible=false;tip.classList.remove('show');setHover(null);return;}
    if(!mouse.in||grab){ghost.visible=false;tip.classList.remove('show');if(!grab)setHover(null);return;}
    const hit=castAt(mouse.x,mouse.y,dragSet);const o=hit&&hit.object.userData.obj;
    if(state.tool==='place'){const ho=hit&&hit.object.userData.obj;
      if(canRotate(ho)&&!keys.shift&&!topHit(hit)){ghost.visible=false;setHover(ho);ringAt(ho,.45);canvas.style.cursor=ROT_CURSOR;tip.classList.remove('show');return;}
      ringAt(null);canvas.style.cursor='crosshair';setHover(null);if(!hit){ghost.visible=false;tip.classList.remove('show');return;}const pl=placement(hit);ghost.visible=true;ghost.position.copy(pl.p);ghost.userData.base=pl.p.clone();ghost.rotation.set(0,state.rotY,0);
      setGhostOk(objs.length<MAX_OBJS&&(mode!=='campaign'||(inZone(pl.p)&&camp&&camp.inv[state.kind]>0)));tip.classList.remove('show');return;}
    setHover(o||null);ghost.visible=false;
    if(!o||mouse.touch){tip.classList.remove('show');canvas.style.cursor='crosshair';return;}
    const kd=K[o.k],act={grab:o.frozen?'drag to move':'drag to throw',poke:o.k==='tnt'?'detonate':o.k==='rocket'?'launch':o.k==='balloon'?'pop':'drag to aim',paint:'paint',freeze:o.frozen?'unfreeze':'freeze in place',del:'delete'}[state.tool];
    tip.innerHTML=kd.name+(o.frozen&&!kd.frozen?' · frozen':'')+' · <em>'+act+'</em>';tip.style.left=(mouse.x+16)+'px';tip.style.top=(mouse.y+14)+'px';tip.classList.add('show');canvas.style.cursor='pointer';}
  const plane=new THREE.Plane(),pv=new THREE.Vector3();
  function planePoint(cx,cy,y){ndc.set(cx/innerWidth*2-1,-(cy/innerHeight)*2+1);ray.setFromCamera(ndc,camera);plane.set(new THREE.Vector3(0,1,0),-y);return ray.ray.intersectPlane(plane,pv)?pv.clone():null;}
  function startGrab(hit,o){const pt=o.parts.find(p=>{let ok=false;p.mesh.traverse(n=>{if(n===hit.object)ok=true;});return ok;})||o.parts[0];
    if(pt.body&&pt.body.type===DYN){const b=pt.body,jb=new CANNON.Body({mass:0});jb.collisionFilterGroup=0;jb.collisionFilterMask=0;jb.position.set(hit.point.x,hit.point.y,hit.point.z);world.addBody(jb);
      const lp=b.pointToLocalFrame(V(hit.point.x,hit.point.y,hit.point.z));const c=new CANNON.PointToPointConstraint(b,lp,jb,V(0,0,0),Math.max(40,b.mass*60));world.addConstraint(c);b.wakeUp();
      grab={o,jb,c,y:Math.max(hit.point.y,0)+1.1,mode:'joint'};if(o.k==='hen')sfx.bok();if(o.k==='duck')sfx.quack();}
    else{const c=mainPos(o);grab={o,mode:'move',y:hit.point.y,off:new THREE.Vector3(c.x-hit.point.x,0,c.z-hit.point.z)};}
    updateHover();}
  function moveGrab(){if(!grab)return;const p=planePoint(mouse.x,mouse.y,grab.y);if(!p)return;
    if(grab.mode==='joint'){grab.jb.position.set(p.x,grab.y,p.z);}
    else{const o=grab.o,c=mainPos(o),dx=p.x+grab.off.x-c.x,dz=p.z+grab.off.z-c.z;
      if(o.pos){o.pos.x+=dx;o.pos.z+=dz;if(o.target)o.target.set(o.pos.x+rnd(-4,4),0,o.pos.z+rnd(-4,4));}
      else o.parts.forEach(pt=>{pt.body.position.x+=dx;pt.body.position.z+=dz;pt.body.velocity.set(0,0,0);pt.body.aabbNeedsUpdate=true;});wakeAll();}}
  function releaseGrab(){if(!grab)return;if(grab.mode==='joint'){world.removeConstraint(grab.c);world.remove(grab.jb);}grab=null;}
  const QUIPS={"ramp": ["Why would anyone want to poke a ramp?", "The ramp is unmoved. Emotionally and physically.", "Poking a ramp? That's a slippery slope.", "The ramp is on the up. You aren't.", "Ramp it up all you like, it won't move."], "spring": ["The spring is saving its bounce for something better.", "Spring has sprung. Not because of you, though.", "That spring is wound up enough already.", "Boing? No. Boing-not."], "fan": ["The fan is not a fan of being poked.", "You blow it. I mean, it blows. Not you.", "Poking a fan is a breezy waste of time.", "The fan finds this whole thing a bit draughty."], "cannon": ["Never poke a cannon. It has a short fuse.", "The cannon is rooted to the spot. Pun unintended.", "Cannon-not.", "That cannon is loaded with attitude, not pokes."], "conveyor": ["The conveyor keeps rolling with it. It won't budge, though.", "Poke a conveyor and it just moves on.", "The conveyor belt has a no-poke policy. It's on the belt."], "spawner": ["The spawner refuses to be prodded into action.", "Poking the spawner spawns nothing but disappointment."], "tank": ["A water tank. You poked it. Nothing. Water surprise.", "It's a tank. Tanks don't do pokes.", "You poked the tank. It's not shaken, or stirred.", "That tank is well within its limits. Tanks for asking."], "tree": ["You poke the tree. The tree pokes you back. Emotionally.", "Leaf it alone.", "The tree is rooted. Deeply. Branch out.", "Wood you stop that?", "This tree is unbe-leaf-ably stable.", "Poking a tree? You've barked up the wrong one."], "lamp": ["The lamp is not bright enough to fall for that.", "Lamp-poking is a dim idea.", "Watt are you doing?", "The lamp remains un-lit-erally moved."], "hole": ["You poke the void. The void pokes back.", "Don't poke the black hole. It's already in a bad space.", "The black hole absorbs your poke. And your dignity.", "Poking a black hole is a big no-no. Huge. Infinite, really."], "tornado": ["Poking a tornado? Bold. Very bold.", "The tornado twists away from your finger.", "You can't poke wind. Believe me, people have tried."], "seesaw": ["The seesaw saw you coming.", "Up, down, nope."], "pig": ["Poking the pig won't work. It just makes it smug.", "Hands off the bacon. Use your parts.", "The pig would like you to stop. Then keep trying.", "No poking the pork. House rules.", "That pig is snout of your reach.", "Prodding the pig? Swine-ly not."], "stone": ["That stone is set in stone.", "You can't poke a rock. It doesn't roll like that.", "Stone cold refusal.", "That stone weighs a ton of nope."], "crate": ["Not your crate, mate.", "That crate is crate-ly not yours.", "This crate has been crate-ed for the pig. Hands off."], "domino": ["Not your domino. Start your own chain.", "That domino is waiting for someone else's moment."], "brick": ["Another brick in someone else's wall.", "That brick is a solid no."], "pillar": ["That pillar is propping up the pig's ego.", "Pillar of the community. Don't touch."], "plank": ["Walk the plank? Not this one.", "That plank is board of your poking."], "wall": ["Talk to the wall. Don't poke it."]};
  const GEN_SCENERY=['That’s part of the scenery. Hands to yourself.','Not yours to poke. Use your own parts.'],GEN_FIXED=['It’s fixed in place. Poking it achieves nothing but vibes.','That one isn’t budging.'];
  function quip(o,scenery){const list=QUIPS[o.k]||(scenery?GEN_SCENERY:GEN_FIXED);return list[Math.floor(Math.random()*list.length)];}
  function pokesLeft(){return mode==='campaign'&&camp?Math.max(0,camp.L.pokes-camp.pokesUsed):Infinity;}
  function pokeLeft(o){if(mode!=='campaign'||!camp)return true;if(camp.L.pokes===0){toast(['No pokes on this stage. Let the machines do the work.','Hands off! This one’s all physics.','Poking is banned here. The pigs filed a complaint.'][Math.floor(Math.random()*3)]);sfx.no();return false;}
    if(pokesLeft()<=0){toast(['Out of pokes! Use what’s already moving.','No pokes left. Think with your parts.','Your poking finger is tired.'][Math.floor(Math.random()*3)]);sfx.no();return false;}return true;}
  function usePoke(){if(mode==='campaign'&&camp){camp.pokesUsed++;hudKey='';syncPokeHint();}}
  function poke(hit,o){const kd=K[o.k];if(mode==='campaign'&&!o.mine){toast(quip(o,true));sfx.no();return;}
    if(['tnt','rocket','balloon'].includes(o.k)&&!pokeLeft(o))return;if(o.k==='tnt'){usePoke();light(o,.05);return;}if(o.k==='rocket'){usePoke();ignite(o);return;}if(o.k==='balloon'){usePoke();pop(o);return;}
    if(o.k==='hen')sfx.bok();if(o.k==='duck')sfx.quack();
    const pt=o.parts[o.parts.length-1];const b=pt.body;if(!b||b.type!==DYN){toast(quip(o,false));sfx.no();return;}
    if(o.k==='domino'){const ax=b.quaternion.vmult(V(1,0,0));let best=null,bd=.95;for(const x of objs){if(x===o||x.k!=='domino')continue;const q=x.parts[0].body.position,d=q.distanceTo(b.position);if(d<bd){bd=d;best=q;}}
      let sg=best?Math.sign((best.x-b.position.x)*ax.x+(best.z-b.position.z)*ax.z):Math.sign(ray.ray.direction.x*ax.x+ray.ray.direction.z*ax.z)||1;
      if(!pokeLeft(o))return;usePoke();const top=b.pointToWorldFrame(V(0,.4*o.s,0));b.applyImpulse(V(ax.x*sg*b.mass*2.6,0,ax.z*sg*b.mass*2.6),top);b.wakeUp();sfx.poke();return;}
    const rd=ray.ray.direction,hl=Math.hypot(rd.x,rd.z)||1,d={x:rd.x/hl,z:rd.z/hl},m=Math.min(b.mass,15),f=8*m;b.applyImpulse(V(d.x*f,m*1.6,d.z*f),V(hit.point.x,hit.point.y,hit.point.z));b.wakeUp();
    burst(hit.point.x,hit.point.y,hit.point.z,6,['#ffffff','#fff1a8'],2,.08,.25,0);sfx.poke();}
  function applyTool(hit,o,first){
    switch(state.tool){
      case 'place':{const pl=placement(hit);let yaw=state.rotY;
        if(!first&&dragLast){const dx=pl.p.x-dragLast.x,dz=pl.p.z-dragLast.z,dd=Math.hypot(dx,dz),sp=K[state.kind].space*pl.s;if(dd<sp)return;
          if(K[state.kind].align){yaw=Math.atan2(-dz,dx);state.rotY=yaw;if(dragFirst&&!dragFirst.dead&&dragFirst.parts[0].body&&!dragFirst.aligned){dragFirst.aligned=true;dragFirst.parts[0].body.quaternion.setFromAxisAngle(V(0,1,0),yaw);}}const n=sp/dd;pl.p.x=dragLast.x+dx*n;pl.p.z=dragLast.z+dz*n;}
        if(mode==='campaign'){if(!camp||camp.done)return;if(!inZone(pl.p)){if(first){toast('Place parts inside the green zone');sfx.no();}return;}
          if(!(camp.inv[state.kind]>0)){if(first){toast('No '+K[state.kind].name.toLowerCase()+' left');sfx.no();}return;}}
        const r=doPlace(pl,yaw);if(r){if(first)dragFirst=r.parts?r:null;if(mode==='campaign'&&r.parts){r.mine=true;camp.inv[state.kind]--;renderItems();}dragLast=pl.p.clone();if(r.parts)dragSet.add(r);if(K[state.kind].many)objs.slice(-30).forEach(x=>dragSet.add(x));}break;}
      case 'grab':if(first&&o)startGrab(hit,o);break;
      case 'poke':if(first&&o)poke(hit,o);break;
      case 'paint':if(o&&!dragSet.has(o)){dragSet.add(o);o.col=PAINT[state.paint];o.mm.color.set(o.col);sfx.paint();if(first)state.paint=(state.paint+1)%PAINT.length;}break;
      case 'freeze':if(first&&o&&K[o.k].fixed){toast(K[o.k].name+' doesn’t do unfrozen.');sfx.no();break;}if(first&&o){setFrozen(o,!o.frozen);o.frozen?sfx.freeze():sfx.thaw();const c=mainPos(o);burst(c.x,c.y,c.z,10,o.frozen?['#cfe8ff','#ffffff']:DUST,2,.09,.4,0);}break;
      case 'del':if(o&&!dragSet.has(o)){dragSet.add(o);if(mode==='campaign'){if(!o.mine){if(first){toast('You can only remove your own parts');sfx.no();}break;}camp.inv[o.k]=(camp.inv[o.k]||0)+1;renderItems();}removeObj(o,true);sfx.del();}break;
    }}
  let held=null,camDrag=null;
  const camMode=()=>held||(state.tool==='pan'||state.tool==='rotate'?state.tool:null);
  function setHeld(m){if(held===m)return;held=m;[...toolsEl.children].forEach(b=>b.classList.toggle('held',!!m&&b.dataset.tool===m));
    const cm=camMode();canvas.style.cursor=cm==='pan'?(camDrag?'grabbing':'grab'):cm==='rotate'?'ew-resize':'crosshair';if(cm){ghost.visible=false;setHover(null);$('tip').classList.remove('show');}else updateHover();}
  function dragCamera(x,y){const dx=x-camDrag.x,dy=y-camDrag.y;camDrag.x=x;camDrag.y=y;
    if(camDrag.mode==='pan'){const upp=(camera.right-camera.left)/innerWidth;const fw=new THREE.Vector3(-Math.sin(camAng),0,-Math.cos(camAng)),rt=new THREE.Vector3(Math.cos(camAng),0,-Math.sin(camAng));
      panT.addScaledVector(rt,-dx*upp).addScaledVector(fw,dy*upp/Math.max(.2,Math.sin(camEl)));panT.x=clamp(panT.x,-14,14);panT.z=clamp(panT.z,-14,14);pan.copy(panT);}
    else{camT-=dx*.008;camAng=camT;const ne=clamp(camEl+dy*.005,EL_MIN,EL_MAX);if((ne===EL_MIN||ne===EL_MAX)&&ne!==camEl)tone(220,.05,'triangle',.03);camEl=ne;}}
  /* ---------- aim & power (poke) ---------- */
  let aim=null,spin=null,lastTick=0,powerOsc=null;
  const spinRing=new THREE.Mesh(new THREE.TorusGeometry(1,.05,8,40),new THREE.MeshStandardMaterial({color:'#fff1c2',emissive:'#f2c14e',emissiveIntensity:.7,roughness:.4,transparent:true}));
  function startSpinUI(x,y,o){ghost.visible=false;ringAt(o,.8);const h=$('spinHud');h.style.left=x+'px';h.style.top=y+'px';h.hidden=false;canvas.style.cursor='none';
    try{const r=canvas.requestPointerLock&&canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(_){}}
  function endSpinUI(){$('spinHud').hidden=true;try{if(document.pointerLockElement)document.exitPointerLock();}catch(_){}canvas.style.cursor=ROT_CURSOR;}
  function topHit(h){if(!h||!h.face)return false;return h.face.normal.clone().transformDirection(h.object.matrixWorld).y>.6;}
  function canRotate(o){return !!o&&!o.dead&&o.k!=='seesaw'&&(mode!=='campaign'||o.mine);}
  function ringAt(o,alpha){if(!o){if(!spin)spinRing.visible=false;return;}const kd=K[o.k],sc=o.s||1,b=o.parts[0].body;
    if(b)spinRing.position.set(b.position.x,Math.max(.05,b.position.y-(kd.bottom||0)*sc+.06),b.position.z);else spinRing.position.set(o.pos.x,.06,o.pos.z);
    const r=Math.max(.45,(kd.half||.4)*sc+.2);spinRing.scale.set(r,r,1);spinRing.material.opacity=alpha;spinRing.visible=true;}
  const ROT_CURSOR='url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'28\' height=\'28\' viewBox=\'0 0 28 28\'><g fill=\'none\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><path d=\'M21 9.5A8.5 8.5 0 1 0 22.5 16\' stroke=\'#120e0c\' stroke-width=\'5\'/><path d=\'M21 4v6h-6\' stroke=\'#120e0c\' stroke-width=\'5\'/><path d=\'M21 9.5A8.5 8.5 0 1 0 22.5 16\' stroke=\'#f2c14e\' stroke-width=\'2.5\'/><path d=\'M21 4v6h-6\' stroke=\'#f2c14e\' stroke-width=\'2.5\'/></g></svg>')+'") 14 14, ew-resize';spinRing.rotation.x=Math.PI/2;spinRing.visible=false;scene.add(spinRing);
  const aimG=new THREE.Group();aimG.visible=false;scene.add(aimG);
  const SEG=14,aimSegs=[],cA=new THREE.Color(),cB=new THREE.Color();
  const segG=new THREE.CylinderGeometry(1,1,1,12);
  for(let k=0;k<SEG;k++){const m=new THREE.Mesh(segG,new THREE.MeshStandardMaterial({color:'#f2c14e',emissive:'#000000',roughness:.3,metalness:.15}));m.rotation.z=Math.PI/2;m.castShadow=true;aimG.add(m);aimSegs.push(m);}
  const headMat=new THREE.MeshStandardMaterial({color:'#ff7b4a',emissive:'#000000',roughness:.3,metalness:.15});
  const aimHead=new THREE.Mesh(new THREE.ConeGeometry(.24,.5,16),headMat);aimHead.rotation.z=-Math.PI/2;aimHead.castShadow=true;aimG.add(aimHead);
  const ringMat=new THREE.MeshStandardMaterial({color:'#fff1c2',emissive:'#f2c14e',emissiveIntensity:.6,roughness:.4});
  const aimRing=new THREE.Mesh(new THREE.TorusGeometry(1,.045,8,40),ringMat);aimRing.rotation.x=Math.PI/2;aimRing.castShadow=true;aimG.add(aimRing);
  const dotMat=new THREE.MeshStandardMaterial({color:'#ffffff',emissive:'#fff1c2',emissiveIntensity:.5,roughness:.3});
  const aimDots=[];for(let k=0;k<7;k++){const d=new THREE.Mesh(icoG(.07,1),dotMat);d.castShadow=true;aimG.add(d);aimDots.push(d);}
  const AIMABLE=o=>!['tnt','rocket','balloon'].includes(o.k);
  function startAim(o){const pt=o.parts[o.parts.length-1];if(!pt.body||pt.body.type!==DYN)return false;
    aim={o,b:pt.body,phase:'aim',fresh:true,dir:new THREE.Vector3(),len:0,t:0,power:0,ang:null};aimG.visible=false;$('tip').classList.remove('show');setHover(null);
    sfx.aim();return true;}
  function updateAimDir(){if(!aim)return;const p=aim.b.position,g=planePoint(mouse.x,mouse.y,p.y);if(!g)return;const dx=g.x-p.x,dz=g.z-p.z,l=Math.hypot(dx,dz);aim.len=l;
    if(l>.05){aim.dir.set(-dx/l,0,-dz/l);const a=Math.round(Math.atan2(-dz,-dx)/(Math.PI/24));if(l>.35&&a!==aim.ang){if(aim.ang!==null&&performance.now()-lastTick>28){lastTick=performance.now();tone(1500+(a%2)*200,.025,'square',.018);}aim.ang=a;}}}
  function powerHum(on){const a=on&&actx();if(on&&a&&!powerOsc){const o=a.createOscillator(),g=a.createGain();o.type='triangle';o.frequency.value=180;g.gain.value=0;g.gain.setTargetAtTime(.035,a.currentTime,.05);o.connect(g);g.connect(bus);hold(o);o.start();powerOsc={o,g,a};}
    if(!on&&powerOsc){const {o,g,a}=powerOsc;g.gain.setTargetAtTime(0,a.currentTime,.03);o.stop(a.currentTime+.15);powerOsc=null;}}
  function cancelAim(silent){if(aim&&!silent)sfx.cancel();aim=null;aimG.visible=false;$('meter').hidden=true;powerHum(false);}
  const aimRay=new THREE.Raycaster(),DOWN=new THREE.Vector3(0,-1,0),UPY=new THREE.Vector3(0,1,0),aimPts=[];for(let k=0;k<=SEG;k++)aimPts.push(new THREE.Vector3());
  function surfaceY(x,z,top){aimRay.set(new THREE.Vector3(x,top,z),DOWN);aimRay.far=top+2;const hs=aimRay.intersectObjects(picks(),true);
    for(const h of hs){const o=h.object.userData.obj;if(o===aim.o||!h.object.visible||(o&&o.k==='pig'))continue;return h.point.y;}return 0;}
  function drawAim(){if(!aim)return;if(aim.o.dead){cancelAim(true);return;}const p=aim.b.position,pw=aim.phase==='power'?aim.power:0,show=aim.phase==='power'||aim.len>.35;aimG.visible=show;
    const kd=K[aim.o.k],sc=aim.o.s||1,r=Math.max(.32,(kd.half||.35)*sc)+.12,base=Math.max(0,p.y-(kd.hr||.3)*sc);
    aimRing.position.set(p.x,base+.12,p.z);const pulse=1+Math.sin(performance.now()/120)*.06;aimRing.scale.set(r*pulse,r*pulse,1);
    if(!show)return;
    const L=aim.phase==='power'?.9+pw*3.4:1.5,th=.06+pw*.05,dx=aim.dir.x,dz=aim.dir.z,top=p.y+3;
    let prevY=base,prevD=r;
    const FN=SEG*4,stp=L/FN,grav=aim.phase==='power'?.9/(.35+pw*2.2):.5;let air=false,vy=0,slope=0;
    for(let f=0;f<=FN;f++){const d=r+L*f/FN,x=p.x+dx*d,z=p.z+dz*d;const sy=surfaceY(x,z,f===0?top:prevY+.36);let y;
      if(f===0){y=Math.min(Math.max(sy,base-.3),base+.25);}
      else if(air){vy-=grav*stp;y=prevY+vy*stp;if(y<=sy){y=sy;air=false;slope=0;}}
      else{y=sy;if(y-prevY>.32)y=prevY;else if(prevY-y>.12||(prevY-y>.05&&slope>-.05)){air=true;vy=clamp(slope,-1,1.5);y=prevY+vy*stp;}
        else slope=f>0?(y-prevY)/stp:0;}
      prevY=y;prevD=d;if(f%4===0){const q=aimPts[f/4],ny=y+.14;q.set(x,aim.fresh?ny:q.y+(ny-q.y)*.35,z);}}aim.fresh=false;
    aim.slope=new THREE.Vector3().subVectors(aimPts[Math.min(3,SEG)],aimPts[0]).normalize();
    const hue0=aim.phase==='power'?.33:.17,hue1=aim.phase==='power'?.33-.36*pw:.12,v=new THREE.Vector3();
    aimSegs.forEach((m,k)=>{const a=aimPts[k],b=aimPts[k+1],t=k/(SEG-1);v.subVectors(b,a);const len=v.length();v.normalize();
      m.position.addVectors(a,b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(UPY,v);m.rotation.order='XYZ';m.scale.set(th*(1-t*.25),len*.96,th*(1-t*.25));
      cA.setHSL(hue0,.9,.62);cB.setHSL(Math.max(0,hue1),.95,.55);m.material.color.copy(cA).lerp(cB,t);m.material.emissive.copy(m.material.color).multiplyScalar(.35);});
    const end=aimPts[SEG];v.subVectors(end,aimPts[SEG-1]).normalize();
    aimHead.position.copy(end).addScaledVector(v,.22);aimHead.quaternion.setFromUnitVectors(UPY,v);aimHead.scale.setScalar(1+pw*.35);
    headMat.color.setHSL(Math.max(0,hue1),.95,.55);headMat.emissive.copy(headMat.color).multiplyScalar(.4);
    const hv=new THREE.Vector3(v.x,Math.max(v.y,0)+.25*pw,v.z).normalize();
    aimDots.forEach((d,k)=>{const t=.6+k*(.38+pw*.25);d.visible=aim.phase==='power';d.position.copy(end).addScaledVector(hv,t);d.position.y+=-.05*k*k*(1-pw*.6);d.scale.setScalar(1-k*.09);});
    if(aim.phase==='power'){const sp=new THREE.Vector3(p.x,p.y,p.z).project(camera),m=$('meter');m.hidden=false;
      m.style.left=((sp.x+1)/2*innerWidth+40)+'px';m.style.top=((1-sp.y)/2*innerHeight-96)+'px';$('meterFill').style.height=Math.round(pw*134)+'px';$('meterVal').textContent=Math.round(pw*100)+'%';
      if(powerOsc)powerOsc.o.frequency.setTargetAtTime(160+pw*620,powerOsc.a.currentTime,.02);}}
  function shoot(){usePoke();const o=aim.o,b=aim.b,pw=aim.power,m=Math.min(b.mass,15),f=m*(2+11*pw);
    const sl=aim.slope||{x:aim.dir.x,y:0,z:aim.dir.z},hz=Math.hypot(sl.x,sl.z)||1,up=Math.max(0,sl.y/hz);b.applyImpulse(V(aim.dir.x*f,m*(.3+1.4*pw)+f*Math.min(up,1.2),aim.dir.z*f),V(b.position.x,b.position.y+.05,b.position.z));b.wakeUp();
    burst(b.position.x,b.position.y,b.position.z,10+Math.round(pw*14),['#ffffff','#fff1a8','#f2c14e'],2+pw*4,.09,.35,0);
    powerHum(false);sfx.shoot(pw);shake=Math.max(shake,pw*.12);
    if(o.k==='hen')sfx.bok();if(o.k==='duck')sfx.quack();if(mode==='campaign')shotWatch={t:0,b};cancelAim(true);}
  let shotWatch=null;
  function placePulse(on){const el=toolsEl.querySelector('[data-tool=place]');if(el)el.classList.toggle('pulse',!!on);}
  function pokePulse(on){const el=toolsEl.querySelector('[data-tool=poke]');if(el)el.classList.toggle('pulse',!!on);}
  function hasPokeTarget(){const k=camp&&camp.L.pokeOf;return !!k&&objs.some(o=>!o.dead&&o.mine&&o.k===k);}
  function pokeHintOn(){if(mode!=='campaign'||!camp||!camp.running||camp.done||anyOverlay())return false;if(!camp.L.pokeOf||camp.L.pokes===0||pokesLeft()<=0||state.tool==='poke')return false;return hasPokeTarget();}
  function syncPokeHint(){pokePulse(pokeHintOn());if(mode==='campaign'&&camp&&hasPokeTarget())placePulse(false);}
  canvas.addEventListener('contextmenu',e=>{if(aim){e.preventDefault();cancelAim();}});
  addEventListener('keydown',e=>{if(aim&&e.key==='Escape'){cancelAim();toast('Shot cancelled');}});

  canvas.addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY;mouse.in=true;mouse.touch=e.pointerType==='touch';
    if(aim){if(aim.phase==='aim')updateAimDir();return;}
    if(spin){const lk=!!document.pointerLockElement,mx=lk?(e.movementX||0):e.clientX-spin.lx,my=lk?(e.movementY||0):e.clientY-spin.ly;spin.lx=e.clientX;spin.ly=e.clientY;spin.acc+=mx-my;const dx=spin.acc;if(!spin.moved&&Math.abs(dx)>(spin.stack?8:3)){spin.moved=true;if(spin.stack){spin.acc=0;startSpinUI(spin.x0,spin.y0,spin.o);}}if(spin.stack&&!spin.moved)return;ghost.visible=false;
      if(spin.moved){const raw=spin.yaw0-dx*.011,sn=Math.PI/12,o=spin.o,yaw=e.shiftKey?raw:Math.round(raw/sn)*sn,b=o.parts[0].body,kd=K[o.k],sc=o.s||1;
        if(b){b.quaternion.setFromAxisAngle(V(0,1,0),yaw);b.velocity.set(0,0,0);b.angularVelocity.set(0,0,0);b.aabbNeedsUpdate=true;b.wakeUp();spinRing.position.set(b.position.x,Math.max(.05,b.position.y-(kd.bottom||0)*sc+.06),b.position.z);}
        else{o.yaw=yaw;o.parts[0].mesh.rotation.y=yaw;spinRing.position.set(o.pos.x,.06,o.pos.z);}
        const r=Math.max(.45,(kd.half||.4)*sc+.2);spinRing.scale.set(r,r,1);spinRing.material.opacity=1;spinRing.visible=true;canvas.style.cursor=ROT_CURSOR;state.rotY=yaw;
        const st=Math.round(yaw/(Math.PI/12));if(st!==spin.step){if(spin.step!==null)tone(1300+(st%2)*200,.025,'square',.02);spin.step=st;}}
      return;}
    if(camDrag){dragCamera(e.clientX,e.clientY);return;}if(camMode())return;
    if(grab){moveGrab();return;}updateHover();
    if(down&&state.tool!=='grab'&&state.tool!=='poke'&&state.tool!=='freeze'){const hit=castAt(mouse.x,mouse.y,dragSet);if(hit)applyTool(hit,hit.object.userData.obj,false);}});
  canvas.addEventListener('pointerleave',()=>{mouse.in=false;updateHover();});
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;mouse.x=e.clientX;mouse.y=e.clientY;mouse.in=true;mouse.touch=e.pointerType==='touch';canvas.setPointerCapture(e.pointerId);
    if($('sim').classList.contains('open')){$('sim').classList.remove('open');$('menuBtn').classList.remove('on');sfx.panel();}
    const cm=camMode();if(cm){camDrag={x:e.clientX,y:e.clientY,mode:cm};if(cm==='pan')canvas.style.cursor='grabbing';return;}
    if(aim&&aim.phase==='power'){shoot();return;}
    if(state.tool==='place'){const h0=castAt(mouse.x,mouse.y),o0=h0&&h0.object.userData.obj;
      if(canRotate(o0)&&!e.shiftKey){const b=o0.parts[0].body,v=b?b.quaternion.vmult(V(1,0,0)):null;
        const st=topHit(h0);spin={o:o0,hit:h0,x0:e.clientX,y0:e.clientY,acc:0,lx:e.clientX,ly:e.clientY,yaw0:b?Math.atan2(-v.z,v.x):(o0.yaw||0),moved:false,step:null,stack:st};if(!st)startSpinUI(e.clientX,e.clientY,o0);return;}}
    down=true;dragSet=new Set();const hit=castAt(mouse.x,mouse.y);if(!hit)return;dragLast=null;
    if(state.tool==='poke'){const o=hit.object.userData.obj;if(!o)return;if(mode==='campaign'&&!o.mine){toast(quip(o,true));sfx.no();return;}if(!pokeLeft(o))return;
      if(AIMABLE(o)&&startAim(o)){aim.hit=hit;updateAimDir();return;}}
    applyTool(hit,hit.object.userData.obj,true);if(state.tool==='place'&&!dragLast)dragLast=placement(hit).p;});
  addEventListener('pointerup',()=>{if(spin){const sp=spin;spin=null;spinRing.visible=false;endSpinUI();
      if(sp.stack&&!sp.moved){canvas.style.cursor='crosshair';const h=castAt(mouse.x,mouse.y);if(h){dragSet=new Set();dragLast=null;applyTool(h,h.object.userData.obj,true);dragSet=null;}updateHover();return;}
      if(sp.moved)wakeAll();updateHover();return;}
    if(aim&&aim.phase==='aim'){if(aim.len<.35){const a=aim;cancelAim();if(a.o.k==='domino')poke(a.hit,a.o);else toast('Drag away from the part to aim, then let go');}
      else{aim.phase='power';aim.t=0;sfx.charge();powerHum(true);}down=false;return;}
    if(camDrag){camDrag=null;const cm=camMode();canvas.style.cursor=cm==='pan'?'grab':cm==='rotate'?'ew-resize':'crosshair';}down=false;dragSet=null;releaseGrab();updateHover();});
  canvas.addEventListener('wheel',e=>{e.preventDefault();if(state.tool==='place'&&e.shiftKey&&!camMode()){const d=e.deltaY||e.deltaX;state.rotY+=(d>0?1:-1)*Math.PI/12;tone(1200,.03,'square',.02);updateHover();return;}if(grab){grab.y=clamp(grab.y+(e.deltaY<0?.4:-.4),.2,14);moveGrab();return;}zoomT=clamp(zoomT*(e.deltaY<0?1.12:1/1.12),.6,3);},{passive:false});
  const keys={};
  const anyOverlay=()=>!$('cine').hidden||!$('coach').hidden||!$('menu').hidden||!$('levels').hidden||!$('modal').hidden;
  addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey||anyOverlay())return;const k=e.key.toLowerCase();keys[k]=true;if(k==='shift'&&!e.repeat){updateHover();return;}
    if(k===' '){e.preventDefault();if(!e.repeat)setHeld('pan');return;}if(k==='r'){if(!e.repeat)setHeld('rotate');return;}
    if(k>='1'&&k<='6'){const t=TOOLS[+k-1];if(!(mode==='campaign'&&['grab','paint','freeze'].includes(t.id)))setTool(t.id);}else if(k==='q')camT-=Math.PI/2;else if(k==='e')camT+=Math.PI/2;
    else if(k==='f'){state.rotY+=e.shiftKey?Math.PI/12:Math.PI/4;tone(1100,.04,'square',.025,1400);updateHover();}else if(k==='p')togglePause();else if(k==='t'&&boomBtn&&mode!=='campaign')detonate();
    else if((k==='delete'||k==='backspace')&&hoverObj){removeObj(hoverObj,true);sfx.del();}
    else if(k==='='||k==='+')zoomT=clamp(zoomT*1.25,.6,3);else if(k==='-')zoomT=clamp(zoomT/1.25,.6,3);});
  addEventListener('keyup',e=>{const k=e.key.toLowerCase();keys[k]=false;if(k==='shift')updateHover();if((k===' '&&held==='pan')||(k==='r'&&held==='rotate'))setHeld(null);});
  addEventListener('blur',()=>setHeld(null));

  /* ---------- scenes ---------- */
  const at=(k,x,z,o)=>{o=o||{};const kd=K[k],s=o.s||1;if(kd.many)return spawnMany(k,{x,y:o.y||0,z},o.yaw||0,s);return addObj(k,Object.assign({p:[x,o.y!=null?o.y:(kd.bottom||0)*s,z]},o));};
  const SCENES={
    playground(){
      [[-11,-11],[11,-11],[-11,11],[11,11],[-11,1],[1,-11],[11,3],[3,11],[-7,11],[11,-6]].forEach(([x,z])=>at('tree',x,z,{yaw:rnd(0,6)}));
      at('tank',6,6);at('duck',6,6,{y:1.3});at('duck',6.6,5.4,{y:1.3,col:'#f3efe6'});at('crate',5.4,6.6,{y:1.4});at('stone',6.8,6.8,{y:1.4});
      for(let k=0;k<12;k++)at('domino',-9+k*.5,-1);at('tnt',-2.9,-1);at('tnt',-2.9,-1,{y:1.06});at('wall',-1.6,-1,{yaw:Math.PI/2});
      for(let k=0;k<6;k++)at(k===5?'stone':'crate',2,-6,{y:.4+k*.81});at('pillar',3.3,-6);at('pillar',.7,-6);
      at('cannon',-7,-7.5,{yaw:Math.atan2(9,1.5)});
      at('fan',8.5,-1.5,{yaw:Math.PI});for(let k=0;k<3;k++)at('balloon',8.5+rnd(-.6,.6),-3-k*.9,{col:PAINT[k*2]});at('beach',8.5,-5.5);
      at('spring',3,3);at('ball',3,3,{y:4});
      at('seesaw',-5,5);at('crate',-6.2,5,{y:1.25});at('anvil',-3.8,5,{y:7});
      at('rocket',0,8);at('lamp',1.2,7.6);at('lamp',-4,-3);
      at('spawner',-9.6,7.5);at('conveyor',-8.2,7.5);
      at('hen',2,9);at('hen',4,8.6,{col:'#b87a4b'});at('hen',-1,3.5);
      at('ramp',8,9.5,{yaw:Math.PI});for(let k=0;k<3;k++)at('ball',7.2,9.1+k*.4,{y:1.25,col:PAINT[k+3]});
      at('hay',-8,2);at('pumpkin',-7,3);at('pumpkin',-6.5,2.2);
    },
    spiral(){let th=2.4;for(let n=0;n<170;n++){const r=.35*th,x=Math.cos(th)*r,z=Math.sin(th)*r;if(r>10.5)break;
        const tx=Math.cos(th)*.35-Math.sin(th)*r,tz=Math.sin(th)*.35+Math.cos(th)*r;at('domino',x,z,{yaw:Math.atan2(-tz,tx),col:PAINT[Math.floor(n/12)%PAINT.length]});th+=.52/Math.hypot(.35,r);}
      for(let k=0;k<3;k++)at('tnt',Math.cos(th+.2)*.35*(th+.2),Math.sin(th+.2)*.35*(th+.2),{y:.36+k*.71});
      toast('Poke the domino in the middle',3000);},
    castle(){const wl=(x,z,yaw)=>at('wall',x,z,{yaw});
      wl(0,-1.9,0);wl(0,1.9,0);wl(-1.9,0,Math.PI/2);wl(1.9,0,Math.PI/2);
      for(const x of[-2.1,2.1])for(const z of[-2.1,2.1]){at('pillar',x,z,{s:1});at('stone',x,z,{y:2.4,s:.6});}
      at('tnt',0,0);at('tnt',0,0,{y:1.06});at('hen',.5,.6);
      for(let k=0;k<4;k++)at('crate',6,-1+k*.82*0,{y:.4+k*.81});
      at('cannon',-8,-8,{yaw:Math.atan2(8,8)});at('cannon',8,-8,{yaw:Math.atan2(-8,8)});at('cannon',0,9,{yaw:Math.PI});
      [[-10,9],[10,9],[-10,-10],[10,-10]].forEach(([x,z])=>at('tree',x,z));},
    marbles(){const lv=[2.15,1.3,.45];lv.forEach((y,i)=>at('ramp',i%2?-.4:0,0,{y,yaw:i%2?Math.PI:0}));
      const sp=at('spawner',.95,0,{yaw:Math.PI/2});sp.extra.only='ball';
      for(let k=0;k<14;k++)at('domino',-1.8-k*.5,0,{col:PAINT[k%PAINT.length]});at('tnt',-9,0);at('tnt',-9,0,{y:1.06});
      at('tank',5,-5);at('duck',5,-5,{y:1.3});
      [[-10,9],[10,9],[-10,-10],[10,-10],[4,9]].forEach(([x,z])=>at('tree',x,z));},
    hole(){const ks=['crate','ball','pumpkin','hay','domino','barrel','stone','beach','crate'];
      const used=[];for(let k=0;k<400&&used.length<130;k++){const a=rnd(0,6.28),r=rnd(4,11),x=Math.cos(a)*r,z=Math.sin(a)*r;if(used.some(u=>Math.hypot(u[0]-x,u[1]-z)<1.15))continue;
        used.push([x,z]);at(pick(ks),x,z,{yaw:rnd(0,6.28),col:Math.random()<.3?pick(PAINT):null});}
      for(let k=0;k<3;k++)at('hen',rnd(-9,9),rnd(6,10));at('hole',0,0);},
    empty(){}
  };
  function loadScene(name){document.querySelectorAll('[data-scene]').forEach(b=>b.classList.toggle('on',b.dataset.scene===name));releaseGrab();clearAll();if(HALF!==12)buildIsland(12);setZone(null);if(mode==='campaign'){mode='creative';camp=null;applyMode();resetCamera();}state.paused=false;syncPlay();state.voidCount=0;quakeT=0;
    SCENES[name]();setTimeout(()=>{for(const o of objs)o.age=0;},0);toastIf(name);}
  function toastIf(n){if(n==='playground')toast('Poke the first domino, the rocket, or the TNT');if(n==='castle')toast('The cannons are already firing');if(n==='hole')toast('Grab the black hole and drag it around');}

  /* ---------- clock ---------- */
  let lastSec=-1;const CLK_C=2*Math.PI*42;
  $('clockArc').style.strokeDasharray=CLK_C;
  function clockTick(sec){if(sec<=10)sfx.tock(sec);else sfx.tick();}
  let clockKey='';
  function drawClock(){const el=$('clock'),show=mode==='campaign'&&!!camp&&!document.body.classList.contains('chromeless');el.hidden=!show;if(!show)return;
    const T=camp.L.time,t=Math.max(0,camp.t),f=t/T,sec=Math.ceil(t),key=sec+'|'+Math.round(f*400)+'|'+state.paused;if(key===clockKey)return;clockKey=key;
    const hue=f>.5?44:f>.2?28:4;const col='hsl('+hue+',90%,'+(f>.2?58:60)+'%)';
    $('clockArc').style.strokeDashoffset=(CLK_C*(1-f)).toFixed(2);$('clockArc').style.stroke=col;
    $('clockText').textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');$('clockText').style.color=sec<=10?'#ff8a6a':'var(--ink)';
    el.classList.toggle('low',sec<=10&&camp.running&&!camp.done);el.classList.toggle('paused',state.paused&&camp.running);}

  /* ---------- campaign ---------- */
  let prog={cleared:0,stars:{}};try{const pp=JSON.parse(localStorage.getItem(SAVE_KEY+'-progress')||'null');if(pp)prog=Object.assign(prog,pp);}catch(e){}
  const saveProg=()=>{try{localStorage.setItem(SAVE_KEY+'-progress',JSON.stringify(prog));}catch(e){}};
  const zoneG=new THREE.Group();scene.add(zoneG);const flagMat=M('#f2c14e');
  function setZone(z){zone=z;while(zoneG.children.length)zoneG.remove(zoneG.children[0]);if(!z)return;const w=z[2]-z[0],d=z[3]-z[1],cx=(z[0]+z[2])/2,cz=(z[1]+z[3])/2;
    const pl=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:'#d8f59a',transparent:true,opacity:.28,depthWrite:false}));pl.rotation.x=-Math.PI/2;pl.position.set(cx,.015,cz);zoneG.add(pl);
    const ed=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w,.02,d)),new THREE.LineBasicMaterial({color:'#f2c14e'}));ed.position.set(cx,.02,cz);zoneG.add(ed);
    for(const x of[z[0],z[2]])for(const zz of[z[1],z[3]]){box(zoneG,.07,.6,.07,mats.post,x,.3,zz);box(zoneG,.24,.15,.03,flagMat,x+.12,.5,zz);}}
  const inZone=p=>!zone||(p.x>=zone[0]-.01&&p.x<=zone[2]+.01&&p.z>=zone[1]-.01&&p.z<=zone[3]+.01);
  const D3=Math.PI*3/4,F5=Math.PI*5/4;
  const PI4=Math.PI/4;
  const tower=(x,z,n,sc)=>{sc=sc||.7;const hh=.8*sc;for(let k=0;k<n;k++)at('crate',x,z,{y:hh/2+k*(hh+.005),s:sc,yaw:PI4});at('pig',x,z,{y:n*(hh+.005)+.27,yaw:PI4});};
  const pedestal=(x,z,n)=>{n=n||1;for(let k=0;k<n;k++)at('stone',x,z,{y:.4+k*.81,yaw:PI4});at('pig',x,z,{y:n*.81+.27,yaw:PI4});};
  const trees=pts=>pts.forEach(([x,z])=>at('tree',x,z));
  const castle=(c,d)=>{at('wall',c,c-d,{yaw:0});at('wall',c,c+d,{yaw:0});at('wall',c-d,c,{yaw:Math.PI/2});at('wall',c+d,c,{yaw:Math.PI/2});};
  const LEVELS=[
    {name:'First push',pokes:3,par:1,h:6,time:60,zone:[1.5,1.5,4.5,4.5],inv:{ball:3,crate:2},pokeOf:'ball',goal:'Knock the pig off its tower',
      hint:'Place a ball, then Poke it: drag to aim, let go, click to shoot.',
      build(){tower(-2.5,-2.5,4);trees([[-4.6,3.8],[3.8,-4.6]]);}},
    {name:'Domino effect',pokes:2,par:8,h:7,time:90,zone:[1,-5,5,-1],inv:{domino:16,ball:1},pokeOf:'domino',goal:'Knock the pig off its table',
      hint:'Drag dominos up to the white line, then tap your first one with Poke.',
      build(){for(let k=0;k<11;k++){const c=.7-k*.3536;at('domino',c,-c,{yaw:-D3});}for(const k of[11,14]){const c=.7-k*.3536;at('domino',c,-c,{yaw:-D3});}{const c=.7-12.5*.3536;at('plank',c,-c,{y:1.08,yaw:-D3});at('pig',c,-c,{y:1.44,yaw:-D3});}trees([[-5.5,-4.5],[4.5,5.5],[-1,-5.6]]);}},
    {name:'Over the wall',pokes:3,par:2,h:8,time:75,zone:[1.5,1.5,6,6],inv:{ramp:1,ball:4,crate:2,domino:6},goal:'Knock the pig off its block',
      hint:'Position, place and rotate the ramp to face the wall, then putt a ball up it.',
      build(){for(const t of[-2.15,0,2.15])at('wall',-1+t*.707,-1-t*.707,{yaw:PI4,s:.6});pedestal(-3.2,-3.2);trees([[-6.5,5],[5,-6.5],[-6.5,-6.5]]);}},
    {name:'Bunker buster',pokes:2,par:2,h:8,time:50,zone:[-1.6,-1.6,2.4,2.4],inv:{tnt:2,ball:2,crate:2},goal:'Blow the pig out of its bunker',
      hint:'Pigs are blast-proof. Glass isn\'t. Then get something airborne.',
      build(){const c=-3.2;for(const a of[-.82,0,.82])for(const b of[-.82,0,.82]){if(a||b){at('steel',c+a,c+b);at('glass',c+a,c+b,{y:1.21});}}at('steel',c,c);at('pig',c,c,{y:1.08,yaw:PI4});trees([[-6.5,5],[5,-6.5]]);}},
    {name:'Double trouble',pokes:4,par:3,h:8,time:75,zone:[1.5,1.5,5.5,5.5],inv:{ball:4,plank:2,pillar:2,domino:10},goal:'Knock both pigs off their towers',
      hint:'Two towers, two pigs. A falling pillar can take out more than one thing.',
      build(){tower(-2.9,-1,4);tower(-1,-2.9,4);trees([[-6.5,5],[5,-6.5],[-6,-6]]);}},
    {name:'Artillery',pokes:1,par:1,h:10,time:90,zone:[3,3,7,7],inv:{cannon:1,tnt:1,ball:3,ramp:1},teach:'cannon',goal:'Knock the pig off its block',
      hint:'Position, place and rotate the cannon to aim at the castle. It fires every few seconds.',
      build(){const c=-3.5;castle(c,1.75);pedestal(c,c);trees([[-8,6],[6,-8],[-8,-8],[8,0]]);}},
    {name:'Wind tunnel',pokes:0,par:2,h:9,time:60,zone:[1,1,5,5],inv:{fan:2,beach:3,ball:2,crate:2},teach:'fan',goal:'Blow the pig off its block',
      hint:'No pokes here. Wind alone can’t shift the pig, but it can throw things at it.',
      build(){pedestal(-2,-2);trees([[-7,5],[5,-7],[-7,-7]]);}},
    {name:'Springboard',pokes:3,par:2,h:9,time:80,zone:[1,1,5,5],inv:{spring:2,ball:4,ramp:1,crate:2},teach:'spring',goal:'Reach the pig on its high perch',
      hint:'A spring pad bounces anything that lands on it straight up.',
      build(){for(const t of[-1.64,-.82,0,.82,1.64])at('stone',-.6+t*.707,-.6-t*.707,{yaw:PI4});pedestal(-2.7,-2.7,3);trees([[-7,4],[4,-7],[-7,-7]]);}},
    {name:'Pig pile',pokes:4,par:3,h:9,time:90,zone:[1.5,1.5,5.5,5.5],inv:{anvil:1,ball:5,tnt:1,domino:8,ramp:1},goal:'Knock all three pigs down',
      hint:'An anvil weighs as much as fifteen crates.',
      build(){const cx=-2.6,cz=-2.6,u=[.707,-.707],P=(t)=>[cx+u[0]*t,cz+u[1]*t];
        for(const t of[-.82,0,.82]){const [x,z]=P(t);at('crate',x,z,{yaw:PI4});}for(const t of[-.41,.41]){const [x,z]=P(t);at('crate',x,z,{y:1.215,yaw:PI4});}
        {const [x,z]=P(0);at('crate',x,z,{y:2.03,yaw:PI4});at('pig',x,z,{y:2.7,yaw:PI4});}for(const t of[-2.5,2.5]){const [x,z]=P(t);pedestal(x,z);}trees([[-7,5],[5,-7]]);}},
    {name:'Long range',pokes:2,par:2,h:11,time:100,zone:[5,5,9,9],inv:{cannon:2,conveyor:1,ramp:2,ball:6,spring:1,beach:2},goal:'Knock both distant pigs down',
      hint:'They’re a long way off. Conveyors keep things moving.',
      build(){pedestal(-5.5,-3.8,2);pedestal(-3.8,-5.5,1);trees([[-9,7],[7,-9],[-9,-9],[0,9]]);}},
    {name:'Event horizon',pokes:0,par:1,h:9,time:60,zone:[-1.5,-1.5,1.5,1.5],inv:{hole:1,ball:2,crate:2},teach:'hole',goal:'Get all three pigs off their crates',
      hint:'Place the black hole and wait.',
      build(){[[4,-2],[-3,3.2],[-3.2,-3]].forEach(([x,z])=>{at('crate',x,z);at('pig',x,z,{y:1.08,yaw:Math.atan2(-x,-z)});});trees([[-7,7],[7,7],[7,-7]]);}},
    {name:'Tornado alley',pokes:2,par:2,h:10,time:90,zone:[-1.5,-1.5,1.5,1.5],inv:{tornado:2,fan:2,balloon:3,beach:4,ball:3},teach:'tornado',goal:'Knock all four pigs down',
      hint:'Tornadoes wander about and lift whatever they pass over.',
      build(){[[-5.5,2],[2,-5.5],[-4.5,-4.5],[4.5,4.5]].forEach(([x,z])=>pedestal(x,z));trees([[-8,8],[8,-8]]);}},
    {name:'Fortress',pokes:5,par:4,h:11,time:150,zone:[3,3,9,9],inv:{cannon:2,tnt:3,ramp:1,ball:6,domino:12,fan:1,spring:1,anvil:1},goal:'Knock every pig off',
      hint:'Use everything you have unlocked.',
      build(){const c=-4;castle(c,1.9);for(const x of[-2.1,2.1])for(const z of[-2.1,2.1]){at('pillar',c+x,c+z);at('stone',c+x,c+z,{y:2.4});}
        at('stone',c,c);at('pig',c,c,{y:1.08,yaw:PI4});at('pig',c-2.1,c+2.1,{y:3.07,yaw:PI4});at('pig',c+2.1,c-2.1,{y:3.07,yaw:PI4});trees([[-9,7],[7,-9],[-9,-9],[9,-2]]);}},
    {name:'Pig city',pokes:8,par:6,h:12,time:180,zone:[-2,-2,2,2],inv:{cannon:2,tnt:4,ramp:2,ball:8,domino:16,fan:2,spring:2,anvil:2,rocket:2},goal:'Knock all five pigs down',
      hint:'Pigs in every direction. Turn the view with R to line up your shots.',
      build(){tower(-7,-3,4);tower(-3,-7,4);pedestal(7,-4,2);pedestal(-4,7,2);castle(6.5,1.75);pedestal(6.5,6.5);trees([[-10,10],[10,-10],[-10,-10],[2,10]]);}}];
  LEVELS.forEach((L,i)=>{const prev=new Set();LEVELS.slice(0,i).forEach(P=>Object.keys(P.inv).forEach(k=>prev.add(k)));L.isNew=Object.keys(L.inv).filter(k=>!prev.has(k));});
  const partsList=inv=>Object.keys(inv).map(k=>'<span><b style="background:'+K[k].col+'"></b>'+K[k].name+' ×'+inv[k]+'</span>').join('');
  function modal(step,title,body,btns){$('modal').classList.remove('win');$('mdStep').textContent=step;$('mdTitle').textContent=title;$('mdBody').innerHTML=body;const c=$('mdBtns'),nav=$('mdNav');c.innerHTML='';nav.innerHTML='';
    btns.forEach(([label,fn,primary],i)=>{const b=document.createElement('button');const isNav=i===0&&btns.length>1&&!primary;b.className='ibtn panel'+(primary?' primary':'')+(isNav?' ghost navlink':'');b.textContent=label;b.onclick=()=>{sfx.ui();$('modal').hidden=true;fn();};(isNav?nav:c).appendChild(b);});
    $('modal').hidden=false;if(c.lastChild)c.lastChild.focus();}
  function resetCamera(){camT=camAng=Math.PI/4;camEl=EL0;pan.set(0,0,0);panT.set(0,0,0);zoomT=camZoom=1;sizeView();}
  function applyMode(){const c=mode==='campaign';
    ['grab','paint','freeze'].forEach(id=>{toolsEl.querySelector('[data-tool='+id+']').hidden=c;});
    $('tabs').hidden=c;$('sub').querySelector('.opts').hidden=c;$('sizeSeg').hidden=c;const simC=$('simCamp');if(simC)simC.hidden=!c;
    if(c){state.size=1;if(['grab','paint','freeze'].includes(state.tool))setTool('place');}
    renderItems();rebuildGhost();hudKey='';}
  function openMenu(){clearStageMotion();document.body.classList.add('chromeless');$('levels').hidden=true;$('modal').hidden=true;$('menu').hidden=false;hush(true);
    if(camp&&camp.running&&!camp.done){state.paused=true;syncPlay();}}
  let stagePick=0,stageToken=0,stageBusy=false,stageQueued=0,stageGen=0;
  const stageCache={};
  const SIG=['rocket','tornado','hole','anvil','cannon','conveyor','spring','fan','tnt','balloon','ramp','pillar','domino','beach','plank','ball','crate'];
  function stagePart(L){
    const pool=L.isNew&&L.isNew.length?L.isNew.slice():Object.keys(L.inv);
    let best=pool[0],rank=1e9;
    for(const k of pool){if(!K[k]||typeof K[k].mesh!=='function')continue;const r=SIG.indexOf(k),score=r<0?800:r;if(score<rank){rank=score;best=k;}}
    return best;
  }
  function lockMesh(){
    const g=new THREE.Group(),wood=M('#c89a5a'),iron=M('#9aa3ab',{roughness:.4,metalness:.45});
    box(g,.74,.58,.32,wood,0,0,0);
    box(g,.82,.09,.38,mats.woodDark,0,.22,0);
    box(g,.82,.09,.38,mats.woodDark,0,-.22,0);
    box(g,.1,.16,.05,mats.dark,0,.04,.17);
    box(g,.05,.14,.05,mats.dark,0,-.1,.17);
    box(g,.1,.34,.1,iron,-.16,.4,0);
    box(g,.1,.34,.1,iron,.16,.4,0);
    const arch=new THREE.Mesh(new THREE.TorusGeometry(.16,.05,5,8,Math.PI),iron);
    arch.position.set(0,.57,0);arch.castShadow=true;arch.receiveShadow=true;g.add(arch);
    return g;
  }
  function ensureThumbRig(){
    if(thumbR)return;
    thumbR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
    thumbR.setPixelRatio(2);thumbR.setSize(TH.w,TH.h,false);
    thumbScene=new THREE.Scene();thumbScene.add(new THREE.HemisphereLight('#eaf4ff','#5a5040',.95));
    const d=new THREE.DirectionalLight('#fff3dc',1.15);d.position.set(-5,10,6);thumbScene.add(d);
    thumbCam=new THREE.OrthographicCamera(-TH.w/2/TH.ppu,TH.w/2/TH.ppu,TH.h/2/TH.ppu,-TH.h/2/TH.ppu,.1,200);
  }
  function shotMesh(key,make){
    if(stageCache[key])return stageCache[key];
    let mesh=null;
    try{
      ensureThumbRig();
      const w=300,h=220,ppu=72;
      thumbR.setPixelRatio(2);thumbR.setSize(w,h,false);
      thumbCam.left=-w/2/ppu;thumbCam.right=w/2/ppu;thumbCam.top=h/2/ppu;thumbCam.bottom=-h/2/ppu;
      mesh=make();thumbScene.add(mesh);mesh.updateMatrixWorld(true);
      const bb=new THREE.Box3().setFromObject(mesh),c=bb.getCenter(new THREE.Vector3()),dm=bb.getSize(new THREE.Vector3());
      const a=Math.PI/4;thumbCam.position.set(c.x+Math.sin(a)*30,c.y+22.5,c.z+Math.cos(a)*30);thumbCam.lookAt(c);
      const pw=Math.max(.05,(dm.x+dm.z)*.72),ph=Math.max(.05,dm.y*.85+(dm.x+dm.z)*.36);
      thumbCam.zoom=Math.min((w/ppu*.88)/pw,(h/ppu*.88)/ph);thumbCam.updateProjectionMatrix();
      thumbR.render(thumbScene,thumbCam);
      const url=thumbR.domElement.toDataURL('image/png');
      if(!url||url.length<64)return '';
      return stageCache[key]=url;
    }catch(e){return '';}
    finally{
      if(mesh&&thumbScene)thumbScene.remove(mesh);
      if(thumbR&&thumbCam){thumbR.setSize(TH.w,TH.h,false);
        thumbCam.left=-TH.w/2/TH.ppu;thumbCam.right=TH.w/2/TH.ppu;thumbCam.top=TH.h/2/TH.ppu;thumbCam.bottom=-TH.h/2/TH.ppu;
        thumbCam.zoom=1;thumbCam.updateProjectionMatrix();}
    }
  }
  function stageThumb(i){
    if(i>prog.cleared)return shotMesh('lock',lockMesh);
    const k=stagePart(LEVELS[i]);
    return shotMesh('part|'+k,()=>K[k].mesh(1,M(K[k].col)));
  }
  function clearStageMotion(){
    stageGen++;stageToken++;stageBusy=false;stageQueued=0;
    const view=$('stageView');if(!view)return;
    view.classList.remove('is-sliding');
    const ghost=view.querySelector('.stage-ghost');if(ghost)ghost.remove();
    const card=$('stageCard');card.style.transition='none';card.style.transform='';
  }
  function paintStage(i){
    const L=LEVELS[i],lock=i>prog.cleared,st=prog.stars[i]||0;
    $('stageCard').classList.toggle('is-lock',lock);
    $('stageNum').textContent='Stage '+(i+1);
    $('stageName').textContent=L.name;
    $('stageShot').alt=lock?'Locked':L.name;
    const stars=$('stageStars');
    stars.hidden=false;stars.setAttribute('aria-hidden',lock?'true':'false');
    stars.innerHTML=lock?'':'★'.repeat(st)+'<i>'+'★'.repeat(Math.max(0,3-st))+'</i>';
    $('stagePrev').disabled=i<=0;$('stageNext').disabled=i>=LEVELS.length-1;
  }
  function showStage(i){
    clearStageMotion();
    i=clamp(i,0,LEVELS.length-1);stagePick=i;const token=++stageToken;
    paintStage(i);
    const url=stageThumb(i),img=$('stageShot');
    const reveal=()=>{if(token!==stageToken)return;document.body.classList.add('chromeless');$('menu').hidden=true;$('levels').hidden=false;};
    if(!url||url.indexOf('data:')!==0){img.hidden=true;reveal();return;}
    const done=()=>{if(token!==stageToken||img.getAttribute('src')!==url)return;img.hidden=false;reveal();};
    if(img.getAttribute('src')===url&&img.complete&&img.naturalWidth>0){done();return;}
    img.onload=done;
    img.onerror=()=>{if(token!==stageToken)return;img.hidden=true;reveal();};
    img.src=url;
    if(img.complete&&img.naturalWidth>0){img.onload=null;done();}
  }
  function launchStage(){
    if($('levels').hidden||stageBusy)return;
    if(stagePick>prog.cleared){sfx.no();return;}
    sfx.ui();$('levels').hidden=true;startLevel(stagePick);
  }
  function canStep(d){const n=stagePick+d;return n>=0&&n<LEVELS.length;}
  function stepStage(d,queued){
    if($('levels').hidden)return;
    if(stageBusy){
      if(stageQueued||!canStep(d))return;
      stageQueued=d;sfx.swoosh(d);return;
    }
    if(!canStep(d))return;
    if(!queued)sfx.swoosh(d);
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){showStage(stagePick+d);return;}
    beginSlide(stagePick+d,d);
  }
  function beginSlide(n,dir){
    const token=++stageToken;
    stageBusy=true;stagePick=n;
    const url=stageThumb(n)||'';
    if(token!==stageToken)return;
    runSlide(n,dir,url);
  }
  function runSlide(n,dir,url){
    const view=$('stageView'),card=$('stageCard'),gen=++stageGen;
    const ghost=card.cloneNode(true);
    ghost.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
    ghost.classList.add('stage-ghost');ghost.setAttribute('aria-hidden','true');
    view.classList.add('is-sliding');view.appendChild(ghost);
    const from=dir>0?'100%':'-100%',to=dir>0?'-100%':'100%';
    card.style.transition='none';card.style.transform='translate3d('+from+',0,0)';
    paintStage(n);
    const img=$('stageShot');
    if(url.indexOf('data:')===0){img.hidden=false;if(img.getAttribute('src')!==url)img.src=url;}
    else img.hidden=true;
    void card.offsetWidth;
    card.style.transition='';card.style.transform='translate3d(0,0,0)';
    ghost.style.transform='translate3d('+to+',0,0)';
    let settled=false;
    const finish=()=>{
      if(settled||gen!==stageGen)return;settled=true;
      if(ghost.parentNode)ghost.remove();
      view.classList.remove('is-sliding');
      card.style.transition='none';card.style.transform='';
      void card.offsetWidth;card.style.transition='';
      stageBusy=false;
      const q=stageQueued;stageQueued=0;
      if(q&&!$('levels').hidden)stepStage(q,true);
    };
    ghost.addEventListener('transitionend',e=>{if(e.target===ghost&&e.propertyName==='transform')finish();});
    setTimeout(finish,380);
  }
  function openLevels(){document.body.classList.add('chromeless');$('modal').hidden=true;showStage(clamp(prog.cleared||0,0,LEVELS.length-1));}
  $('stagePrev').onclick=()=>stepStage(-1);
  $('stageNext').onclick=()=>stepStage(1);
  $('stageGo').onclick=e=>{e.stopPropagation();launchStage();};
  $('stageCard').onclick=e=>{if(e.target.closest('#stageGo'))return;launchStage();};
  addEventListener('keydown',e=>{
    if($('levels').hidden)return;
    if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
    if(e.metaKey||e.ctrlKey||e.altKey||e.repeat)return;
    e.preventDefault();e.stopImmediatePropagation();
    stepStage(e.key==='ArrowRight'?1:-1);
  },true);
  function startLevel(i,quick){clearStageMotion();stageToken++;$('levels').hidden=true;$('modal').hidden=true;if(drama)endDrama();reacts.splice(0).forEach(r=>r.el.remove());camHold=0;camSave=null;if(cine){cine.done=()=>{};endTaunt(true);}document.body.classList.remove('chromeless');mode='campaign';const L=LEVELS[i];releaseGrab();clearAll();buildIsland(L.h);setZone(L.zone);resetCamera();state.wind=false;syncBtns();quakeT=0;state.rotY=0;stillFor=0;stuckTold=false;
    camp={i,L,t:L.time,running:false,done:false,pokesUsed:0,inv:Object.assign({},L.inv)};L.build();objs.forEach(o=>{if(o.k==='brick')makeDormant(o);});for(let k=0;k<150;k++)world.step(STEP);objs.forEach(o=>{o.mine=false;o.age=0;if(o.k==='pig'){const b=o.parts[0].body;o.startY=b.position.y;o.sx=b.position.x;o.sz=b.position.z;o.bx=b.position.x;o.bz=b.position.z;o.bup=b.quaternion.vmult(UPV).y;}o.parts.forEach(pt=>{if(pt.body){pt.body.velocity.set(0,0,0);pt.body.angularVelocity.set(0,0,0);}});});camp.pigs=objs.filter(o=>o.k==='pig').length;state.kind=Object.keys(L.inv)[0];applyMode();setTool('place');
    state.paused=true;syncPlay();
    playTaunt(()=>{if(quick)return run();modal('Stage '+(i+1)+' of '+LEVELS.length,L.name,'<div class="brief"><div class="goal">'+goalText()+'</div><div class="parts">'+partsList(L.inv)+'</div><div class="rules"><span>'+(L.pokes===0?'No pokes':L.pokes+(L.pokes===1?' poke':' pokes'))+'</span><span>Par: '+L.par+(L.par===1?' part':' parts')+'</span></div><div class="hint">'+L.hint+'</div></div>',
      i===0?[['All stages',openLevels],['Show me how',()=>runTour(run)],['Start',run,true]]:[['All stages',openLevels],['Start',run,true]]);});}
  const TOUR=[
    {t:'#sub',title:'Place',text:'Pick a part here, then click the island to put it down. Hover a placed part and drag sideways to turn it.'},
    {t:'zone',title:'Green zone',text:'Parts can only go inside this square.'},
    {t:'[data-tool=poke]',title:'Poke',text:'Press on your part and drag to aim. Let go, then click to shoot.'},
    {t:'#clock',title:'Clock',text:'Knock the pig to the ground before the clock runs out.'}]
  let tourI=0,tourDone=null;
  function runTour(done){tourDone=done;$('coach').hidden=false;showTour(0);}
  function endTour(){$('coach').hidden=true;const d=tourDone;tourDone=null;d&&d();}
  function tourRect(st){if(st.t==='zone'&&zone){const pts=[[zone[0],zone[1]],[zone[2],zone[1]],[zone[0],zone[3]],[zone[2],zone[3]]].map(([x,z])=>{const v=new THREE.Vector3(x,0,z).project(camera);return [(v.x+1)/2*innerWidth,(1-v.y)/2*innerHeight];});
      const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);return {left:Math.min(...xs),top:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}
    const el=st.t&&document.querySelector(st.t);if(!el||el.hidden)return null;return el.getBoundingClientRect();}
  function showTour(i){tourI=i;const st=TOUR[i],r=tourRect(st),ring=$('coachRing'),bub=$('coachBubble');
    $('coachStep').textContent=(i+1)+' of '+TOUR.length;$('coachTitle').textContent=st.title;$('coachText').textContent=st.text;
    $('coachBack').hidden=i===0;$('coachNext').textContent=i===TOUR.length-1?'Start the clock':'Next';
    if(r){ring.hidden=false;$('coach').classList.remove('dim');const pad=8;Object.assign(ring.style,{left:(r.left-pad)+'px',top:(r.top-pad)+'px',width:(r.width+pad*2)+'px',height:(r.height+pad*2)+'px'});}
    else{ring.hidden=true;$('coach').classList.add('dim');}
    const bw=Math.min(380,innerWidth-32);bub.style.width=bw+'px';const bh=bub.offsetHeight;let x,y,arrow='';
    if(!r){x=(innerWidth-bw)/2;y=(innerHeight-bh)/2;}
    else{const cx=r.left+r.width/2;x=clamp(cx-bw/2,16,innerWidth-bw-16);
      if(r.top+r.height/2>innerHeight/2){y=r.top-bh-22;arrow='down';}else{y=r.top+r.height+22;arrow='up';}
      if(r.left>innerWidth*.6&&r.height>innerHeight*.25){x=r.left-bw-22;y=clamp(r.top,16,innerHeight-bh-16);arrow='right';}
      y=clamp(y,16,innerHeight-bh-16);bub.style.setProperty('--ax',clamp(cx-x,24,bw-24)+'px');}
    bub.dataset.arrow=arrow;bub.style.left=x+'px';bub.style.top=y+'px';$('coachNext').focus();}
  $('coachNext').onclick=()=>{sfx.ui();tourI<TOUR.length-1?showTour(tourI+1):endTour();};
  $('coachBack').onclick=()=>{sfx.ui();showTour(Math.max(0,tourI-1));};$('coachSkip').onclick=()=>{sfx.ui();endTour();};
  addEventListener('resize',()=>{if(!$('coach').hidden)showTour(tourI);});
  addEventListener('keydown',e=>{if($('coach').hidden)return;if(e.key==='Escape')endTour();else if(e.key==='ArrowRight'){showTour(Math.min(TOUR.length-1,tourI+1));}else if(e.key==='ArrowLeft')showTour(Math.max(0,tourI-1));},true);
  const TAUNTS=[["You? Topple ME?", null], ["Nice aim... NOT!", "Ha ha ha ha!"], ["Bring it, tiny human!", null], ["Scared? You should be.", null], ["Missed already?", "And you haven't even started!"], ["Come at me, bro!", null], ["This tower? Unbeatable.", null], ["Zzz... oh, it's you.", null], ["I've seen better throws", "from a sausage!"], ["What a hamateur.", null], ["You can't handle the swine!", null], ["I'm the big cheese. Well, ham.", null], ["Hogwash! You'll never do it.", null], ["Sow what?", "Try harder!"], ["I'm bacon you to try.", null], ["Pork chop? Pork NOT.", null], ["My trotters are glued on.", "Good luck!"], ["Nice face. Did a crate hit it?", null], ["I'm too ham to fail!", null], ["Go hog wild. Still won't work.", null], ["Hamlet called. He wants his tragedy.", "That's you, by the way."], ["I've had tougher Mondays.", null], ["Pig-headed? Proudly.", null], ["You've got pig problems.", "And I ain't one."], ["I eat dominos for breakfast.", "*crunch*"], ["This sty is MINE.", null], ["Hey, your shoelace is untied.", "Made you look!"], ["Is that a ball or a grape?", null], ["Physics is on MY side.", null], ["Swine and dandy up here.", null], ["Not even the wind can move me.", null], ["I'm a fortress of crackling!", null], ["Ham-ateur hour, folks!", null], ["You want a piece of me?", "Not the bacon!"], ["Snout of luck, pal.", null], ["I could do this all day.", null], ["Your mum topples like a pro.", "You, though..."], ["I've met smarter turnips.", null], ["Do you even physics?", null], ["Oink. That means 'lol' in pig.", null]];
  const SWEARS=["You %£@£$!", "You absolute £$%&!", "Why you little #@£$!", "Oh, you %£@&*!", "Get stuffed, you £$#@!", "You cheeky £%$#!", "Watch it, you @£$%!"];
  const withSwear=(l,p)=>[l[0],l[1]||(Math.random()<p?SWEARS[Math.floor(Math.random()*SWEARS.length)]:null)];
  const isSwear=t=>/[#@£$%&*]{2}/.test(t||'');
  const FADE_MS=320,EXIT_GAP=120,reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  let cine=null,cineHide=0,cineBarT=0,cineUiT=0,cineVeilT=0;
  function releaseHud(gen,cur){if(gen!==cur())return;if(!document.body.classList.contains('cinema')&&!document.body.classList.contains('slomo'))document.body.classList.remove('hudfade');}
  function playTaunt(done){const pigs=objs.filter(o=>o.k==='pig'&&o.parts[0].body);if(!pigs.length){done();return;}
    if(mode==='campaign'&&camp)$('clock').hidden=false;const hud=document.querySelector('.dock');if(hud)void hud.offsetWidth;
    document.body.classList.add('hudfade','cinema');const c={x:0,y:0,z:0};pigs.forEach(o=>{const p=o.parts[0].body.position;c.x+=p.x;c.y+=p.y;c.z+=p.z;});c.x/=pigs.length;c.y/=pigs.length;c.z/=pigs.length;
    let spread=0;pigs.forEach(a=>pigs.forEach(b=>{spread=Math.max(spread,a.parts[0].body.position.distanceTo(b.parts[0].body.position));}));
    cineHide++;const gen=cineHide,ov=$('cine');ov.classList.remove('out','bars');ov.hidden=false;ov.querySelectorAll('.bubble').forEach(b=>b.remove());const used=new Set();
    cine={t:0,done,stage:0,pigs:pigs.map((o,k)=>{let li;do{li=Math.floor(Math.random()*TAUNTS.length);}while(used.has(li)&&used.size<TAUNTS.length);used.add(li);
      const el=document.createElement('div');el.className='bubble';el.style.setProperty('--d',(k*.18)+'s');el.textContent=TAUNTS[li][0];ov.appendChild(el);
      return {o,ph:Math.random()*6,lines:withSwear(TAUNTS[li],.4),el,delay:.45+k*.18};})};
    clearTimeout(cineBarT);clearTimeout(cineUiT);cineUiT=0;
    if(reduceMotion())ov.classList.add('bars');
    else{const tArm=performance.now();const arm=()=>{cineBarT=0;if(gen!==cineHide||!cine||ov.classList.contains('out'))return;const dock=document.querySelector('.dock');if(dock&&+getComputedStyle(dock).opacity>.04&&performance.now()-tArm<1200){cineBarT=setTimeout(arm,40);return;}ov.classList.add('bars');};cineBarT=setTimeout(arm,FADE_MS);}
    panT.set(clamp(c.x,-14,14),0,clamp(c.z,-14,14));zoomT=clamp(2.3-spread*.2,1.1,2.3);lookYT=c.y+.35;
    sfx.whoosh();}
  function endTaunt(instant){if(!cine)return;const d=cine.done;cine.pigs.forEach(p=>{const m=p.o.parts[0].mesh;m.scale.set(1,1,1);});cine=null;
    clearTimeout(cineBarT);cineBarT=0;clearTimeout(cineUiT);cineUiT=0;
    const ov=$('cine');
    panT.set(0,0,0);zoomT=1;lookYT=-.5;
    const hide=++cineHide;
    const close=()=>{if(hide!==cineHide)return;ov.classList.remove('out','bars');ov.hidden=true;ov.querySelectorAll('.bubble').forEach(b=>b.remove());};
    const uiBack=()=>{if(hide!==cineHide)return;document.body.classList.remove('cinema');clearTimeout(cineVeilT);cineVeilT=setTimeout(()=>releaseHud(hide,()=>cineHide),FADE_MS);};
    if(instant||reduceMotion()){clearTimeout(cineVeilT);cineVeilT=0;document.body.classList.remove('cinema');if(!document.body.classList.contains('slomo'))document.body.classList.remove('hudfade');close();if(d)d();return;}
    ov.classList.add('out');
    cineUiT=setTimeout(uiBack,EXIT_GAP);
    const onEnd=e=>{if(e.animationName!=='barOut')return;ov.removeEventListener('animationend',onEnd);close();};
    ov.addEventListener('animationend',onEnd);
    setTimeout(()=>{ov.removeEventListener('animationend',onEnd);close();},700);
    setTimeout(d,450);}
  function laugh(){sfx.laugh();}
  function tickTaunt(dt){if(!cine)return;cine.t+=dt;const t=cine.t,n=cine.pigs.length,two=n<=2,lineT=two?3.2:2.6,st=.45;
    const dur=p=>two&&p.lines[1]?lineT*2:lineT;
    let acc=0,k0=-1,local=0;if(t>=st){for(let k=0;k<n;k++){const d=dur(cine.pigs[k]);if(t-st<acc+d){k0=k;local=(t-st)-acc;break;}acc+=d;}}
    cine.pigs.forEach((p,k)=>{const o=p.o;if(o.dead)return;const m=o.parts[0].mesh,b=o.parts[0].body,on=t>st;
      const speaking=k===k0,ph=(t*(speaking?9:6)+p.ph),hop=on?Math.abs(Math.sin(ph))*(speaking?.5:.25):0,land=on&&Math.abs(Math.sin(ph))<.18;
      m.position.y=b.position.y+hop;if(on)m.rotateY(Math.sin(t*10+p.ph)*(speaking?.4:.15));m.scale.set(land?1.18:1-hop*.12,land?.78:1+hop*.18,land?1.18:1-hop*.12);
      const line=two&&p.lines[1]&&local>lineT?1:0,txt=speaking?p.lines[line]:null;
      if(speaking&&p.cur!==k0+'|'+line){const first=p.cur==null||!p.cur.startsWith(k0+'|');p.cur=k0+'|'+line;p.el.textContent=txt;p.el.classList.remove('swap');void p.el.offsetWidth;p.el.classList.add('swap');
        if(first)sfx.oink();else if(isSwear(txt))bleep();else laugh();}
      const v=new THREE.Vector3(b.position.x,b.position.y+hop+.75,b.position.z).project(camera);
      p.el.style.left=((v.x+1)/2*innerWidth)+'px';p.el.style.top=((1-v.y)/2*innerHeight)+'px';p.el.classList.toggle('show',speaking);});
    let total=0;cine.pigs.forEach(p=>{total+=dur(p);});if(t>st+total+.25)endTaunt();}
  $('cine').addEventListener('pointerdown',e=>{e.preventDefault();endTaunt();});
  addEventListener('keydown',e=>{if(cine&&[' ','Enter','Escape'].includes(e.key)){e.preventDefault();endTaunt();return;}if(drama&&drama.phase==='slow'&&(e.key==='Escape'||e.key===' ')){e.preventDefault();skipSlomo();}},true);
  const NEAR=[["That was CLOSE!", null], ["Whoa whoa WHOA!", null], ["HEY! Watch it!", null], ["My bacon!", null], ["Missed me! Ha!", "...that was close"], ["That tickled.", null], ["Not even close!", "(it was very close)"], ["My trotters!", null], ["I nearly went full sausage!", null], ["You call that a shove?", "...ow."], ["Hog-wash! Lucky miss!", null], ["Easy on the ham!", null], ["Did you feel that?", "I didn't. *wobble*"], ["Still standing! Oink!", "Barely."], ["My crackling is crackling!", null], ["Rude! Utterly rude!", null], ["Hold the pork chops!", null], ["I'm not shaking.", "You're shaking!"], ["Ooh, that hit my snout!", null], ["Squeee... I mean, ha!", null], ["You've rattled my sty!", null], ["Almost! Almost bacon!", null], ["Is that your best?", "...don't answer that."], ["Steady... steady...", "Phew!"], ["Swine-ging and a miss!", null], ["Not today, chef!", null], ["That's assault with a deadly ball!", null], ["Pig down! Wait, no. Pig fine!", null], ["Ham-azing dodge, if I say so myself!", null]];
  const reacts=[];let camSave=null,camHold=0;
  function bleep(){sfx.bleep();}
  function reactPig(o){const b=o.parts[0].body;o.lastReact=simT;o.disturbedAt=null;o.bx=b.position.x;o.bz=b.position.z;o.bup=b.quaternion.vmult(UPV).y;
    const ln=withSwear(NEAR[Math.floor(Math.random()*NEAR.length)],.35),el=document.createElement('div');el.className='bubble react';el.textContent=ln[0];$('reacts').appendChild(el);
    reacts.push({o,el,t:0,ln,swapped:false});sfx.react();
    if(!drama&&!aim&&!spin&&!grab&&!camDrag&&!down){if(!camSave)camSave={pan:panT.clone(),zoom:zoomT,ly:lookYT};panT.set(clamp(b.position.x,-14,14),0,clamp(b.position.z,-14,14));zoomT=clamp(Math.max(zoomT,1)*1.45,1,2.2);lookYT=b.position.y+.2;camHold=1.9;}}
  function tickReacts(dt){
    if(mode==='campaign'&&camp&&camp.running&&!camp.done&&!cine){for(const o of objs){if(o.k!=='pig'||o.dead||o.disturbedAt==null)continue;const b=o.parts[0].body;
      if(simT-o.disturbedAt>.9&&b.velocity.norm()<.35&&b.angularVelocity.norm()<.6&&(o.lastReact==null||simT-o.lastReact>3.5)&&reacts.length<1)reactPig(o);}}
    for(let i=reacts.length-1;i>=0;i--){const r=reacts[i];r.t+=dt;const o=r.o;
      if(o.dead||r.t>2.4){r.el.remove();reacts.splice(i,1);continue;}
      if(!r.swapped&&r.t>1.1&&r.ln[1]){r.swapped=true;r.el.textContent=r.ln[1];r.el.classList.add('swap');if(isSwear(r.ln[1]))bleep();}
      const b=o.parts[0].body,m=o.parts[0].mesh;m.rotateY(Math.sin(r.t*28)*.12*(1-r.t/2.4));
      const v=new THREE.Vector3(b.position.x,b.position.y+.85,b.position.z).project(camera);r.el.style.left=((v.x+1)/2*innerWidth)+'px';r.el.style.top=((1-v.y)/2*innerHeight)+'px';r.el.classList.add('show');}
    if(camHold>0){camHold-=dt;if(camHold<=0&&camSave){panT.copy(camSave.pan);zoomT=camSave.zoom;lookYT=camSave.ly;camSave=null;}}}
  let drama=null,dramaCool=0,slomoHide=0,slomoBarT=0,slomoUiT=0,slomoVeilT=0;
  const tiltOf=b=>b.quaternion.vmult(UPV).y;
  const pigHot=o=>{if(!o||o.k!=='pig'||o.dead||o.age<.4)return false;const b=o.parts[0]&&o.parts[0].body;if(!b)return false;return b.velocity.norm()>.8||b.angularVelocity.norm()>2||tiltOf(b)<.85;};
  function markWave(){for(const p of objs)if(pigHot(p))p.dramaUsed=true;}
  function startDrama(o){if(!o||o.dead||o.dramaUsed||o.dramaHold||drama)return;o.dramaHold=true;drama={o,phase:'watch',t:0,saved:{pan:panT.clone(),zoom:zoomT,ly:lookYT}};zoomT=clamp(Math.max(zoomT,1)*1.5,1.3,2);}
  function showSlomo(){slomoHide++;const ov=$('slomo'),gen=slomoHide;
    clearTimeout(slomoBarT);clearTimeout(slomoUiT);clearTimeout(slomoVeilT);slomoBarT=slomoUiT=slomoVeilT=0;
    ov.classList.remove('out','go','bars');ov.hidden=false;void ov.offsetWidth;ov.classList.add('go');
    if(reduceMotion()){ov.classList.add('bars');return;}
    const tArm=performance.now();const arm=()=>{slomoBarT=0;if(gen!==slomoHide||ov.classList.contains('out'))return;const dock=document.querySelector('.dock');if(dock&&+getComputedStyle(dock).opacity>.04&&performance.now()-tArm<1200){slomoBarT=setTimeout(arm,40);return;}ov.classList.add('bars');};slomoBarT=setTimeout(arm,FADE_MS);}
  function hideSlomo(instant){clearTimeout(slomoBarT);slomoBarT=0;clearTimeout(slomoUiT);slomoUiT=0;const ov=$('slomo');const hide=++slomoHide;
    const close=()=>{if(hide!==slomoHide)return;ov.classList.remove('out','go','bars');ov.hidden=true;};
    const uiBack=()=>{if(hide!==slomoHide)return;document.body.classList.remove('slomo');clearTimeout(slomoVeilT);slomoVeilT=setTimeout(()=>releaseHud(hide,()=>slomoHide),FADE_MS);};
    if(instant||reduceMotion()){clearTimeout(slomoVeilT);slomoVeilT=0;document.body.classList.remove('slomo');if(!document.body.classList.contains('cinema'))document.body.classList.remove('hudfade');close();return;}
    ov.classList.add('out');slomoUiT=setTimeout(uiBack,EXIT_GAP);setTimeout(close,480);}
  function startSlow(){if(!drama||drama.phase==='slow')return;drama.phase='slow';drama.slowAt=drama.t;drama.o.dramaUsed=true;markWave();state.speed=.22;zoomT=2.5;const hud=document.querySelector('.dock');if(hud)void hud.offsetWidth;document.body.classList.add('hudfade','slomo');showSlomo();sfx.slomo();}
  function skipSlomo(){if(!drama||drama.phase!=='slow')return;sfx.cancel();endDrama();}
  $('slomo').addEventListener('pointerdown',e=>{if($('slomo').classList.contains('out'))return;e.preventDefault();skipSlomo();});
  function endDrama(){if(!drama)return;const o=drama.o,sv=drama.saved,slow=drama.phase==='slow';if(slow){markWave();dramaCool=1.2;}else if(o&&!o.dramaUsed&&!pigHot(o))o.dramaHold=false;drama=null;state.speed=1;
    if(sv){panT.copy(sv.pan);zoomT=sv.zoom;lookYT=sv.ly;}if(slow)hideSlomo(false);else document.body.classList.remove('slomo');}
  function tickDrama(dt){
    if(mode!=='campaign'||!camp||!camp.running||cine){if(drama)endDrama();dramaCool=0;return;}
    if(drama){drama.t+=dt;const o=drama.o;
      if(o.dead){if(drama.deadAt==null)drama.deadAt=drama.t;if(drama.t-drama.deadAt>(drama.phase==='slow'?1.1:.6))endDrama();return;}
      const b=o.parts[0].body,v=b.velocity.norm(),w=b.angularVelocity.norm(),tl=tiltOf(b);
      panT.set(clamp(b.position.x,-14,14),0,clamp(b.position.z,-14,14));lookYT=b.position.y;
      if(drama.phase==='watch'){if((b.position.y<o.startY-.3&&b.velocity.y<-1)||tl<.5)startSlow();else if(drama.t>1.4&&v<.2&&w<.4)endDrama();else if(drama.t>5)endDrama();}
      else{markWave();if(drama.t-drama.slowAt>3)endDrama();}
      return;}
    if(dramaCool>0){dramaCool-=dt;markWave();return;}
    for(const o of objs)if(o.k==='pig'&&o.dramaHold&&!o.dramaUsed&&!pigHot(o))o.dramaHold=false;
    if(camp.done||aim||spin||grab||camDrag)return;
    for(const o of objs){if(o.k!=='pig'||o.dead||o.dramaUsed||o.dramaHold||o.age<.4)continue;if(pigHot(o)){startDrama(o);break;}}}
  function idleRest(o){const m=o.parts[0]&&o.parts[0].mesh;if(m&&(m.scale.x!==1||m.scale.y!==1))m.scale.set(1,1,1);}
  function pigIdleOk(o){if(!o||o.k!=='pig'||o.dead||o.age<.45)return false;if((drama&&drama.o===o)||reacts.some(r=>r.o===o)||(grab&&grab.o===o))return false;const b=o.parts[0].body;if(!b)return false;
    if(o.disturbedAt!=null||b.velocity.norm()>.28||b.angularVelocity.norm()>.55||tiltOf(b)<.92)return false;
    if((o.startY||b.position.y)-b.position.y>.12)return false;
    if(o.sx!=null&&Math.hypot(b.position.x-o.sx,b.position.z-o.sz)>.3)return false;return true;}
  function idleLive(){if(cine||state.paused)return false;if(mode==='campaign')return !!(camp&&camp.running&&!camp.done);return mode==='creative'&&!document.body.classList.contains('chromeless');}
  function tickIdle(){if(cine)return;if(!idleLive()){for(const o of objs)if(o.k==='pig'&&!o.dead)idleRest(o);return;}
    for(const o of objs){if(o.k!=='pig'||o.dead)continue;if(!pigIdleOk(o)){idleRest(o);continue;}
      const m=o.parts[0].mesh,ph=o.ai.h,w=Math.sin(elapsed*3.2+ph),q=Math.sin(elapsed*4.6+ph*1.3);
      m.rotateZ(w*.05);m.rotateX(q*.03);m.rotateY(w*.08);m.scale.set(1+q*.04,1-q*.04,1+q*.04);}}
  function goalText(){const n=camp.pigs;return n===1?'Topple the pig before the time runs out.':'Topple all '+n+' pigs before the time runs out.';}
  const TEACH_TIP={fan:'Place a fan. It shoves light things, not the pig.',spring:'Place a spring, then drop something on it.',cannon:'Place the cannon and turn it toward the pig.',hole:'Place the black hole between the pigs. It pulls, it does not aim.',tornado:'Place a tornado near a pig. It wanders from there.'};
  function run(){lastSec=Math.ceil(camp.t);camp.running=true;state.paused=false;syncPlay();renderItems();
    const tip=TEACH_TIP[camp.L.teach];if(tip)setTimeout(()=>{if(camp&&camp.running&&!camp.done&&camp.inv[camp.L.teach]===camp.L.inv[camp.L.teach])toast(tip,3400);},600);}
  function killPig(o){if(o.dead)return;if(drama&&drama.phase==='slow')sfx.downer();const p=mainPos(o);burst(p.x,p.y+.2,p.z,28,['#f2a0b0','#e07d92','#ffffff'],4,.14,.7,.6,true);sfx.splat();sfx.oink();removeObj(o);}
  function onPigGone(){if(clearing||mode!=='campaign'||!camp||camp.done||!camp.running)return;if(!objs.some(o=>o.k==='pig'&&!o.dead)){camp.done=true;const c=camp;setTimeout(()=>{if(camp===c)win();},1300);}}
  function win(){const L=camp.L,i=camp.i,f=camp.t/L.time,used=Object.keys(L.inv).reduce((a,k)=>a+L.inv[k]-(camp.inv[k]||0),0),gotPar=used<=L.par,gotFast=f>=.5,st=1+(gotPar?1:0)+(gotFast?1:0);prog.stars[i]=Math.max(prog.stars[i]||0,st);prog.cleared=Math.max(prog.cleared,i+1);saveProg();sfx.win();camp.running=false;
    const next=LEVELS[i+1],many=camp.pigs>1,why=gotPar&&gotFast?'Par and fast':gotPar?'Par':gotFast?'Fast':'',stars=[0,1,2].map(n=>'<span'+(n<st?' class="on"':'')+' style="--i:'+n+'" aria-hidden="true">★</span>').join('');
    modal('Stage '+(i+1)+' cleared',many?'Pigs toppled!':'Pig toppled!','<div class="brief"><div class="big-stars" role="img" aria-label="'+(st===1?'1 star':st+' stars')+'">'+stars+'</div>'+(why?'<div class="star-why">'+why+'</div>':'')+'</div>',
      next?[['All stages',openLevels],['Retry',()=>startLevel(i,true)],['Next stage',()=>startLevel(i+1),true]]:[['Retry',()=>startLevel(i,true)],['Back to stages',openLevels,true]]);
    $('modal').classList.add('win');}
  function lose(){camp.done=true;camp.running=false;sfx.lose();const n=objs.filter(o=>o.k==='pig').length;
    modal('Stage '+(camp.i+1),'Out of time','<div class="brief"><div class="goal">'+n+(n===1?' pig':' pigs')+' still standing.</div><div class="hint">'+camp.L.hint+'</div></div>',[['All stages',openLevels],['Try again',()=>startLevel(camp.i,true),true]]);}
  $('mStart').onclick=()=>{sfx.ui();openLevels();};$('levelsBack').onclick=()=>{sfx.ui();openMenu();};$('menuBtn').onclick=()=>{const open=$('sim').classList.toggle('open');$('menuBtn').classList.toggle('on',open);sfx.panel();};$('mainMenuBtn').onclick=()=>{closeSim();openMenu();sfx.panel();};
  $('restartBtn').onclick=()=>{sfx.ui();closeSim();camp&&startLevel(camp.i,true);};$('stagesBtn').onclick=()=>{sfx.ui();closeSim();openLevels();};
  function closeSim(){$('sim').classList.remove('open');$('menuBtn').classList.remove('on');}

  /* ---------- save ---------- */
  function serialize(){return {v:1,ui:{tool:state.tool,kind:state.kind,cat:state.cat,size:state.size,snap:state.snap,speed:state.speed,grav:state.grav,wind:state.wind,sun:state.sun,pixel:state.pixel,sound:state.sound,camA:camT,voidCount:state.voidCount},
    objs:objs.filter(o=>!o.temp&&!o.dead).map(o=>{const b=o.parts[0].body,p=b?b.position:o.pos,r={k:o.k,p:[+p.x.toFixed(3),+p.y.toFixed(3),+p.z.toFixed(3)],s:o.s,c:o.col,f:o.frozen?1:0};
      if(b)r.q=[+b.quaternion.x.toFixed(4),+b.quaternion.y.toFixed(4),+b.quaternion.z.toFixed(4),+b.quaternion.w.toFixed(4)];else r.yaw=o.yaw;
      if(o.k==='hole')r.e={size:o.size};if(o.extra&&o.extra.only)r.e=Object.assign(r.e||{},{only:o.extra.only});return r;})};}
  function load(data){for(const r of data.objs||[]){const o=addObj(r.k,{p:r.p,q:r.q,yaw:r.yaw,s:r.s,col:r.c,frozen:!!r.f,extra:r.e});if(o&&r.e&&r.e.size)o.size=r.e.size;}}

  /* ---------- HUD ---------- */
  let hudKey='';
  function pokeBadge(n){const t=toolsEl.querySelector('[data-tool=poke]');if(!t)return;let b=t.querySelector('.tbadge');
    if(n==null){if(b)b.remove();t.classList.remove('spent');return;}if(!b){b=document.createElement('b');b.className='tbadge';t.appendChild(b);}
    const txt='×'+n;if(b.textContent!==txt){const was=b.textContent;b.textContent=txt;b.classList.toggle('out',n<=0);t.classList.toggle('spent',n<=0);if(was){b.classList.remove('bump');void b.offsetWidth;b.classList.add('bump');}}}
  function hud(){if(mode==='campaign'&&camp){const pigs=objs.filter(o=>o.k==='pig').length,t=Math.ceil(camp.t),key='c'+camp.i+'|'+t+'|'+pigs+state.paused+'|'+camp.pokesUsed;if(key===hudKey)return;hudKey=key;
      $('brand').textContent='Campaign · Stage '+(camp.i+1);$('status').textContent=camp.L.name;
      $('count').textContent=pigs+(pigs===1?' pig':' pigs')+' left';pokeBadge(camp.L.pokes===0?0:pokesLeft());$('voidc').textContent=state.paused&&camp.running?'Paused':'';return;}
    pokeBadge(null);$('brand').textContent='Topple the Pigs';const g='';
    const st=state.paused?'Paused':'Running';
    const n=objs.length,key=st+g+n+state.voidCount;if(key===hudKey)return;hudKey=key;
    $('status').textContent=st;$('count').textContent=n+' objects';$('voidc').textContent=state.voidCount?state.voidCount+' lost to the void':'';}

  /* ---------- loop ---------- */
  applySun();applyGrav();syncBtns();renderItems();rebuildGhost();setTool(state.tool);sizeView();
  buildIsland(12);
  if(saved&&saved.v===1&&saved.objs&&saved.objs.length)load(saved);else SCENES.playground();
  applyMode();openMenu();
  let last=performance.now(),acc=0,elapsed=0,saveT=0,hovT=0,stillFor=0,stuckTold=false;
  function worldSettled(){for(const o of objs){if(o.dead)continue;if(o.fuse!=null||o.lit!=null)return false;if(o.k==='cannon'&&o.mine&&(o.shots==null||o.shots>0))return false;
    for(const pt of o.parts){const b=pt.body;if(!b||b.type!==DYN)continue;if(b.velocity.norm()>.45||b.angularVelocity.norm()>.9)return false;}}return true;}
  function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;elapsed+=dt;
    if(mode==='campaign'&&camp&&camp.running&&!camp.done&&!state.paused){camp.t-=dt*state.speed;const sec=Math.ceil(camp.t);if(sec!==lastSec){lastSec=sec;if(sec>0)clockTick(sec);}if(camp.t<=0){camp.t=0;lose();}}
    drawClock();
    if(!state.paused){acc+=dt*state.speed;let n=0;while(acc>=STEP&&n<4){simStep(STEP);acc-=STEP;n++;}if(n===4)acc=0;}
    for(const o of objs){for(const pt of o.parts){if(pt.body){pt.mesh.position.copy(pt.body.position);pt.mesh.quaternion.copy(pt.body.quaternion);if(o.k==='pig'){const q=pt.body.quaternion;if(1-2*(q.x*q.x+q.z*q.z)>.75)pt.mesh.rotation.set(0,camAng,0);}}else{pt.mesh.position.copy(o.pos);}}
      const u=o.parts[0].mesh.userData;
      if(o.k==='fan'&&u.blades)u.blades.rotation.z-=dt*(state.paused?0:18*state.speed);
      if(o.k==='spring'&&u.pad){o.squash=Math.max(0,(o.squash||0)-dt*4);u.pad.scale.y=1+o.squash*1.5;}
      if(o.k==='cannon'&&u.barrel){o.recoil=Math.max(0,(o.recoil||0)-dt*3);u.barrel.position.z=-o.recoil*.25;}
      if(o.k==='tornado'){u.spin.rotation.y+=dt*(state.paused?0:5);u.spin.children.forEach((c,k)=>{c.position.y=((k/44*6+elapsed*(state.paused?0:.8))%6);});}
      if(o.k==='hole'){u.ring.rotation.y+=dt*2;o.parts[0].mesh.scale.setScalar(o.size);u.core.scale.setScalar(1+Math.sin(elapsed*6)*.05);}
      if(o.k==='tnt'&&o.fuse!=null){o.mm.emissive.set('#ffffff');o.mm.emissiveIntensity=Math.sin(elapsed*40)>0?.8:0;}
      if(o.k==='rocket'&&u.flame&&u.flame.visible)u.flame.scale.set(1,1+Math.random()*.6,1);
      if((o.k==='hen'||o.k==='duck')&&u.head){const b=o.parts[0].body,sp=Math.hypot(b.velocity.x,b.velocity.z);u.head.position.y=(o.k==='hen'?.3:.2)+(sp>.3?Math.abs(Math.sin(elapsed*12+o.id))*.03:0);}}
    tickTaunt(dt);tickReacts(dt);tickDrama(dt);tickIdle(dt);tickBed(dt);
    if(mode==='campaign'&&camp&&camp.running&&!camp.done&&!state.paused&&!cine&&!drama&&camp.L.pokes>0&&pokesLeft()<=0&&$('modal').hidden){
      if(worldSettled()){stillFor+=dt;if(stillFor>3&&!stuckTold){stuckTold=true;toast('Nothing is moving, and you are out of pokes. Open the menu to retry.',4200);}}
      else stillFor=0;}
    else stillFor=0;
    if(shotWatch){if(mode!=='campaign'||!camp||!camp.running||camp.done){shotWatch=null;placePulse(false);}else if(!state.paused){shotWatch.t+=dt;const v=shotWatch.b.velocity.norm();
      if((shotWatch.t>2.2&&v<.4)||shotWatch.t>6){shotWatch=null;if(objs.some(o=>o.k==='pig'&&!o.dead)&&state.tool!=='place'&&!hasPokeTarget())placePulse(true);}}}
    if(mode!=='campaign'||!camp||camp.done)placePulse(false);
    syncPokeHint();
    if(ghost.visible&&ghost.userData.base){const wg=trayDrag&&trayDrag.active&&!trayDrag.done,t=elapsed;ghost.position.copy(ghost.userData.base);
      if(wg){ghost.position.y+=.22+Math.sin(t*9)*.07;ghost.rotation.set(Math.sin(t*11)*.06,state.rotY+Math.sin(t*7)*.18,Math.sin(t*13)*.1);const sq=1+Math.sin(t*18)*.04;ghost.scale.set(sq,1/sq,sq);}
      else{ghost.rotation.set(0,state.rotY,0);ghost.scale.set(1,1,1);}}
    lampLights.forEach(l=>{if(l.visible&&l.userData.o){const p=mainPos(l.userData.o),b=l.userData.o.parts[0].body;const hp=b.pointToWorldFrame(V(0,1.5,0));l.position.set(hp.x,hp.y,hp.z);}});
    if(beltTex)beltTex.offset.x-=dt*(state.paused?0:6*state.speed);
    flash.intensity=Math.max(0,flash.intensity-dt*10);
    updateParticles(state.paused?0:dt*Math.max(state.speed,.35));
    // camera
    camAng+=(camT-camAng)*Math.min(1,dt*9);
    if(Math.abs(zoomT-camZoom)>.001){camZoom+=(zoomT-camZoom)*Math.min(1,dt*8);sizeView();}
    const fw=new THREE.Vector3(-Math.sin(camAng),0,-Math.cos(camAng)),rt=new THREE.Vector3(Math.cos(camAng),0,-Math.sin(camAng)),sp=dt*8/camZoom;
    if(keys.w||keys.arrowup)panT.addScaledVector(fw,sp);if(keys.s||keys.arrowdown)panT.addScaledVector(fw,-sp);if(keys.d||keys.arrowright)panT.addScaledVector(rt,sp);if(keys.a||keys.arrowleft)panT.addScaledVector(rt,-sp);
    panT.x=clamp(panT.x,-14,14);panT.z=clamp(panT.z,-14,14);pan.lerp(panT,Math.min(1,dt*8));
    shake=Math.max(0,shake-dt*1.2);const sx=shake?rnd(-1,1)*shake*.5:0,sy=shake?rnd(-1,1)*shake*.5:0;
    lookY+=(lookYT-lookY)*Math.min(1,dt*5);const CH=50*Math.cos(camEl),CV=50*Math.sin(camEl);camera.position.set(pan.x+Math.sin(camAng)*CH+sx,CV+sy+(lookY+.5),pan.z+Math.cos(camAng)*CH);camera.lookAt(pan.x+sx,lookY+sy,pan.z);
    groundMesh.position.x=quakeT>0?rnd(-.05,.05):0;
    if(aim){if(aim.phase==='power'){aim.t+=dt;const ph=(aim.t/1.3)%2;aim.power=ph<1?ph:2-ph;}drawAim();}
    if(grab)moveGrab();else if(!aim&&mouse.in&&!down&&(hovT+=dt)>.15){hovT=0;updateHover();}
    hud();
    if((saveT+=dt)>4){saveT=0;if(mode!=='campaign')store.set(serialize());}
    renderer.render(scene,camera);requestAnimationFrame(frame);}
  if(window.claude&&window.claude.hot&&window.claude.hot.snapshot)window.claude.hot.snapshot(()=>({save:serialize()}));
  addEventListener('pagehide',()=>{if(mode!=='campaign')store.set(serialize());});
  window.__tinker={simStep:n=>{for(let k=0;k<n;k++)simStep(STEP);},camera,startLevel:(i,q)=>startLevel(i,q),getCamp:()=>camp,mode:()=>mode,world,objs:()=>objs,addObj,poke:(o)=>poke({point:mainPos(o)},o),detonate,loadScene,state};
  requestAnimationFrame(frame);
}

const hot=window.claude&&window.claude.hot;
if(!window.THREE||!window.CANNON){const t=document.getElementById('toast');t.textContent='Could not load the 3D or physics engine. Check your connection and reload.';t.classList.add('show');}
else if(hot&&hot.ready)hot.ready(boot);else boot((hot&&hot.data)||{});
})();
