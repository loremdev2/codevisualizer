import { toPng } from "html-to-image";

import { explainStep } from "@/lib/explain-step";
import type { VisualStep } from "@/types/visualizer";

export type HtmlReportData = {
  algorithmName: string;
  language: string;
  inputText: string;
  code: string;
  steps: VisualStep[];
  resultText: string;
  runDurationMs: number | null;
  seekToStep: (index: number) => Promise<void>;
};

const MAX_SCREENSHOTS = 80;
const RENDER_DELAY = 100;

export async function generateHtmlReport(data: HtmlReportData): Promise<void> {
  const {
    algorithmName,
    language,
    inputText,
    code,
    steps,
    resultText,
    runDurationMs,
    seekToStep,
  } = data;

  if (!steps.length) return;

  const indices = getScreenshotIndices(steps);

  const screenshots = new Map<number, string>();
  const vizEl = document.querySelector<HTMLElement>(
    '[aria-label="Visualization"]',
  );

  if (vizEl) {
    for (const idx of indices) {
      await seekToStep(idx);
      await new Promise((r) => setTimeout(r, RENDER_DELAY));
      try {
        const dataUrl = await toPng(vizEl, {
          pixelRatio: 1,
          backgroundColor: "hsl(0 0% 100%)",
        });
        screenshots.set(idx, dataUrl);
      } catch {
        // Skip failed captures
      }
    }
    await seekToStep(steps.length - 1);
  }

  const stepLog = steps.map((step, i) => {
    const prev = i > 0 ? steps[i - 1] : undefined;
    const explanation = explainStep(step, prev);
    const note = step.note && step.note !== explanation ? step.note : "";
    return {
      index: i,
      title: step.title ?? "Step",
      note,
      explanation: explanation ?? "",
      hasScreenshot: screenshots.has(i),
      line: step.line,
    };
  });

  const screenshotData = Array.from(screenshots.entries())
    .map(([idx, dataUrl]) => ({ idx, dataUrl }))
    .sort((a, b) => a.idx - b.idx);

  const finalOps = steps[steps.length - 1]?.ops;
  const html = buildHtml({
    algorithmName,
    language,
    inputText,
    code,
    resultText,
    runDurationMs,
    totalSteps: steps.length,
    finalOps,
    stepLog,
    screenshotData,
  });

  const slug = algorithmName
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `dsa-lab-${slug || "run"}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getScreenshotIndices(steps: VisualStep[]): number[] {
  if (steps.length <= MAX_SCREENSHOTS) {
    return steps.map((_, i) => i);
  }
  const step = Math.ceil(steps.length / MAX_SCREENSHOTS);
  const indices: number[] = [];
  for (let i = 0; i < steps.length; i += step) {
    indices.push(i);
  }
  if (indices[indices.length - 1] !== steps.length - 1) {
    indices.push(steps.length - 1);
  }
  return indices;
}

function buildHtml(opts: {
  algorithmName: string;
  language: string;
  inputText: string;
  code: string;
  resultText: string;
  runDurationMs: number | null;
  totalSteps: number;
  finalOps?: { comparisons: number; swaps: number; writes: number };
  stepLog: Array<{
    index: number;
    title: string;
    note: string;
    explanation: string;
    hasScreenshot: boolean;
    line?: number;
  }>;
  screenshotData: Array<{ idx: number; dataUrl: string }>;
}): string {
  const {
    algorithmName,
    language,
    inputText,
    code,
    resultText,
    runDurationMs,
    totalSteps,
    finalOps,
    stepLog,
    screenshotData,
  } = opts;

  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const codeLines = code.split("\n");
  const codeHtml = codeLines
    .map(
      (line, i) =>
        `<div class="cl" data-ln="${i + 1}"><span class="ln">${i + 1}</span><span class="lc">${esc(line)}</span></div>`,
    )
    .join("");

  const screenshotJson = JSON.stringify(screenshotData);

  // Build step items with kind badges
  const KIND_COLORS: Record<string, string> = {
    Branch: "#f59e0b",
    Return: "#14b8a6",
    Call: "#3b82f6",
    Line: "#06b6d4",
    Start: "#10b981",
    Console: "#8b5cf6",
    Load: "#0ea5e9",
    Trace: "#64748b",
  };

  const stepLogHtml = stepLog
    .map((s) => {
      const kind = s.title.split(" ")[0] || "Step";
      const color = KIND_COLORS[kind] || "#64748b";
      return (
        `<div class="si${s.hasScreenshot ? " ss" : ""}" data-step="${s.index}">` +
        `<div class="si-dot" style="background:${color}"></div>` +
        `<div class="si-body">` +
        `<div class="si-head"><span class="si-num">${s.index + 1}</span><span class="si-kind" style="color:${color}">${esc(kind)}</span>` +
        `${s.note ? `<span class="si-note">${esc(s.note.length > 40 ? s.note.slice(0, 38) + "…" : s.note)}</span>` : ""}` +
        `</div>` +
        `${s.explanation ? `<div class="si-explain">${esc(s.explanation)}</div>` : ""}` +
        `</div>` +
        `</div>`
      );
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(algorithmName)} — Visualization Report</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%;overflow:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#09090b;color:#e4e4e7}

/* ── Header ── */
.hdr{height:48px;padding:0 16px;border-bottom:1px solid #27272a;display:flex;align-items:center;gap:12px;background:#09090b;flex-shrink:0}
.hdr h1{font-size:14px;font-weight:600;color:#fafafa;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hdr-meta{margin-left:auto;display:flex;gap:14px;font-size:11px;color:#71717a;flex-shrink:0}
.hdr-meta .dot{width:3px;height:3px;border-radius:50%;background:#3f3f46;align-self:center}

/* ── Main grid ── */
.main{display:flex;flex:1;min-height:0;height:calc(100% - 48px)}

/* ── Sidebar ── */
.side{width:280px;min-width:180px;max-width:500px;display:flex;flex-direction:column;border-right:1px solid #27272a;background:#09090b;flex-shrink:0;position:relative}
.side-hdr{padding:10px 12px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#52525b;border-bottom:1px solid #27272a;display:flex;align-items:center;justify-content:space-between}
.side-hdr .count{background:#27272a;color:#a1a1aa;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600}
.step-list{flex:1;overflow-y:auto;overflow-x:hidden;padding:4px 0;scrollbar-width:thin;scrollbar-color:#27272a transparent}
.step-list::-webkit-scrollbar{width:5px}
.step-list::-webkit-scrollbar-thumb{background:#27272a;border-radius:3px}

/* Step items */
.si{display:flex;align-items:flex-start;gap:8px;padding:6px 12px;cursor:pointer;transition:background .12s;border-left:2px solid transparent;position:relative}
.si:hover{background:#18181b}
.si.active{background:#18181b;border-left-color:#3b82f6}
.si.active .si-body{opacity:1}
.si-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:5px;opacity:.7}
.si.active .si-dot{opacity:1;box-shadow:0 0 6px currentColor}
.si-body{min-width:0;flex:1}
.si-head{display:flex;align-items:center;gap:6px;min-width:0}
.si-num{font-size:10px;font-weight:700;color:#52525b;min-width:18px;text-align:right;font-variant-numeric:tabular-nums}
.si.active .si-num{color:#3b82f6}
.si-kind{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
.si-note{font-size:10px;color:#52525b;margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px}
.si-explain{font-size:11px;color:#71717a;margin-top:1px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.si.active .si-explain{color:#a1a1aa}

/* ── Resize handle ── */
.rh{width:5px;cursor:col-resize;background:transparent;position:relative;z-index:10;flex-shrink:0;transition:background .15s}
.rh:hover,.rh.dragging{background:#3b82f6}
.rh::after{content:'';position:absolute;top:50%;left:50%;width:1px;height:24px;background:#52525b;transform:translate(-50%,-50%);border-radius:1px;transition:background .15s}
.rh:hover::after,.rh.dragging::after{background:#3b82f6}

/* ── Center ── */
.center{flex:1;display:flex;flex-direction:column;min-width:0}

/* ── Explain bar ── */
.expl{padding:8px 14px;border-bottom:1px solid #27272a;font-size:12px;color:#a1a1aa;display:flex;align-items:center;gap:8px;background:#09090b;flex-shrink:0;min-height:36px}
.expl-tag{font-size:9px;font-weight:800;text-transform:uppercase;padding:2px 6px;border-radius:3px;letter-spacing:.04em}

/* ── Viz area ── */
.viz{flex:1;display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto;position:relative;background:#09090b}
.viz img{max-width:100%;max-height:100%;border-radius:6px;border:1px solid #27272a;object-fit:contain;transition:opacity .2s}
.viz-empty{color:#52525b;text-align:center;padding:40px}
.viz-empty .icon{font-size:40px;margin-bottom:8px;opacity:.5}
.viz-empty .hint{font-size:13px;margin-top:4px}
.viz-pill{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:rgba(24,24,27,.92);backdrop-filter:blur(8px);border:1px solid #3f3f46;border-radius:8px;padding:6px 14px;font-size:11px;color:#a1a1aa;display:flex;align-items:center;gap:10px;pointer-events:none;transition:opacity .2s}
.viz-pill .badge{background:#3b82f6;color:#fff;padding:2px 8px;border-radius:4px;font-weight:700;font-size:10px}

/* ── Controls ── */
.ctrl{display:flex;align-items:center;gap:6px;padding:8px 14px;border-top:1px solid #27272a;background:#09090b;flex-shrink:0}
.ctrl button{background:#18181b;border:1px solid #27272a;color:#d4d4d8;padding:5px 12px;border-radius:6px;font-size:12px;cursor:pointer;transition:all .12s;line-height:1}
.ctrl button:hover{background:#27272a;border-color:#3f3f46}
.ctrl button:active{transform:scale(.96)}
.ctrl button:disabled{opacity:.3;cursor:default;transform:none}
.ctrl button.pri{background:#3b82f6;border-color:#3b82f6;color:#fff}
.ctrl button.pri:hover{background:#2563eb}
.ctrl .spacer{flex:1}
.prog{flex:1;height:3px;background:#27272a;border-radius:2px;cursor:pointer;position:relative;margin:0 8px}
.prog-fill{height:100%;background:#3b82f6;border-radius:2px;transition:width .12s}
.prog:hover .prog-fill{height:5px;margin-top:-1px}
.ctr{font-size:11px;color:#52525b;font-variant-numeric:tabular-nums;min-width:70px;text-align:right;white-space:nowrap}
.kbd{display:inline-block;padding:1px 5px;border:1px solid #3f3f46;border-radius:3px;font-size:9px;color:#71717a;background:#18181b;font-family:monospace;line-height:1.4}

/* ── Code panel ── */
.code-wrap{border-top:1px solid #27272a;display:flex;flex-direction:column;background:#09090b}
.code-resize{height:5px;cursor:row-resize;position:relative;z-index:10;flex-shrink:0}
.code-resize:hover{background:#3b82f6}
.code-hdr{padding:4px 14px;font-size:10px;font-weight:600;color:#52525b;border-bottom:1px solid #27272a;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.code-hdr button{background:none;border:none;color:#52525b;cursor:pointer;font-size:10px;padding:2px 6px;border-radius:3px}
.code-hdr button:hover{background:#27272a;color:#a1a1aa}
.code-body{overflow:auto;max-height:200px;scrollbar-width:thin;scrollbar-color:#27272a transparent}
.code-body::-webkit-scrollbar{width:5px;height:5px}
.code-body::-webkit-scrollbar-thumb{background:#27272a;border-radius:3px}
.code-body pre{margin:0;padding:8px 0;font-family:'SF Mono','Fira Code','Cascadia Code','JetBrains Mono',monospace;font-size:11.5px;line-height:1.65;counter-reset:line}
.cl{padding:0 14px 0 0;display:flex}
.cl:hover{background:#18181b}
.cl.hi .lc{background:rgba(59,130,246,.12);border-left:2px solid #3b82f6;margin-left:-2px}
.ln{display:inline-block;width:42px;text-align:right;padding-right:14px;color:#3f3f46;user-select:none;flex-shrink:0}
.lc{color:#a1a1aa;white-space:pre}
.cl.hi .ln{color:#3b82f6}
.cl.hi .lc{color:#e4e4e7}
</style>
</head>
<body>

<div class="hdr">
  <h1>${esc(algorithmName)}</h1>
  <div class="hdr-meta">
    <span>${esc(language)}</span>
    <span class="dot"></span>
    <span>${totalSteps} steps</span>
    ${runDurationMs != null ? `<span class="dot"></span><span>${(runDurationMs / 1000).toFixed(1)}s</span>` : ""}
    ${finalOps ? `<span class="dot"></span><span>${finalOps.comparisons} cmp · ${finalOps.swaps} swp · ${finalOps.writes} wrt</span>` : ""}
  </div>
</div>

<div class="main" id="main">
  <div class="side" id="sidebar">
    <div class="side-hdr">
      <span>Steps</span>
      <span class="count">${totalSteps}</span>
    </div>
    <div class="step-list" id="stepList">
${stepLogHtml}
    </div>
  </div>
  <div class="rh" id="resizeSide"></div>

  <div class="center">
    <div class="expl" id="explBar">
      <span class="expl-tag" style="background:#10b98120;color:#10b981">Start</span>
      <span>Press <span class="kbd">→</span> or click Play to begin</span>
    </div>

    <div class="viz" id="vizArea">
      <div class="viz-empty" id="vizEmpty">
        <div class="icon">📊</div>
        <div class="hint">Press <span class="kbd">→</span> or <span class="kbd">Space</span> to step through the algorithm</div>
        <div style="margin-top:6px;font-size:11px;color:#3f3f46">${esc(resultText)}</div>
      </div>
      <img id="vizImg" style="display:none" alt="Visualization" />
      <div class="viz-pill" id="vizPill" style="display:none">
        <span class="badge" id="pillBadge">1</span>
        <span id="pillTitle">Start</span>
      </div>
    </div>

    <div class="ctrl">
      <button id="bFirst" title="First (Home)">⏮</button>
      <button id="bPrev" title="Previous (←)">◀</button>
      <button id="bPlay" class="pri" title="Play / Pause (Space)">▶</button>
      <button id="bNext" title="Next (→)">▶</button>
      <button id="bLast" title="Last (End)">⏭</button>
      <div class="prog" id="progBar">
        <div class="prog-fill" id="progFill" style="width:0%"></div>
      </div>
      <div class="ctr" id="ctrText">0 / ${totalSteps}</div>
    </div>

    <div class="code-wrap" id="codeWrap">
      <div class="code-resize" id="resizeCode"></div>
      <div class="code-hdr">
        <span>Source Code · ${esc(language)}</span>
        <button id="toggleCode" title="Toggle code panel">▾</button>
      </div>
      <div class="code-body" id="codeBody">
        <pre id="codeBlock">${codeHtml}</pre>
      </div>
    </div>
  </div>
</div>

<script>
(function(){
var T=${totalSteps};
var SS=${screenshotJson};
var SL=${JSON.stringify(stepLog)};
var sm={};SS.forEach(function(s){sm[s.idx]=s.dataUrl});

var cur=-1,playing=false,timer=null;

// DOM refs
var vizImg=document.getElementById('vizImg');
var vizEmpty=document.getElementById('vizEmpty');
var vizPill=document.getElementById('vizPill');
var pillBadge=document.getElementById('pillBadge');
var pillTitle=document.getElementById('pillTitle');
var explBar=document.getElementById('explBar');
var stepList=document.getElementById('stepList');
var progFill=document.getElementById('progFill');
var ctrText=document.getElementById('ctrText');
var bPlay=document.getElementById('bPlay');
var codeBody=document.getElementById('codeBody');
var codeBlock=document.getElementById('codeBlock');

// ── Go to step ──
function goTo(idx){
  if(idx<0||idx>=T)return;
  cur=idx;

  // Find nearest screenshot
  var img=sm[idx];
  if(!img){var best=-1;for(var k in sm){var n=parseInt(k);if(n<=idx&&n>best)best=n}img=best>=0?sm[best]:null}

  if(img){vizImg.src=img;vizImg.style.display='block';vizEmpty.style.display='none';vizPill.style.display='flex'}
  else{vizImg.style.display='none';vizEmpty.style.display='block';vizPill.style.display='none'}

  var log=SL[idx];
  pillBadge.textContent=idx+1;
  pillTitle.textContent=log?(log.title+(log.note?' — '+log.note:'')):'Step '+(idx+1);

  if(log){
    var kind=log.title.split(' ')[0]||'Step';
    var colors={Branch:'#f59e0b',Return:'#14b8a6',Call:'#3b82f6',Line:'#06b6d4',Start:'#10b981',Console:'#8b5cf6',Load:'#0ea5e9',Trace:'#64748b'};
    var c=colors[kind]||'#64748b';
    explBar.innerHTML='<span class="expl-tag" style="background:'+c+'20;color:'+c+'">'+ek(kind)+'</span><span>'+ek(log.explanation||log.note||'')+'</span>';
  }

  // Sidebar
  var items=stepList.querySelectorAll('.si');
  for(var i=0;i<items.length;i++){var s=parseInt(items[i].dataset.step);items[i].classList.toggle('active',s===idx)}
  var act=stepList.querySelector('.si.active');
  if(act)act.scrollIntoView({block:'nearest',behavior:'smooth'});

  progFill.style.width=((idx+1)/T*100)+'%';
  ctrText.textContent=(idx+1)+' / '+T;

  document.getElementById('bFirst').disabled=idx===0;
  document.getElementById('bPrev').disabled=idx===0;
  document.getElementById('bNext').disabled=idx>=T-1;
  document.getElementById('bLast').disabled=idx>=T-1;

  // Highlight code line
  var lineNums=codeBlock.querySelectorAll('.cl');
  for(var j=0;j<lineNums.length;j++)lineNums[j].classList.remove('hi');
  if(log&&log.line!=null){
    var target=codeBlock.querySelector('[data-ln="'+log.line+'"]');
    if(target){target.classList.add('hi');target.scrollIntoView({block:'center',behavior:'smooth'})}
  }
}

function ek(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}

// ── Sidebar clicks ──
stepList.addEventListener('click',function(e){var it=e.target.closest('.si');if(it)goTo(parseInt(it.dataset.step))});

// ── Nav buttons ──
document.getElementById('bFirst').onclick=function(){goTo(0)};
document.getElementById('bPrev').onclick=function(){goTo(cur-1)};
document.getElementById('bNext').onclick=function(){goTo(cur+1)};
document.getElementById('bLast').onclick=function(){goTo(T-1)};

// ── Progress scrub ──
document.getElementById('progBar').addEventListener('click',function(e){
  var r=this.getBoundingClientRect();
  goTo(Math.round((e.clientX-r.left)/r.width*(T-1)));
});

// ── Play/Pause ──
bPlay.onclick=function(){playing?stop():start()};
function start(){playing=true;bPlay.textContent='⏸';if(cur>=T-1)cur=-1;tick()}
function stop(){playing=false;bPlay.textContent='▶';clearTimeout(timer)}
function tick(){if(!playing)return;if(cur>=T-1){stop();return}goTo(cur+1);timer=setTimeout(tick,500)}

// ── Keyboard ──
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  switch(e.key){
    case'ArrowRight':e.preventDefault();goTo(cur+1);break;
    case'ArrowLeft':e.preventDefault();goTo(cur-1);break;
    case' ':e.preventDefault();bPlay.onclick();break;
    case'Home':e.preventDefault();goTo(0);break;
    case'End':e.preventDefault();goTo(T-1);break;
  }
});

// ── Draggable sidebar resize ──
var resizeSide=document.getElementById('resizeSide');
var sidebar=document.getElementById('sidebar');
var dragging=false,dragStartX=0,dragStartW=0;
resizeSide.addEventListener('mousedown',function(e){
  e.preventDefault();dragging=true;dragStartX=e.clientX;dragStartW=sidebar.offsetWidth;
  resizeSide.classList.add('dragging');
  document.body.style.cursor='col-resize';document.body.style.userSelect='none';
});
document.addEventListener('mousemove',function(e){
  if(!dragging)return;
  var w=Math.max(160,Math.min(500,dragStartW+(e.clientX-dragStartX)));
  sidebar.style.width=w+'px';
});
document.addEventListener('mouseup',function(){
  if(!dragging)return;dragging=false;
  resizeSide.classList.remove('dragging');
  document.body.style.cursor='';document.body.style.userSelect='';
});

// ── Code panel resize ──
var resizeCode=document.getElementById('resizeCode');
var codeWrap=document.getElementById('codeWrap');
var codeOpen=true,codeDrag=false,codeStartY=0,codeStartH=0;
resizeCode.addEventListener('mousedown',function(e){
  e.preventDefault();codeDrag=true;codeStartY=e.clientY;codeStartH=codeBody.offsetHeight;
  document.body.style.cursor='row-resize';document.body.style.userSelect='none';
});
document.addEventListener('mousemove',function(e){
  if(!codeDrag)return;
  var h=Math.max(60,Math.min(500,codeStartH-(e.clientY-codeStartY)));
  codeBody.style.maxHeight=h+'px';
});
document.addEventListener('mouseup',function(){
  if(!codeDrag)return;codeDrag=false;
  document.body.style.cursor='';document.body.style.userSelect='';
});
document.getElementById('toggleCode').onclick=function(){
  codeOpen=!codeOpen;
  codeBody.style.display=codeOpen?'block':'none';
  this.textContent=codeOpen?'▾':'▸';
};
})();
</script>
</body>
</html>`;
}
