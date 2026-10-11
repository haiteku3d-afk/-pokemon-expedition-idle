export const ROUTE_THEMES=[
 {key:'meadow',label:'Pradera',sky:'#a1ce91',back:'#4b8b55',ground:'#83995c'},
 {key:'forest',label:'Bosque',sky:'#385b47',back:'#1b4233',ground:'#597549'},
 {key:'river',label:'Ribera',sky:'#9dbeca',back:'#548c87',ground:'#92a975'},
 {key:'cave',label:'Caverna',sky:'#25263c',back:'#42405c',ground:'#746d7e'},
 {key:'coast',label:'Costa',sky:'#9fd6dd',back:'#4e9cab',ground:'#c7b989'},
 {key:'snow',label:'Cumbre nevada',sky:'#bacede',back:'#7d9daf',ground:'#d5e1e5'},
 {key:'ruins',label:'Santuario',sky:'#b5b29b',back:'#676b5c',ground:'#8c9274'},
 {key:'mountain',label:'Valle dragón',sky:'#a19cb8',back:'#605e84',ground:'#85856a'},
 {key:'temple',label:'Templo',sky:'#504c65',back:'#7b725f',ground:'#a89e77'},
 {key:'astral',label:'Dimensión astral',sky:'#251f4c',back:'#4b377f',ground:'#775b9e'},
 {key:'origin',label:'Origen',sky:'#362c35',back:'#81533e',ground:'#ad8050'}
];
export const damageTone=multiplier=>multiplier>=4?'overwhelming':multiplier>=2?'effective':multiplier<=.1?'minimal':multiplier<1?'resisted':'normal';
export function visibleDamageEvents(events,now){return (events||[]).filter(e=>e.damage>0&&now>=e.at&&now-e.at<1600).slice(-6);}
export function campMotion(id,time){const seed=id*7919,cycle=18000+(id%9)*1300,t=(time+seed)%cycle/cycle;const nodes=[{x:8+seed%19,y:29+seed%20},{x:50+seed%30,y:18+seed%17},{x:56+seed%28,y:58+seed%21},{x:10+seed%28,y:54+seed%19}];const segment=Math.floor(t*4),p=t*4-segment,a=nodes[segment],b=nodes[(segment+1)%4];return {x:a.x+(b.x-a.x)*p,y:a.y+(b.y-a.y)*p,right:b.x>a.x,bob:Math.floor((time+seed)/220)%2*3};}
