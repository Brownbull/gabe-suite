#!/usr/bin/env node
/* gen-robot.js — THE ROBOT: the endpoint form's parts in request order, each condition with the coverage a test gives it.
   Reads _lab-ep.js (window.LABEP.forms); writes robot.json for data-atlas.html. Run from the repo root:
     node docs/design/workflow-panel/gen-robot.js docs/design/workflow-panel/robot.json
   States: covered (a case proves status+detail or the service raise) · partial (status only / ambiguous) · untested · unmeasured (no test can assert it) · gap (a finding). */
const fs=require("fs"); const s=fs.readFileSync("docs/design/workflow-panel/_lab-ep.js","utf8"); const window={}; eval(s); const F=window.LABEP, fm=F.forms, ep=fm.endpoint;
function cov(tests){ tests=tests||[]; if(!tests.length) return {state:"untested", cases:[]};
  const strong=tests.filter(t=>/detail|raises/.test(t.conf||"")); const cases=[...new Set(tests.map(t=>t.case))];
  return { state: strong.length?"covered":"partial", cases, conf:[...new Set(tests.map(t=>t.conf))] }; }
const exits=fm.exits, byId=Object.fromEntries(exits.map(e=>[e.id,e]));
const cond=(id,label,sub,c,slot,extra)=>Object.assign({id,label,sub,slot,cov:c},extra||{});
const NM={state:"unmeasured",cases:[]};
const L=[];
L.push({ key:"edge", slot:["K3 rate","U3 guards"], name:"EDGE", plain:"the checks every request meets before the door — the app band", stage:"middleware",
  conds: exits.filter(e=>e.phase==="middleware").map(e=>cond(e.id, e.status+" "+(e.detail||""), e.via||e.pred||"", cov(e.tests), "K3", {kind:"exit"}))
    .concat((fm.switches||[]).filter(w=>w.kind==="flag").map(w=>cond(w.id,"flag "+Object.keys(w.settings||{}).join(" · "),"decides whether the limiter runs at all", NM, "U8", {kind:"switch"}))) });
L.push({ key:"gate", slot:["K2 auth","U3 guards","U8 switches"], name:"GATE", plain:"who may knock — the scheme, the verifier and what the dependency provisions", stage:"security · dependency",
  conds: exits.filter(e=>e.phase==="security"||e.phase==="dependency").map(e=>cond(e.id, e.status+" "+(e.detail||""), e.via||"", cov(e.tests), "K2", {kind:"exit"}))
    .concat((fm.switches||[]).filter(w=>w.kind==="binding").flatMap(w=>(w.branches||[]).map((b,i)=>cond(w.id+":"+i,"verifier "+b.impl,b.pred||"", NM, "U8", {kind:"switch-arm"}))))
    .concat((fm.auth.provisions||[]).map((p,i)=>cond("prov:"+i,"provision "+p.op+" "+p.table, p.state+" at "+p.committed_at, NM, "K2", {kind:"effect"}))) });
L.push({ key:"input", slot:["schema cases","K1 declared"], name:"INPUT", plain:"the body — can it be read, does it fit the shape", stage:"body-parse · validation",
  conds: exits.filter(e=>e.phase==="body-parse"||e.phase==="validation").map(e=>cond(e.id, e.status+" "+(e.detail||e.code||""), e.via||e.source||"", cov(e.tests), e.phase==="validation"?"schema":"K1", {kind:"exit"})) });
const handlerExits=exits.filter(e=>e.phase==="handler"&&e.kind!=="success"), succ=exits.filter(e=>e.kind==="success");
L.push({ key:"handler", slot:["U3 guards","U7 refusals","U6 paths","U11 failure"], name:"HANDLER", plain:"the door’s own decisions — its guards, the calls it makes, the arms it takes, the exceptions it catches", stage:"handler",
  conds: handlerExits.map(e=>cond(e.id, e.status+" "+(e.detail||""), e.via||e.pred||"", cov(e.tests), "U7", {kind:"exit"}))
    .concat((fm.branches||[]).map(b=>{ const p=(fm.paths||[]).find(p=>p.kind==="success"&&((b.token&&p.names.token===b.token)||(!b.token&&p.names.token==="fall-through"))); return cond(b.id,"arm "+(p?p.names.drawn:(b.token||"fall-through")), b.pred||"the fall-through", p?cov(p.tests):{state:"untested",cases:[]}, "U6", {kind:"branch"}); }))
    .concat((fm.failure.catches||[]).map(c=>{ const ans=c.answers||[]; const e=exits.find(x=>ans.includes(x.status)&&x.phase==="handler"); return cond(c.id,"catch "+(c.types||[]).join(", "), c.outcome+(ans.length?" → "+ans.join(", "):""), e?cov(e.tests):NM, "U11", {kind:"catch"}); })) });
const refusalWrites=(fm.arm_findings.effects||[]).filter(f=>f.id==="refusal-writes");
L.push({ key:"effects", slot:["U9 effects","U12 repeat"], name:"EFFECTS", plain:"what the door writes, and what happens to the writes on each ending", stage:"handler → exit",
  conds: [cond("eff:commit","commit on success", fm.paths.filter(p=>p.kind==="success").map(p=>p.names.drawn+" "+p.effects.n.committed).join(" · "), NM, "U9", {kind:"effect"}),
          cond("eff:rollback","rollback on refusal", fm.paths.filter(p=>p.effects.n.rolled_back).map(p=>p.names.drawn+" "+p.effects.n.rolled_back).join(" · ")||"none", NM, "U9", {kind:"effect"}),
          cond("eff:refusal-writes","a refusal that still writes", refusalWrites.map(f=>f.paths.join(", ")).join(" · ")||"none", refusalWrites.length?{state:"gap",cases:[]}:NM, "U9", {kind:"finding"})]
    .concat((fm.repeat.claims||[]).map((c,i)=>cond("claim:"+i,"claim "+c.table+" ("+c.race+")", (c.idioms||[]).join(", ")+" · "+c.constraint, NM, "U12", {kind:"race"}))) });
L.push({ key:"answer", slot:["K4 responses","K1 declared"], name:"ANSWER", plain:"what the caller gets — the body per ending, and what the door promised", stage:"exit",
  conds: succ.map(e=>cond(e.id, e.status+" "+((e.response||{}).model||"success"), ((e.response||{}).fields||[]).length+" fields", cov(e.tests), "K4", {kind:"exit"}))
    .concat([cond("k1","declared vs produced", "declares "+(fm.declared.success||{}).status+" · produces "+[...new Set(exits.filter(e=>e.status).map(e=>e.status))].sort().join(" "), {state:(ep.findings||[]).some(f=>f.id==="undeclared")?"gap":"covered", cases:[]}, "K1", {kind:"contract"})]) });
L.push({ key:"uncaught", slot:["U11 failure"], name:"UNCAUGHT", plain:"the 500 — anything nobody caught, possible at any step", stage:"anywhere",
  conds: exits.filter(e=>e.phase==="uncaught").map(e=>cond(e.id, e.status+" uncaught", "starlette ServerErrorMiddleware", cov(e.tests), "U11", {kind:"exit"})) });
const rs=(fm.frontend.reason_sites||[]), rf=(fm.frontend.findings||[]);
L.push({ key:"client", slot:["frontend reason"], name:"CLIENT", plain:"the screen that reads the answer — can it tell the endings apart", stage:"after the exit",
  conds: rs.map(r=>cond(r.id,"reads "+r.reads+" "+(r.value||""), (r.piece||"").split("#").pop(), {state: r.classified?"covered":"gap", cases:[]}, "reason", {kind:"client"}))
    .concat(rf.map(f=>cond("rf:"+f.site, f.id+" "+f.status, (f.details||[]).join(" vs "), {state:"gap",cases:[]}, "reason", {kind:"finding"}))) });
const tally=lv=>lv.conds.reduce((a,c)=>{a[c.cov.state]=(a[c.cov.state]||0)+1;return a;},{});
L.forEach(l=>l.tally=tally(l));
const out={ door:F.identity.label, head:F.head, levels:L, states:{covered:"a case proves it — the status and the detail, or the service raise", partial:"a case reaches the status only, or the join is ambiguous", untested:"no case reaches it", unmeasured:"no test can assert it today — effects, switch arms, provisions, races", gap:"a contract or client gap the forms found"}, cases:Object.fromEntries((fm.paths||[]).flatMap(p=>p.tests||[]).map(t=>[t.case,{name:t.name,file:t.file,state:t.state}])) };
fs.writeFileSync(process.argv[2], JSON.stringify(out)); L.forEach(l=>console.log(l.name.padEnd(9), JSON.stringify(l.tally), "|", l.conds.map(c=>c.label).join(" · ").slice(0,140)));
