#!/usr/bin/env python3
"""chain.py "METHOD /path" [...] — the DRAWN backend chain of an endpoint on the committed gustify
example map (what the Gabe Universe station walks today = the BEFORE picture). Pure read.
Sources: c4-graph.js (endpoint node · touches/consumes/resp · writes_to/reads_from rollup · bridge)
         levels.json (fn_nodes handler/role/d2w/access · fn_edges calls).
Prints: screens that fetch it · handler · BFS hops over drawn `calls` (each fn: role, d2w, access ops
→ models) · the endpoint's schema wires · the rollup. `--all` lists every endpoint label."""
import json,re,sys,collections
EX='/home/khujta/projects/gabe_lens/templates/center/shell/example/codebase-graph-station'
c4=json.loads(re.search(r'window\.GABE_C4\s*=\s*(\{.*?\});\s*\n',open(EX+'/c4-graph.js').read(),re.S).group(1))
lv=json.load(open(EX+'/levels.json'))
NODES={}; HOME={}
for ent,blk in c4['l2'].items():
    for n in blk['nodes']: NODES[n['id']]=n; HOME[n['id']]=ent
OUT=collections.defaultdict(list); IN=collections.defaultdict(list)
for ent,blk in c4['l2'].items():
    for e in blk['edges']: OUT[e['source']].append((e['kind'],e['target'])); IN[e['target']].append((e['kind'],e['source']))
for e in c4['cross_edges']:
    OUT[e['from']].append((e.get('kind','fk'),e['to'])); IN[e['to']].append((e.get('kind','fk'),e['from']))
FN={f['id']:f for f in lv['fn_nodes']}
CALLS=collections.defaultdict(list)
for e in lv['fn_edges']: CALLS[e['s']].append((e['t'],e['conf']))
if '--all' in sys.argv:
    for i in sorted(NODES):
        if i.startswith('endpoint:'): print(i[9:], '·', HOME[i])
    sys.exit()
def fnline(fid,hop,via):
    f=FN.get(fid)
    if not f: return f"{'  '*hop}h{hop} {fid}  (NOT DRAWN — no fn node)"
    acc=f.get('access') or {}; ops=acc.get('ops') or []
    w=[o['model'] for o in ops if o['rw']=='w']; r=[o['model'] for o in ops if o['rw']=='r']
    d2w=f.get('d2w'); tag=f"d2w={d2w}" if d2w is not None else "d2w=–"
    s=f"{'  '*hop}h{hop} {f['name']} [{f['role']} · {tag} · {f['slug']}{' · '+via if via else ''}]"
    if w: s+=f"  → WRITES {w}"
    if r: s+=f"  ← reads {r}"
    if acc.get('commits'): s+="  (commits)"
    return s
for label in [a for a in sys.argv[1:] if not a.startswith('--')]:
    eid='endpoint:'+label
    if eid not in NODES: print('NO SUCH ENDPOINT:',label,'(try --all)'); continue
    n=NODES[eid]; print(f"\n=== {label} · entity {HOME[eid]} · resp={n.get('resp')} · behind={ (n.get('behind') or {}).get('fns','–') } fns/depth {(n.get('behind') or {}).get('depth','–')}")
    scr=[s for k,s in IN[eid] if k=='bridge']; print('  screens →', [s.split('/')[-1] for s in scr] or 'none bridged')
    mw=(n.get('det') or {}).get('middleware') or n.get('middleware'); 
    if mw: print('  gates (names only):', mw)
    fn_key=n.get('fn'); file=((n.get('det') or {}).get('file') or '').split(':')[0]
    hid=(file+'#'+fn_key) if (fn_key and file and (file+'#'+fn_key) in FN) else None
    if not hid and fn_key:
        cand=[f['id'] for f in lv['fn_nodes'] if f.get('handler') and f['name']==fn_key]; hid=cand[0] if cand else None
    if not hid: print('  handler: NOT DRAWN (fn =',fn_key,')')
    else:
        seen={hid:0}; q=[(hid,0,'')]
        print('  chain (drawn calls BFS):')
        while q:
            cur,h,via=q.pop(0); print('   '+fnline(cur,h,via))
            for t,conf in sorted(CALLS[cur]):
                if t not in seen and h<8: seen[t]=h+1; q.append((t,h+1,conf))
        print(f"  fns drawn on chain: {len(seen)}")
    sch=[(k,t) for k,t in OUT[eid] if t.startswith('schema:')]; print('  schema wires:', [(k,t[7:]) for k,t in sch])
    roll=[(k,t) for k,t in OUT[eid] if k in('writes_to','reads_from')]; print('  rollup:', [(k,t[6:]) for k,t in roll])
