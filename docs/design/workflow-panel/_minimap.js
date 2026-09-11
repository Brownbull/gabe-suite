/* ═══════════════════════════════════════════════════════════════════════════
   THE MINIMAP — the station's missing where-instrument (census F8).

   This file is the RENDER, written the way it would be written inside
   gabe-universe.html: camera-basis projection, rotate-the-POINTS, a frustum
   footprint quad, and a click that pans without spinning the view.

   What is REAL here:
     · the projection math (three.js Spherical convention: theta = atan2(x, z))
     · the frustum-plane intersection, including the tMax clamp and the
       away-from-plane degeneracy guard
     · the inverse mapping used by the click (exact round trip)
     · RENT[e] = (30 + 9*sqrt(count)) * 1.4        — gabe-universe.html:1919
     · the entity roster + piece counts             — the frozen example feed
       (9 backend L1 + 11 fe homes appended at :1294 = 20 entities)
     · the extent, computed the way __uniCamFit computes it at :1891-1892:
         maxR = max over _ents of hypot(EX,EY,EZ) + RENT[e]*1.6

   What is SIMULATED here, and only here:
     · the anchors themselves. The live station reads _npos (:5166, rebuilt on
       every engine tick) — settled 3D force output. This page cannot run
       d3-force-3d, so it uses the station's own SEED: the Fibonacci sphere at
       r=300 that recomputeEX("force") starts from (:1855-1870), times SEP=1.85.
       Same shape family, no invented coordinates.
   ═══════════════════════════════════════════════════════════════════════════ */

/* the real roster: slug, piece count, colour. Backend counts are l2 node counts;
   fe-home counts are fe piece counts. Colours are _C4.colors verbatim; a paired
   fe home wears its twin lerped 0.38 toward white (gabe-universe.html:1296). */
var MM_ENTS = [
  { slug:"allergen",       n:11,  col:"#3f6d4c" },
  { slug:"auth",           n:18,  col:"#5a53a8" },
  { slug:"cooking",        n:51,  col:"#0d6e78" },
  { slug:"legal-consent",  n:10,  col:"#0f766e" },
  { slug:"pantry",         n:81,  col:"#b45309" },
  { slug:"progression",    n:19,  col:"#8e4585" },
  { slug:"recipe",         n:98,  col:"#3f6d4c" },
  { slug:"settings",       n:16,  col:"#8e4585" },
  { slug:"__unclaimed__",  n:9,   col:"#8a8f98" },
  { slug:"app-shell",      n:92,  col:"#8b5cf6" },
  { slug:"design-system",  n:113, col:"#8b5cf6" },
  { slug:"fe·auth",          n:41,  col:"#9791c6" },
  { slug:"fe·cooking",       n:452, col:"#57a1a8" },
  { slug:"fe·legal-consent", n:13,  col:"#59a49e" },
  { slug:"fe·pantry",        n:190, col:"#cd8a4d" },
  { slug:"fe·recipe",        n:2,   col:"#7ba084" },
  { slug:"fe·settings",      n:33,  col:"#b585ac" },
  { slug:"me",             n:1,   col:"#8b5cf6" },
  { slug:"profile",        n:94,  col:"#8b5cf6" },
  { slug:"shopping",       n:47,  col:"#8b5cf6" }
];

/* the disclosure tiers, verbatim from gabe-universe.html:4268-4272, and the
   MEASURED visible/total census from the headless probe on the example feed. */
var MM_TIERS = [
  { name:"Skeleton",   vis:177,  tot:844  },
  { name:"Surface",    vis:390,  tot:844  },
  { name:"Trace",      vis:761,  tot:1136 },
  { name:"Everything", vis:1397, tot:1644 }
];

/* ── the field: anchors from the station's own force seed, RENT from :1919 ── */
var MM = { th:0.7, phi:1.05, R:900, tgt:{x:0,y:0,z:0}, fov:50, aspect:1.874,
           up:"cam", tier:1, dots:true, y0:0, pts:null, ents:[], maxR:1, orbit:false };

(function seedField(){
  var N = MM_ENTS.length, SEP = 1.85, ga = Math.PI * (3 - Math.sqrt(5));
  var seedn = 11;
  function rnd(){ seedn = (seedn * 1103515245 + 12345) & 0x7fffffff; return seedn / 0x7fffffff; }
  MM_ENTS.forEach(function(e, i){
    var y = 1 - (i / (N - 1)) * 2, rr = Math.sqrt(Math.max(0, 1 - y*y)), a = ga * i;
    e.EX = Math.round(Math.cos(a) * rr * 300 * SEP);
    e.EY = Math.round(y * 300 * SEP * 0.55);          /* the force mode flattens y  */
    e.EZ = Math.round(Math.sin(a) * rr * 300 * SEP);
    e.R  = (30 + 9 * Math.sqrt(e.n)) * 1.4;           /* RENT — gabe-universe:1919 */
  });
  /* __uniCamFit's OWN extent expression, :1891-1892 */
  MM.maxR = 0;
  MM_ENTS.forEach(function(e){
    var a = Math.hypot(e.EX, e.EY, e.EZ) + e.R * 1.6;
    if (a > MM.maxR) MM.maxR = a;
  });
  /* member dots: count-proportional scatter inside RENT. In the station these are
     read straight off _npos and filtered by _nodeVisibleFn(n) (:2556). */
  var xs = [], zs = [], cs = [], ts = [];
  MM_ENTS.forEach(function(e, ei){
    var k = Math.max(2, Math.round(e.n * 0.62));
    for (var i = 0; i < k; i++){
      var u = rnd() * Math.PI * 2, v = Math.pow(rnd(), 0.6) * e.R;
      xs.push(e.EX + Math.cos(u) * v);
      zs.push(e.EZ + Math.sin(u) * v);
      cs.push(ei);
      /* which tier first draws this dot — proportioned to the measured census
         177 / 390 / 761 / 1397 so the map densifies exactly as the field does */
      var q = rnd();
      ts.push(q < 0.13 ? 0 : q < 0.28 ? 1 : q < 0.55 ? 2 : 3);
    }
  });
  MM.pts = { x:new Float32Array(xs), z:new Float32Array(zs),
             c:new Uint8Array(cs), t:new Uint8Array(ts), n:xs.length };
})();

/* ── camera position from (R, phi, theta), three.js Spherical convention ──
   Spherical.setFromCartesianCoords does theta = atan2(x, z), so the inverse is
   x = R sin(phi) sin(th) · y = R cos(phi) · z = R sin(phi) cos(th).           */
function mmCam(){
  var sp = Math.sin(MM.phi), cp = Math.cos(MM.phi);
  return { x: MM.tgt.x + MM.R * sp * Math.sin(MM.th),
           y: MM.tgt.y + MM.R * cp,
           z: MM.tgt.z + MM.R * sp * Math.cos(MM.th) };
}
/* the azimuth the projection rotates by. Computed from the camera about the
   FIELD ORIGIN, never about controls.target — a target that drifts under pan
   would drag the whole map with it. C = {0,0,0} is the station's own field
   origin: __uniCamFit looks at exactly that (:1894).                          */
function mmTheta(){ var P = mmCam(); return Math.atan2(P.x, P.z); }

function mmProject(dx, dz, th, s, cx0, cy0){
  var ct = Math.cos(th), st = Math.sin(th);
  return { x: cx0 + s * (dx * ct - dz * st),
           y: cy0 + s * (dx * st + dz * ct) };
}

/* ── THE RENDER ─────────────────────────────────────────────────────────── */
function mmDraw(cv){
  var dpr = window.devicePixelRatio || 1;
  var W = cv.clientWidth, H = cv.clientHeight;
  if (!W || !H) return;
  if (cv.width !== Math.round(W*dpr) || cv.height !== Math.round(H*dpr)){
    cv.width = Math.round(W*dpr); cv.height = Math.round(H*dpr);
  }
  var g = cv.getContext("2d");
  g.setTransform(dpr,0,0,dpr,0,0);
  g.clearRect(0,0,W,H);

  var cx0 = W/2, cy0 = H/2, mapR = Math.min(W,H)/2 - 3;
  var s = (mapR - 4) / (MM.maxR * 1.06);
  var th = (MM.up === "cam") ? mmTheta() : 0;
  var P = mmCam();

  /* the disc */
  g.save();
  g.beginPath(); g.arc(cx0,cy0,mapR,0,6.2832); g.clip();
  g.fillStyle = "#070c16"; g.fillRect(0,0,W,H);

  /* MEMBER DOTS — batched by entity colour: 20 fillStyle writes, not 1,397.
     Every dot whose tier <= the live tier, mirroring _nodeVisibleFn(n) (:2556). */
  if (MM.dots){
    var p = MM.pts, ct = Math.cos(th), st = Math.sin(th), bucket = [];
    for (var i = 0; i < p.n; i++){
      if (p.t[i] > MM.tier) continue;
      (bucket[p.c[i]] || (bucket[p.c[i]] = [])).push(i);
    }
    for (var b = 0; b < bucket.length; b++){
      if (!bucket[b]) continue;
      g.fillStyle = MM_ENTS[b].col; g.globalAlpha = 0.42;
      g.beginPath();
      for (var j = 0; j < bucket[b].length; j++){
        var k = bucket[b][j], dx = p.x[k], dz = p.z[k];
        var px = cx0 + s*(dx*ct - dz*st), py = cy0 + s*(dx*st + dz*ct);
        g.rect(px-0.9, py-0.9, 1.8, 1.8);
      }
      g.fill();
    }
    g.globalAlpha = 1;
  }

  /* THE VIEWPORT RECTANGLE — the frustum's footprint on the field's mean plane.
     Corner rays D = F + X*(sx*tanH) + Y*(sy*tanV); D.F === 1 exactly because X
     and Y are perpendicular to F, so t is a true view-axis depth and clamps the
     way near/far do. tMax = 2.5 x the distance to the pivot.                    */
  var F = { x:MM.tgt.x-P.x, y:MM.tgt.y-P.y, z:MM.tgt.z-P.z };
  var FL = Math.hypot(F.x,F.y,F.z)||1; F.x/=FL; F.y/=FL; F.z/=FL;
  var X = { x: F.z*0 - F.y*0, y:0, z:0 };
  /* right = cross(F, worldUp) */
  X = { x: F.z, y: 0, z: -F.x };
  var XL = Math.hypot(X.x,X.z)||1; X.x/=XL; X.z/=XL;
  /* camUp = cross(X, F) */
  var Y = { x: X.y*F.z - X.z*F.y, y: X.z*F.x - X.x*F.z, z: X.x*F.y - X.y*F.x };
  var tv = Math.tan(MM.fov * Math.PI / 360), tH = tv * MM.aspect;
  var tMax = 2.5 * MM.R;
  var away = (Math.sign(P.y - MM.y0) === Math.sign(F.y));   /* looking AWAY from the plane */
  var quad = [], ok = !away, clamped = 0;
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(function(sg){
    var D = { x: F.x + X.x*(sg[0]*tH) + Y.x*(sg[1]*tv),
              y: F.y + X.y*(sg[0]*tH) + Y.y*(sg[1]*tv),
              z: F.z + X.z*(sg[0]*tH) + Y.z*(sg[1]*tv) };
    var t = (Math.abs(D.y) > 1e-9) ? (MM.y0 - P.y) / D.y : Infinity;
    if (!(t > 0) || t > tMax){ t = tMax; clamped++; }
    var Hx = P.x + D.x*t, Hz = P.z + D.z*t;
    quad.push(mmProject(Hx, Hz, th, s, cx0, cy0));
  });
  if (ok && clamped < 4){
    g.beginPath();
    g.moveTo(quad[0].x, quad[0].y);
    for (var q = 1; q < 4; q++) g.lineTo(quad[q].x, quad[q].y);
    g.closePath();
    g.fillStyle = "rgba(231,235,243,0.10)"; g.fill();
    g.strokeStyle = "rgba(231,235,243,0.55)"; g.lineWidth = 1; g.stroke();
  } else {
    /* DEGENERACY FALLBACK — the wedge. Horizontal half-FOV is
       atan(tan(fov*pi/360) * aspect), NOT fov*aspect/2 (14% too wide at 50/1.9). */
    var hHalf = Math.atan(tH), Rh = Math.hypot(P.x, P.z);
    var cy = cy0 + Math.min(s*Rh, mapR-6);
    g.beginPath(); g.moveTo(cx0, cy);
    g.arc(cx0, cy, s*MM.R*1.4, -Math.PI/2 - hHalf, -Math.PI/2 + hHalf);
    g.closePath();
    g.fillStyle = "rgba(232,163,61,0.12)"; g.fill();
    g.strokeStyle = "rgba(232,163,61,0.6)"; g.stroke();
  }
  g.restore();

  /* ENTITY DOTS — the "principal entities". Drawn LAST so nothing covers them,
     and drawn at EVERY tier, because a where-instrument that changes with a
     filter is not a where-instrument.                                          */
  var nmax = 0; MM_ENTS.forEach(function(e){ if (e.n > nmax) nmax = e.n; });
  /* FOUR labels, not six: at a 162px disc six slugs collide (measured on the
     example's 20 entities). The rest name themselves on hover, the way SC2's
     minimap names nothing at all and the operator reads position instead. */
  var labelled = MM_ENTS.slice().sort(function(a,b){ return b.n - a.n; }).slice(0,4);
  MM_ENTS.forEach(function(e){
    var pt = mmProject(e.EX, e.EZ, th, s, cx0, cy0);
    var d = Math.hypot(pt.x-cx0, pt.y-cy0);
    var rimTick = d > mapR - 2;
    if (rimTick){ var a = Math.atan2(pt.y-cy0, pt.x-cx0);
      pt = { x: cx0 + Math.cos(a)*(mapR-2), y: cy0 + Math.sin(a)*(mapR-2) }; }
    e.__px = pt.x; e.__py = pt.y;
    var rad = 2.4 + 4.2 * Math.sqrt(e.n) / Math.sqrt(nmax);
    e.__r = rad;
    g.beginPath(); g.arc(pt.x, pt.y, rad, 0, 6.2832);
    g.fillStyle = e.col; g.globalAlpha = rimTick ? 0.55 : 0.95; g.fill();
    g.globalAlpha = 1;
    g.lineWidth = 1; g.strokeStyle = "rgba(8,13,24,0.85)"; g.stroke();
    if (labelled.indexOf(e) >= 0 && !rimTick && rad >= 4){
      g.font = "700 8px Menlo,Consolas,ui-monospace,monospace";
      g.fillStyle = "rgba(231,235,243,0.72)"; g.textAlign = "center";
      g.fillText(e.slug.replace("__",""), pt.x, pt.y - rad - 2.5);
    }
  });

  /* THE CAMERA SQUARE + heading. In camera-basis mode the camera's own ground
     point is ALWAYS on the vertical centreline below centre — u collapses to 0
     by construction, which IS what "the map rotates with us" means. In north-up
     mode it orbits and the heading tick earns its keep.                        */
  var Rh2 = Math.hypot(P.x, P.z);
  var cpt = mmProject(P.x, P.z, th, s, cx0, cy0);
  var cd = Math.hypot(cpt.x-cx0, cpt.y-cy0);
  var pinned = cd > mapR - 7;
  if (pinned){ var a2 = Math.atan2(cpt.y-cy0, cpt.x-cx0);
    cpt = { x: cx0+Math.cos(a2)*(mapR-7), y: cy0+Math.sin(a2)*(mapR-7) }; }
  g.strokeStyle = "#8b83f5"; g.lineWidth = 1.4;
  g.strokeRect(cpt.x-4.5, cpt.y-4.5, 9, 9);
  g.fillStyle = "rgba(139,131,245,0.30)"; g.fillRect(cpt.x-4.5, cpt.y-4.5, 9, 9);
  var hx = (MM.tgt.x - P.x), hz = (MM.tgt.z - P.z), hl = Math.hypot(hx,hz)||1;
  var hp = mmProject(hx/hl*MM.maxR*0.16, hz/hl*MM.maxR*0.16, th, 1, 0, 0);
  g.beginPath(); g.moveTo(cpt.x, cpt.y);
  g.lineTo(cpt.x + hp.x*s, cpt.y + hp.y*s);
  g.strokeStyle = "rgba(139,131,245,0.8)"; g.stroke();

  /* the RETICLE at the pivot — the one cue that a pan happened. When the camera
     orbits an off-origin target the square slides off the centreline and this
     mark shows where it is anchored.                                           */
  var tp = mmProject(MM.tgt.x, MM.tgt.z, th, s, cx0, cy0);
  g.strokeStyle = "rgba(231,235,243,0.45)"; g.lineWidth = 1;
  g.beginPath();
  g.moveTo(tp.x-5, tp.y); g.lineTo(tp.x-1.5, tp.y);
  g.moveTo(tp.x+1.5, tp.y); g.lineTo(tp.x+5, tp.y);
  g.moveTo(tp.x, tp.y-5); g.lineTo(tp.x, tp.y-1.5);
  g.moveTo(tp.x, tp.y+1.5); g.lineTo(tp.x, tp.y+5);
  g.stroke();

  /* the rim + the north tick. Text is drawn in UNROTATED canvas space, which is
     free only because we rotate the POINTS and never the canvas.               */
  g.beginPath(); g.arc(cx0,cy0,mapR,0,6.2832);
  g.strokeStyle = "#2b3650"; g.lineWidth = 1; g.stroke();
  var np = mmProject(0, -MM.maxR, th, (mapR-9)/MM.maxR, cx0, cy0);
  g.font = "800 8px Menlo,Consolas,ui-monospace,monospace";
  g.fillStyle = "rgba(135,148,171,0.85)"; g.textAlign = "center"; g.textBaseline = "middle";
  g.fillText("N", np.x, np.y);
  g.textAlign = "start"; g.textBaseline = "alphabetic";
  return { cx0:cx0, cy0:cy0, s:s, th:th, mapR:mapR };
}

/* ── the inverse: canvas px -> world. Exact round trip (R(-th) undoes R(+th)) ── */
function mmUnproject(px, py, geo){
  var u = (px - geo.cx0) / geo.s, w = (py - geo.cy0) / geo.s;
  var ct = Math.cos(geo.th), st = Math.sin(geo.th);
  return { x:  u*ct + w*st, y: MM.y0, z: -u*st + w*ct };
}
