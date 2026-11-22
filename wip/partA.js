const DB=5200;/* batas lunak ±5,2 km (jauh melewati panjang tali). TIDAK ada tembok/tepi: medan dihasilkan tanpa batas oleh fungsi deterministik dari SATU seed (WORLD_SEED) -> semua pemain melihat laut dalam yang sama */
const DCS=64,DCN=44,DCV=3.5,DWM=-400;/* chunk 64 m, 44 segmen, radius muat 3,5 chunk, lantai terdalam -400 */
const DEEP={on:false,busy:false,built:false,was:false,gh:null,fld:null,g:new THREE.Group(),jel:[],ang:[],wh:[],lf:null,fx:[],iso:[],sq:[],dc:0,kp:[],md:[],amb:null,vt:null,
  ch:new Map(),dat:new Map(),dirty:false,vdirty:false,need:[],lcx:1e9,lcz:1e9,pc:new Map(),pt:0};
DEEP.g.visible=false;S.add(DEEP.g);
const dClock=()=>(Date.now()%1e7)/1e3;
Object.defineProperty(window,'__deepOn',{get:()=>DEEP.on});
const DGR=new Map(),DEMPTY=[],DGH=(x,z)=>DEEP.on?DEEP.gh(x,z):fh(x,z);
const dKey=(cx,cz)=>(cx+4096)*8192+(cz+4096),dgK=(a,b)=>(a+8192)*16384+(b+8192);
/* hitbox benda dihasilkan per chunk (data murni, tanpa mesh) -> tali & pemain selalu punya rintangan walau chunk visual belum dimuat */
function dgNear(x,z){const cx=Math.floor(x/DCS),cz=Math.floor(z/DCS);let D=DEEP.dat.get(dKey(cx,cz));if(!D)D=dData(cx,cz);if(!D.nb)dNeigh(D);
  return DGR.get(dgK(Math.floor(x/16),Math.floor(z/16)))||DEMPTY}
function addCol(o,rad){const x0=Math.floor((o.x-rad)/16),x1=Math.floor((o.x+rad)/16),z0=Math.floor((o.z-rad)/16),z1=Math.floor((o.z+rad)/16);
  for(let a=x0;a<=x1;a++)for(let b=z0;b<=z1;b++){const k=dgK(a,b);let l=DGR.get(k);if(!l)DGR.set(k,l=[]);l.push(o)}}
const FADE=$('fade');
function fade(v,ms){return new Promise(r=>{FADE.style.transitionDuration=(ms/1000)+'s';FADE.style.opacity=v;setTimeout(r,ms)})}
const _dm=new THREE.Object3D(),_dc=new THREE.Color(),_dcv=new THREE.Vector3(),_dk1=new THREE.Color(),_dk2=new THREE.Color(),_dv3=new THREE.Vector3(),_de=new THREE.Euler();

/* ===== MEDAN LAUT DALAM v4: TANPA BATAS, deterministik (hash integer + noise nilai, seed = WORLD_SEED) =====
   Landas pasir -> lereng -> dataran lumpur (makin dalam makin jauh dari kapal: cekungan abisal s/d -230 m, zona hadal s/d -400 m);
   gunung laut (seamount) naik dari dataran; jaringan PALUNG = tepi diagram Voronoi yang dibengkokkan (domain warp) -> palung bercabang & bersambung,
   dinding berundak; kaldera (kawah bisa berlava) & sinkhole per sel 320 m; retakan magma. SATU fungsi DEEP.fld dipakai fisika, tali, fauna, mesh & aset. */
const dsm=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
const DPL=-112;
const dHash=(a,b,s)=>{let h=Math.imul(a|0,0x27d4eb2d)^Math.imul(b|0,0x165667b1)^Math.imul((s+WORLD_SEED)|0,0x9e3779b1);h=Math.imul(h^(h>>>15),0x85ebca6b);h=Math.imul(h^(h>>>13),0xc2b2ae35);return((h^(h>>>16))>>>0)/4294967296};
const dNz=(x,z,s)=>{const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz),a=dHash(ix,iz,s),b=dHash(ix+1,iz,s),c=dHash(ix,iz+1,s),d=dHash(ix+1,iz+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v};
const dst=t=>{const s=t*3,f=Math.floor(s),fr=s-f;return Math.min(1,(f+dsm(.5,1,fr))/3)};
/* 3 titik situs terdekat pada sel Voronoi (kuadrat jarak + koordinat) */
const _dv={f1:0,f2:0,f3:0,x1:0,z1:0,x2:0,z2:0,x3:0,z3:0};
function dVor(x,z,cs,sd){const gx=Math.floor(x/cs),gz=Math.floor(z/cs),o=_dv;let f1=1e18,f2=1e18,f3=1e18,x1=0,z1=0,x2=0,z2=0,x3=0,z3=0;
  for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const cx=gx+a,cz=gz+b,sx=(cx+.12+.76*dHash(cx,cz,sd))*cs,sz=(cz+.12+.76*dHash(cx,cz,sd+7))*cs,dx=x-sx,dz=z-sz,d=dx*dx+dz*dz;
    if(d<f1){f3=f2;x3=x2;z3=z2;f2=f1;x2=x1;z2=z1;f1=d;x1=sx;z1=sz}else if(d<f2){f3=f2;x3=x2;z3=z2;f2=d;x2=sx;z2=sz}else if(d<f3){f3=d;x3=sx;z3=sz}}
  o.f1=f1;o.f2=f2;o.f3=f3;o.x1=x1;o.z1=z1;o.x2=x2;o.z2=z2;o.x3=x3;o.z3=z3;return o}
/* jarak (m) ke tepi sel Voronoi terdekat setelah dibengkokkan = jarak ke sumbu palung */
function dTrU(x,z,cs,sd,wa){const wx=x+(dNz(x*.0061,z*.0061,sd+3)-.5)*wa,wz=z+(dNz(x*.0061+17.3,z*.0061-9.1,sd+4)-.5)*wa,v=dVor(wx,wz,cs,sd);
  const l2=Math.hypot(v.x2-v.x1,v.z2-v.z1)||1,l3=Math.hypot(v.x3-v.x1,v.z3-v.z1)||1;return Math.min((v.f2-v.f1)/(2*l2),(v.f3-v.f1)/(2*l3))}
/* fitur per sel 320 m (kaldera & sinkhole). Pusat >=70 m dari batas sel & radius <=57 m -> cukup cek sel sendiri */
const dFtC=new Map();
function dFeat(cx,cz){const k=dKey(cx,cz);let f=dFtC.get(k);if(f)return f;f={c:null,k:null};const h=s=>dHash(cx,cz,s);
  if(h(51)<.55){const x=(cx+.22+.56*h(52))*320,z=(cz+.22+.56*h(53))*320,R=34+20*h(54);if(Math.hypot(x-BOAT.x,z-BOAT.z)>170)f.c=[x,z,R,34+26*h(55),R*.3,16+12*h(56),h(57)<.5?1:0]}
  if(h(61)<.42){const x=(cx+.2+.6*h(62))*320,z=(cz+.2+.6*h(63))*320,R=10+16*h(64);if(Math.hypot(x-BOAT.x,z-BOAT.z)>150)f.k=[x,z,R,22+14*h(65)]}
  dFtC.set(k,f);return f}
/* o.h = tinggi lantai, o.lv = intensitas lava 0..1, o.rim = kedekatan dengan bibir palung 0..1 */
DEEP.fld=(x,z,o)=>{
  const bx=x-BOAT.x,bz=z-BOAT.z,r=Math.sqrt(bx*bx+bz*bz),sl=dsm(30,170,r);let lv=0,rim=0;
  let h=-31+(DPL+31)*sl;
  h+=(1-sl)*(Math.sin(x*.07+1.3)*Math.cos(z*.06)*2.4+Math.sin(x*.19-z*.15)*.7)+sl*(Math.sin(x*.03+2)*Math.cos(z*.026)*.9+Math.sin(x*.09+z*.07)*.25);
  if(sl>0){const fr=dsm(380,2200,r);
    h-=sl*fr*(24+92*dNz(x*.0011,z*.0011,5));
    h-=dsm(1800,4600,r)*(30+50*dNz(x*.0007,z*.0007,9));
    const sm=dsm(.58,.8,dNz(x*.0032,z*.0032,6)*.65+dNz(x*.0091,z*.0091,7)*.35);
    h+=dsm(110,260,r)*sm*(30+22*dNz(x*.0021,z*.0021,8)+55*fr)}
  const ft=dFeat(Math.floor(x/320),Math.floor(z/320));
  if(ft.c){const q=ft.c,dx=x-q[0],dz=z-q[1],R=q[2]*1.05;if(dx*dx+dz*dz<R*R){const d=Math.sqrt(dx*dx+dz*dz),rm=1-dsm(q[4]*.5,q[4]*1.9,d);
    h+=q[3]*(1-dsm(q[4]*.6,q[2],d))-q[5]*(1-dsm(0,q[4],d))+2.4*rm*Math.sin(Math.atan2(dz,dx)*9+d*.35)+1.1*Math.sin(x*.8)*Math.sin(z*.7)*rm;
    if(q[6])lv=Math.max(lv,(1-dsm(q[4]*.35,q[4]*.95,d))*.95)}}
  if(ft.k){const q=ft.k,dx=x-q[0],dz=z-q[1],R=q[2]*1.3;if(dx*dx+dz*dz<R*R)h-=q[3]*(1-dsm(q[2]*.55,q[2]*1.25,Math.sqrt(dx*dx+dz*dz)+Math.sin(x*.5+z*.4)*.8))}
  const trf=dsm(70,150,r);
  if(trf>0){let cut=0;const rg=Math.sin(x*.37+Math.sin(z*.21)*1.7)*1.3+Math.sin(z*.43-x*.19+1.3)*1.1+Math.sin((x+z)*.9)*.5;
    const a1=dsm(.4,.58,dNz(x*.0019,z*.0019,22))*trf;
    if(a1>0){const W=11+10*dNz(x*.0027,z*.0027,23),w=W*.27,D=36+42*dNz(x*.0023,z*.0023,24),u=dTrU(x,z,540,21,90)+rg,q=Math.min(1,Math.max(0,(u-w)/(W-w)));
      cut=D*a1*(1-dst(q));lv=Math.max(lv,dsm(.56,.7,dNz(x*.0021,z*.0021,25))*a1*(1-dsm(.5,3.4,u))*.9);const e=(u-W*1.15)/(W*.45);rim=a1*Math.exp(-e*e)}
    const a2=dsm(.45,.62,dNz(x*.0028,z*.0028,32))*trf;
    if(a2>0){const W=5+4*dNz(x*.0031,z*.0031,33),w=W*.3,D=12+20*dNz(x*.0029,z*.0029,34),u=dTrU(x,z,235,31,60)+rg*.5,q=Math.min(1,Math.max(0,(u-w)/(W-w))),c=D*a2*(1-dst(q));
      if(c>cut)cut=c;const e=(u-W*1.2)/(W*.5);rim=Math.max(rim,.6*a2*Math.exp(-e*e))}
    const a3=dsm(.55,.7,dNz(x*.0034,z*.0034,42))*trf;
    if(a3>0){const u=dTrU(x,z,150,41,40)+rg*.2,q=Math.min(1,Math.max(0,(u-.55)/1.95)),c=3.2*a3*(1-dst(q));if(c>cut)cut=c;lv=Math.max(lv,a3*(1-dsm(.2,2.2,u)))}
    h-=cut}
  o.h=Math.max(h,DWM);o.lv=lv;o.rim=rim;return o};
const _dfo={h:0,lv:0,rim:0};
DEEP.gh=(x,z)=>{DEEP.fld(x,z,_dfo);return _dfo.h};
