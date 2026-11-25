/* footer.js: the postcard footer, shared by every page.
   On any page, add  <div id="site-footer"></div>  where the footer goes,
   then  <script src="footer.js"></script>  right after it.
   Edit the footer markup here once, and every page updates. */
(function(){
  var mount = document.getElementById("site-footer");
  if(!mount) return;
  mount.outerHTML = `<footer class="pc-footer" id="footer">
  <div class="pc-card">
    <div class="pc-left">
      <div>
        <p class="pc-k">A note from Navyaa</p>
        <p class="pc-quote">Good design gets the message where it needs to go.</p>
      </div>
      <div class="pc-links">
        <div>
          <p>Say hi</p>
          <a href="mailto:navyaa.vemuri@gmail.com">Email</a>
          <a href="https://linkedin.com/in/navyaavemuri" target="_blank" rel="noopener">LinkedIn</a>
          <a href="resume.pdf" target="_blank">Resume</a>
        </div>
        <nav aria-label="Footer pages">
          <p>Pages</p>
          <a href="portfolio.html#work">Work</a>
          <a href="portfolio.html#play">Play</a>
          <a href="portfolio.html#about">About</a>
        </nav>
      </div>
    </div>
    <div class="pc-divider" aria-hidden="true"></div>
    <div class="pc-right">
      <div class="pc-top">
        <div class="pc-postmark" id="pcPostmark" aria-hidden="true"></div>
        <img src="stamp.png" alt="Navyaa's hydrangea stamp" class="pc-stamp">
      </div>
      <div>
        <p class="pc-k">From: you</p>
        <div class="pc-line"><canvas id="sigCanvas" aria-label="Sign here with your cursor or finger"></canvas></div>
        <div class="pc-line2" aria-hidden="true"></div>
        <div class="pc-meta"><span id="pcStatus" aria-live="polite">Sign with your cursor or finger</span><button id="freshBtn" type="button">Fresh postcard ↻</button></div>
      </div>
    </div>
  </div>
  <div class="pc-bottom"><span>© 2026 Navyaa Vemuri</span><span>Postcard CA-2026-006</span></div>
</footer>`;

  /* On the homepage, the Pages links switch tabs instead of reloading */
  var tabs = document.querySelectorAll(".tab[data-tab]");
  if(tabs.length){
    var map = {work:"#collection", play:"#play", about:"#about"};
    document.querySelectorAll('.pc-footer nav a').forEach(function(a){
      var key = a.getAttribute("href").split("#")[1];
      a.setAttribute("href", map[key] || a.getAttribute("href"));
      a.addEventListener("click", function(e){
        var tab = document.querySelector('.tab[data-tab="' + key + '"]');
        if(tab){ e.preventDefault(); tab.click(); }
      });
    });
  }
})();

/* POSTCARD FOOTER: sign once, and your signature + first-signed postmark are still here next visit */
(function(){
  const canvas = document.getElementById("sigCanvas");
  const postmark = document.getElementById("pcPostmark");
  const status = document.getElementById("pcStatus");
  const freshBtn = document.getElementById("freshBtn");
  if(!canvas || !canvas.getContext) return;
  const KEY = "nv_postcard"; // same key as before, so existing signatures carry over
  const MO = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const MO_LONG = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const ctx = canvas.getContext("2d");
  let drawing = false, last = null, nibW = 2.4, hasInk = false, finalizeT = null, state = null;

  const todayISO = () => { const d = new Date(), p = n => String(n).padStart(2,"0"); return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate()); };
  const load = () => { try{ return JSON.parse(localStorage.getItem(KEY)) || null; }catch(e){ return null; } };
  const save = () => { try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} };

  function pmSVG(iso){
    const ink = "#2E44C9";
    return '<svg width="150" height="90" viewBox="0 0 150 90"><defs><path id="pmArc" d="M 45 14 A 31 31 0 1 1 44.9 14"/></defs>'
      + '<g fill="none" stroke="'+ink+'" stroke-width="1.4"><circle cx="45" cy="45" r="42"/><circle cx="45" cy="45" r="31"/>'
      + '<path d="M94 30 q9 -7 18 0 t18 0"/><path d="M94 45 q9 -7 18 0 t18 0"/><path d="M94 60 q9 -7 18 0 t18 0"/></g>'
      + '<text font-family="DM Sans,sans-serif" font-size="7.2" letter-spacing="1.6" fill="'+ink+'"><textPath href="#pmArc">NAVYAA VEMURI \u00B7 CALIFORNIA</textPath></text>'
      + '<text x="45" y="43" text-anchor="middle" font-size="9" letter-spacing="1" font-family="DM Sans,sans-serif" fill="'+ink+'">'+MO[+iso.slice(5,7)-1]+' '+iso.slice(8,10)+'</text>'
      + '<text x="45" y="55" text-anchor="middle" font-size="9" letter-spacing="1" font-family="DM Sans,sans-serif" fill="'+ink+'">'+iso.slice(0,4)+'</text></svg>';
  }
  function setStatus(){
    if(!state || !state.sig){ status.textContent = "Sign with your cursor or finger"; return; }
    const f = state.first, n = (state.visits||[]).length;
    status.textContent = "Signed " + MO_LONG[+f.slice(5,7)-1] + " " + (+f.slice(8,10)) + ", " + f.slice(0,4) + (n > 1 ? " · Visit " + n : "");
  }
  function stamp(iso, animate){
    postmark.innerHTML = pmSVG(iso);
    if(animate) requestAnimationFrame(() => postmark.classList.add("is-stamped"));
    else postmark.classList.add("is-stamped");
  }
  function ink(){ ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(20,24,43,.92)"; }
  function size(){
    const r = canvas.getBoundingClientRect();
    if(!r.width || !r.height) return;
    const dpr = window.devicePixelRatio || 1;
    let snap = null;
    if(hasInk){ snap = document.createElement("canvas"); snap.width = canvas.width; snap.height = canvas.height; snap.getContext("2d").drawImage(canvas,0,0); }
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    ctx.setTransform(dpr,0,0,dpr,0,0); ink();
    if(snap) ctx.drawImage(snap,0,0,r.width,r.height);
  }
  const pos = e => { const r = canvas.getBoundingClientRect(); return {x:e.clientX-r.left, y:e.clientY-r.top, t:performance.now()}; };
  function finalize(){
    if(!hasInk) return;
    const r = canvas.getBoundingClientRect();
    const first = !(state && state.sig);
    if(first) state = {first: todayISO(), visits: [todayISO()]};
    state.sig = canvas.toDataURL("image/png"); state.w = r.width; state.h = r.height;
    save();
    if(first) stamp(state.first, true);
    setStatus();
  }

  canvas.addEventListener("pointerdown", e => { clearTimeout(finalizeT); drawing = true; canvas.setPointerCapture(e.pointerId); last = pos(e); nibW = 2.4; e.preventDefault(); });
  canvas.addEventListener("pointermove", e => {
    if(!drawing || !last) return;
    const p = pos(e), speed = Math.hypot(p.x-last.x, p.y-last.y) / Math.max(p.t-last.t, 1);
    nibW += (Math.max(1.1, 2.7 - speed*1.4) - nibW) * 0.3;
    ctx.lineWidth = nibW; ctx.beginPath(); ctx.moveTo(last.x,last.y); ctx.lineTo(p.x,p.y); ctx.stroke();
    last = p;
    if(!hasInk){ hasInk = true; freshBtn.classList.add("is-visible"); }
  });
  const end = () => { if(drawing && hasInk){ clearTimeout(finalizeT); finalizeT = setTimeout(finalize, 900); } drawing = false; last = null; };
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);

  freshBtn.addEventListener("click", () => {
    const r = canvas.getBoundingClientRect();
    ctx.clearRect(0,0,r.width,r.height);
    hasInk = false; state = null; clearTimeout(finalizeT);
    try{ localStorage.removeItem(KEY); }catch(e){}
    postmark.classList.remove("is-stamped"); postmark.innerHTML = "";
    freshBtn.classList.remove("is-visible"); setStatus();
  });

  size();
  state = load();
  if(state && state.sig){
    if(!Array.isArray(state.visits)) state.visits = [state.first || todayISO()];
    if(state.visits.indexOf(todayISO()) === -1){ state.visits.push(todayISO()); save(); }
    const img = new Image();
    img.onload = () => {
      const r = canvas.getBoundingClientRect();
      const w = state.w || r.width, h = state.h || r.height, sc = Math.min(r.width/w, r.height/h, 1);
      ctx.drawImage(img, 0, 0, w*sc, h*sc);
      hasInk = true; freshBtn.classList.add("is-visible");
    };
    img.src = state.sig;
    stamp(state.first || todayISO(), false);
  }
  setStatus();
  let rt = null;
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(size, 150); });
})();
