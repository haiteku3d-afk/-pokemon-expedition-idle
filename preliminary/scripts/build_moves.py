import csv,json,pathlib
p=pathlib.Path(__file__).resolve().parents[1];d=p/'data/moves';d.mkdir(parents=True,exist_ok=True)
import urllib.request
for name in ['moves','pokemon_moves','move_meta','move_meta_stat_changes','move_names']:
 if not (d/(name+'.csv')).exists():urllib.request.urlretrieve('https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'+name+'.csv',d/(name+'.csv'))
def rows(n):return list(csv.DictReader(open(d/(n+'.csv'))))
def num(r,k,default=0):return int(r[k]) if r.get(k) else default
names={num(r,'move_id'):r['name'] for r in rows('move_names') if r['local_language_id']=='7'}
meta={num(r,'move_id'):r for r in rows('move_meta')};changes={}
for r in rows('move_meta_stat_changes'):changes.setdefault(num(r,'move_id'),[]).append([num(r,'stat_id'),num(r,'change')])
moves=[]
for r in rows('moves'):
 id=num(r,'id');m=meta.get(id,{});klass=num(r,'damage_class_id');typ=num(r,'type_id');power=10 if klass==1 else num(r,'power',50)
 moves.append(dict(id=id,name=names.get(id,r['identifier']),key=r['identifier'],type=typ,category=2 if klass==2 else 3 if klass==3 else 2 if typ in [1,2,3,5,6,7,9] else 3,power=power if power>0 else 50,adapted=klass==1,accuracy=num(r,'accuracy',100),priority=num(r,'priority'),target=num(r,'target_id'),ailment=num(m,'meta_ailment_id'),ailmentChance=num(m,'ailment_chance'),flinch=num(m,'flinch_chance'),statChance=num(m,'stat_chance'),changes=changes.get(id,[]),drain=num(m,'drain'),healing=num(m,'healing'),crit=num(m,'crit_rate'),minHits=num(m,'min_hits',1),maxHits=num(m,'max_hits',1)))
latest={};raw={}
for r in rows('pokemon_moves'):
 if r['pokemon_move_method_id']!='1':continue
 pid=num(r,'pokemon_id');group=num(r,'version_group_id');latest[pid]=max(latest.get(pid,0),group);raw.setdefault((pid,group),{})[num(r,'move_id')]=num(r,'level')
catalog=json.loads((p/'catalog.json').read_text());missing=[]
for mon in catalog:
 learn=raw.get((mon['id'],latest.get(mon['id'])),{});mon['learnset']=sorted([[lv,id] for id,lv in learn.items()],key=lambda x:(x[0],x[1]));mon['learnsetVersion']=latest.get(mon['id'])
 if not mon['learnset']:missing.append(mon['name']);mon['learnset']=[[1,165]]
(p/'catalog.json').write_text(json.dumps(catalog,separators=(',',':')))
(p/'moves.json').write_text(json.dumps(moves,separators=(',',':'),ensure_ascii=False))
print('Movements:',len(moves),'species learnsets:',len(catalog),'fallback:',missing)
