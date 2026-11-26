/* play.js: drag (or scroll) to pan the play board.
   Each item sets its spot with data-x, data-y (top-left, in px) and data-w (width).
   Optional data-r tilts it a little. The board size is data-w / data-h on #playWorld. */
(function(){
  var canvas = document.getElementById("playCanvas");
  var world = document.getElementById("playWorld");
  var hint = document.getElementById("playHint");
  if(!canvas || !world) return;
  var W = +world.dataset.w || 2400, H = +world.dataset.h || 1400;
  var phone = window.matchMedia("(max-width:700px)");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var x = 0, y = 0, centered = false;
  var down = false, dragging = false, moved = false, sx = 0, sy = 0, ox = 0, oy = 0;
  var vx = 0, vy = 0, lx = 0, ly = 0, lt = 0, raf = null;

  function place(){
    world.style.width = W + "px"; world.style.height = H + "px";
    world.querySelectorAll(".pl-item").forEach(function(el){
      el.style.left = (+el.dataset.x || 0) + "px";
      el.style.top = (+el.dataset.y || 0) + "px";
      el.style.width = (+el.dataset.w || 400) + "px";
      if(el.dataset.r) el.style.setProperty("--r", el.dataset.r + "deg");
      el.setAttribute("draggable", "false");
    });
  }
  function clamp(){
    var cw = canvas.clientWidth, ch = canvas.clientHeight;
    x = Math.min(0, Math.max(cw - W, x));
    y = Math.min(0, Math.max(ch - H, y));
  }
  function apply(){ clamp(); world.style.transform = "translate3d(" + x + "px," + y + "px,0)"; }
  function center(){
    if(phone.matches || !canvas.clientWidth) return;
    x = (canvas.clientWidth - W) / 2 + (+world.dataset.ox || 0);
    y = (canvas.clientHeight - H) / 2 + (+world.dataset.oy || 0);
    apply(); centered = true;
  }
  function hideHint(){ if(hint) hint.style.opacity = "0"; }

  canvas.addEventListener("pointerdown", function(e){
    if(phone.matches || e.button !== 0) return;
    down = true; dragging = false; moved = false;
    sx = e.clientX; sy = e.clientY; ox = x; oy = y;
    lx = e.clientX; ly = e.clientY; lt = performance.now(); vx = vy = 0;
    if(raf){ cancelAnimationFrame(raf); raf = null; }
  });
  canvas.addEventListener("pointermove", function(e){
    if(!down) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if(!dragging && Math.hypot(dx, dy) > 6){
      dragging = moved = true;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add("dragging"); hideHint();
    }
    if(!dragging) return;
    x = ox + dx; y = oy + dy; apply();
    var now = performance.now(), dt = now - lt;
    if(dt > 0){ vx = (e.clientX - lx) / dt; vy = (e.clientY - ly) / dt; }
    lx = e.clientX; ly = e.clientY; lt = now;
  });
  function end(){
    if(!down) return;
    down = false;
    if(!dragging) return;
    dragging = false; canvas.classList.remove("dragging");
    if(reduce) return;
    var gx = vx * 16, gy = vy * 16;
    (function glide(){
      gx *= 0.92; gy *= 0.92; x += gx; y += gy; apply();
      if(Math.abs(gx) > 0.4 || Math.abs(gy) > 0.4) raf = requestAnimationFrame(glide); else raf = null;
    })();
  }
  canvas.addEventListener("pointerup", end);
  canvas.addEventListener("pointercancel", end);
  /* a drag should never also open a link */
  canvas.addEventListener("click", function(e){ if(moved){ e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  /* trackpad / wheel: pans the board, and hands off to the page once the board hits an edge */
  canvas.addEventListener("wheel", function(e){
    if(phone.matches) return;
    var px = x, py = y;
    x -= e.deltaX; y -= e.deltaY; apply();
    if(x !== px || y !== py){ e.preventDefault(); hideHint(); }
  }, {passive:false});

  canvas.addEventListener("keydown", function(e){
    var k = {ArrowLeft:[120,0], ArrowRight:[-120,0], ArrowUp:[0,120], ArrowDown:[0,-120]}[e.key];
    if(!k) return;
    x += k[0]; y += k[1]; apply(); hideHint(); e.preventDefault();
  });

  place();
  /* the play tab starts hidden, so center the board the first time it's visible */
  if("ResizeObserver" in window){
    new ResizeObserver(function(){ if(!centered) center(); else apply(); }).observe(canvas);
  }
  window.addEventListener("resize", function(){ if(centered) apply(); });
  center();
})();
