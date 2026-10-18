(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const story = $("story");
  const sticky = $("sticky");
  const canvas = $("sky");
  const ctx = canvas.getContext("2d");
  const intro = $("intro");
  const captionText = $("captionText");
  const captionKicker = $("captionKicker");
  const chapterKicker = $("chapterKicker");
  const chapterTitle = $("chapterTitle");
  const chapterSub = $("chapterSub");
  const flash = $("flash");
  const evo = $("evo");
  const evoItems = [...evo.querySelectorAll("li")];
  const forge = $("forge");
  const scrollHint = $("scrollHint");
  const stageNum = $("stageNum");
  const stageName = $("stageName");
  const progressNum = $("progressNum");
  const progressFill = $("progressFill");
  const topFill = $("topFill");
  const pageNo = $("pageNo");
  const epoch = $("epoch");
  const live = $("live");
  const railTrack = $("railTrack");
  const industryName = $("industryName");
  const feedList = $("feedList");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CHAPTERS = [
    {
      id: "intro", from: 0, num: "01", name: "Singularity",
      title: "Before the beginning", sub: "Everything waits inside a point of light.",
      epoch: "T + 0 · Singularity",
      caption: "Before anything had a name, everything that would ever exist sat inside a point smaller than a thought."
    },
    {
      id: "bang", from: 0.08, num: "02", name: "Big Bang",
      title: "The first second", sub: "Matter, light, and law rush outward.",
      epoch: "T + 10⁻³⁶ s → 380,000 yr",
      caption: "The point let go. Light ran in every direction, and time started counting."
    },
    {
      id: "cosmos", from: 0.24, num: "03", name: "Cosmos",
      title: "The long dark blooms", sub: "Galaxies wind themselves into being.",
      epoch: "T + 200 Myr → 9 Gyr",
      caption: "Hydrogen learned to burn. Stars forged the dust that later worlds are made of."
    },
    {
      id: "earth", from: 0.42, num: "04", name: "Earth",
      title: "A world cools", sub: "Molten rock settles into an ocean, a sky, and a moon.",
      epoch: "4.54 Gya · Hadean → Archean",
      caption: "Dust gathered, melted, and cooled into a blue world with a moon and a weather system."
    },
    {
      id: "evo", from: 0.58, num: "05", name: "Evolution",
      title: "Life looks up", sub: "From a cell to a hand on a keyboard.",
      epoch: "3.8 Gya → today",
      caption: "Life held on. It swam, walked, stood, and learned to build tools that extend a mind."
    },
    {
      id: "forge", from: 0.76, num: "06", name: "AWXFORGE",
      title: "The workshop", sub: "SaaS 3.0, for every industry.",
      epoch: "2026 · The workshop",
      caption: "AWXFORGE is the workshop. SaaS 3.0 reshapes one core around every industry that steps up to it."
    }
  ];

  const INDUSTRIES = [
    { slug: "manufacturing", nav: ["Floor", "Quality", "Orders", "Crews"], m: ["08", "04", "94%"], feed: ["Checked the line sensor", "Held the late order", "Asked a human for the exception", "Updated the shared board"] },
    { slug: "healthcare", nav: ["Ward", "Labs", "Handoff", "Follow-up"], m: ["12", "07", "97%"], feed: ["Grouped the morning labs", "Flagged a missed handoff", "Drafted the family note", "Left the decision with a nurse"] },
    { slug: "finance", nav: ["Close", "Risk", "Clients", "Audit"], m: ["21", "05", "99%"], feed: ["Matched the stray invoice", "Queued the variance", "Wrote the audit note", "Waited on a human sign-off"] },
    { slug: "logistics", nav: ["Routes", "Yards", "Exceptions", "Docks"], m: ["34", "09", "91%"], feed: ["Slipped the late truck", "Rebooked dock B", "Told the customer", "Kept the timeline honest"] },
    { slug: "energy", nav: ["Assets", "Crews", "Outages", "Grid"], m: ["16", "03", "96%"], feed: ["Spotted the feeder fault", "Dispatched the nearest crew", "Logged the outage window", "Updated the control room"] }
  ];

  /* ---------- helpers ---------- */
  function mulberry32(seed) {
    return function rand() {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(20261018);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const norm = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const fadeIn = (p, a, b) => smooth(norm(p, a, b));
  const fadeOut = (p, a, b) => 1 - smooth(norm(p, a, b));
  const easeOut = (t) => 1 - (1 - t) ** 3;
  const ss = (a, b, x) => smooth(clamp((x - a) / (b - a), 0, 1));

  /* ---------- soft light sprites (additive glow) ---------- */
  const spriteCache = new Map();
  function sprite(rgb) {
    const key = rgb.join();
    let s = spriteCache.get(key);
    if (!s) {
      s = document.createElement("canvas");
      s.width = s.height = 128;
      const g = s.getContext("2d");
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, `rgba(${key},1)`);
      gr.addColorStop(0.16, `rgba(${key},0.6)`);
      gr.addColorStop(0.45, `rgba(${key},0.16)`);
      gr.addColorStop(1, `rgba(${key},0)`);
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
      spriteCache.set(key, s);
    }
    return s;
  }
  function glowAt(rgb, x, y, r, a) {
    if (a <= 0.002 || r <= 0.2) return;
    ctx.globalAlpha = Math.min(a, 1);
    ctx.drawImage(sprite(rgb), x - r, y - r, r * 2, r * 2);
  }

  /* ---------- star field ---------- */
  const STAR_TINTS = ["255,255,255", "190,210,255", "255,226,196", "220,230,255"];
  const stars = Array.from({ length: reduce ? 300 : 900 }, () => {
    const depth = rand();
    return {
      x: rand(), y: rand(),
      s: depth > 0.97 ? 2 : depth > 0.8 ? 1.4 : 1,
      a: 0.25 + rand() * 0.75,
      tw: 0.4 + rand() * 1.8,
      ph: rand() * 6.28,
      d: 0.2 + depth * 0.8,
      c: STAR_TINTS[(rand() * STAR_TINTS.length) | 0]
    };
  });

  /* ---------- big bang particles ---------- */
  const PCOLORS = [[255, 246, 216], [255, 177, 90], [158, 203, 255], [196, 181, 253]];
  const particles = Array.from({ length: reduce ? 90 : 420 }, (_, i) => {
    const heat = rand();
    return {
      ang: rand() * Math.PI * 2,
      maxR: 0.16 + rand() ** 0.65 * 0.95,
      delay: rand() * 0.28,
      size: heat > 0.93 ? 2.4 : 0.8 + rand() * 1.3,
      flatten: 0.76 + rand() * 0.4,
      trail: i % 5 === 0,
      ph: rand() * 6.28,
      tw: 0.6 + rand() * 2.2,
      col: heat > 0.72 ? 0 : heat > 0.4 ? 1 : heat > 0.2 ? 2 : 3
    };
  });
  const PSTYLE = PCOLORS.map((c) => `rgb(${c})`);

  /* ---------- galaxies ---------- */
  function makeGalaxy(arms, n, spinDir) {
    const pts = [];
    for (let a = 0; a < arms; a += 1) {
      const offset = (a / arms) * Math.PI * 2;
      for (let i = 0; i < n; i += 1) {
        const t = i / n;
        const ang = offset + t * 6.4;
        const radius = t ** 0.82 * 170;
        const j = (rand() - 0.5) * (10 + t * 18);
        pts.push({
          x: Math.cos(ang) * radius + j,
          y: Math.sin(ang) * radius * 0.44 + j * 0.35,
          s: (1 - t) * 1.9 + 0.5,
          a: 0.25 + (1 - t) * 0.75,
          c: t < 0.14 ? "255,238,205" : t < 0.5 ? "176,206,255" : "190,170,250",
          haze: rand() < 0.14
        });
      }
    }
    return { pts, spin: spinDir * (0.03 + rand() * 0.04), rot: rand() * Math.PI };
  }
  const galaxies = [
    { ...makeGalaxy(4, reduce ? 90 : 240, 1), nx: 0.02, ny: -0.02, scale: 1.2, start: 0.22 },
    { ...makeGalaxy(3, reduce ? 50 : 140, -1), nx: 0.3, ny: -0.22, scale: 0.55, start: 0.28 },
    { ...makeGalaxy(3, reduce ? 40 : 110, 1), nx: -0.32, ny: 0.2, scale: 0.48, start: 0.3 }
  ];
  const igniters = Array.from({ length: 8 }, () => ({
    nx: rand() * 1.7 - 0.85, ny: rand() * 1.5 - 0.75, delay: rand()
  }));

  /* ---------- accretion debris ---------- */
  const rocks = Array.from({ length: reduce ? 30 : 90 }, () => ({
    ang: rand() * Math.PI * 2,
    orbit: 1.15 + rand() * 1.3,
    size: 2 + rand() * 6,
    wobble: rand() * Math.PI * 2,
    speed: 0.6 + rand() * 0.9
  }));

  /* ---------- procedural planet ---------- */
  function h3(x, y, z) {
    let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967295;
  }
  function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const a = h3(xi, yi, zi), b = h3(xi + 1, yi, zi), c = h3(xi, yi + 1, zi), d = h3(xi + 1, yi + 1, zi);
    const e = h3(xi, yi, zi + 1), f = h3(xi + 1, yi, zi + 1), g = h3(xi, yi + 1, zi + 1), hh = h3(xi + 1, yi + 1, zi + 1);
    const x1 = a + (b - a) * u, x2 = c + (d - c) * u, x3 = e + (f - e) * u, x4 = g + (hh - g) * u;
    const y1 = x1 + (x2 - x1) * v, y2 = x3 + (x4 - x3) * v;
    return y1 + (y2 - y1) * w;
  }
  function fbm(x, y, z, oct) {
    let s = 0, a = 0.5, f = 1;
    for (let i = 0; i < oct; i += 1) {
      s += a * noise3(x * f + i * 17.3, y * f + i * 9.1, z * f + i * 5.7);
      f *= 2.03;
      a *= 0.5;
    }
    return s;
  }

  const TW = 896, TH = 448, SEA = 0.535;
  const tAlb = new Uint8ClampedArray(TW * TH * 3);
  const tSpec = new Uint8Array(TW * TH);
  const tCloud = new Uint8Array(TW * TH);
  const tCity = new Uint8Array(TW * TH);
  const tCrack = new Uint8Array(TW * TH);
  let texRow = 0;
  let texReady = false;

  function genRows() {
    const end = Math.min(TH, texRow + 4);
    for (let j = texRow; j < end; j += 1) {
      const lat = (0.5 - (j + 0.5) / TH) * Math.PI;
      const cl = Math.cos(lat), sl = Math.sin(lat);
      const aLat = Math.abs(lat) / (Math.PI / 2);
      for (let i = 0; i < TW; i += 1) {
        const lon = ((i + 0.5) / TW - 0.5) * Math.PI * 2;
        const x = cl * Math.sin(lon), y = sl, z = cl * Math.cos(lon);
        const idx = j * TW + i;
        const hgt = fbm(x * 2.1 + 11.3, y * 2.1 + 4.7, z * 2.1 + 7.9, 6);
        let r, g, b, spec = 0, city = 0;
        if (hgt < SEA) {
          const depth = clamp((SEA - hgt) / 0.2, 0, 1);
          const k = Math.pow(depth, 0.55);
          r = lerp(24, 3, k); g = lerp(104, 26, k); b = lerp(132, 60, k);
          spec = 255;
        } else {
          const e = clamp((hgt - SEA) / 0.2, 0, 1);
          const m = fbm(x * 3.3 + 31, y * 3.3 + 17, z * 3.3 + 5, 4);
          const wet = ss(0.4, 0.56, m);
          let lr = lerp(176, 48, wet), lg = lerp(146, 82, wet), lb = lerp(100, 40, wet);
          const rock = ss(0.5, 0.8, e);
          lr = lerp(lr, 116, rock); lg = lerp(lg, 108, rock); lb = lerp(lb, 98, rock);
          const snow = ss(0.82, 0.97, e);
          lr = lerp(lr, 240, snow); lg = lerp(lg, 243, snow); lb = lerp(lb, 246, snow);
          const v = 0.82 + noise3(x * 38, y * 38, z * 38) * 0.36;
          r = lr * v; g = lg * v; b = lb * v;
          const cn = fbm(x * 15 + 3, y * 15 + 9, z * 15 + 1, 3);
          if (e < 0.4 && wet > 0.3 && cn > 0.52) city = clamp((cn - 0.52) / 0.16, 0, 1) * 255;
        }
        const edge = 0.83 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.14;
        if (aLat > edge) {
          const ice = ss(edge, edge + 0.05, aLat);
          r = lerp(r, 238, ice); g = lerp(g, 242, ice); b = lerp(b, 247, ice);
          spec *= 1 - ice * 0.8;
          city = 0;
        }
        const cn2 = fbm(x * 2.7 + 51, y * 2.7 + 23, z * 2.7 + 9, 5);
        const rg = 1 - Math.abs(2 * fbm(x * 3.2 + 7, y * 3.2 + 2, z * 3.2 + 13, 4) - 1);
        tAlb[idx * 3] = r; tAlb[idx * 3 + 1] = g; tAlb[idx * 3 + 2] = b;
        tSpec[idx] = spec;
        tCity[idx] = city;
        tCloud[idx] = ss(0.5, 0.7, cn2) * 255;
        tCrack[idx] = ss(0.8, 0.96, rg) * 255;
      }
    }
    texRow = end;
    if (texRow < TH) setTimeout(genRows, 8);
    else texReady = true;
  }
  setTimeout(genRows, reduce ? 0 : 700);

  const SR = 400;
  const sphereCanvas = document.createElement("canvas");
  sphereCanvas.width = sphereCanvas.height = SR;
  const sctx = sphereCanvas.getContext("2d");
  const sImg = sctx.createImageData(SR, SR);
  const sA = new Uint8Array(SR * SR);
  const sRow = new Int32Array(SR * SR);
  const sTx = new Float32Array(SR * SR);
  const sD = new Float32Array(SR * SR);
  const sSpec = new Float32Array(SR * SR);
  const sFres = new Float32Array(SR * SR);
  (function precomputeSphere() {
    const r = SR / 2, tilt = 0.41, cT = Math.cos(tilt), sT = Math.sin(tilt);
    const L = [-0.62, -0.2, 0.76];
    const ll = Math.hypot(L[0], L[1], L[2]);
    L[0] /= ll; L[1] /= ll; L[2] /= ll;
    const H = [L[0], L[1], L[2] + 1];
    const hl = Math.hypot(H[0], H[1], H[2]);
    H[0] /= hl; H[1] /= hl; H[2] /= hl;
    for (let y = 0; y < SR; y += 1) {
      for (let x = 0; x < SR; x += 1) {
        const k = y * SR + x;
        const nx = (x + 0.5 - r) / r, ny = -(y + 0.5 - r) / r;
        const q = nx * nx + ny * ny;
        if (q >= 1) { sA[k] = 0; continue; }
        const nz = Math.sqrt(1 - q);
        sA[k] = clamp((1 - Math.sqrt(q)) * r * 1.1, 0, 1) * 255;
        const px = nx * cT - ny * sT, py = nx * sT + ny * cT;
        const lon = Math.atan2(px, nz);
        const lat = Math.asin(clamp(py, -1, 1));
        sTx[k] = (lon / (Math.PI * 2) + 0.5) * TW;
        sRow[k] = clamp(Math.floor((0.5 - lat / Math.PI) * TH), 0, TH - 1);
        sD[k] = nx * L[0] + ny * L[1] + nz * L[2];
        sSpec[k] = Math.pow(Math.max(nx * H[0] + ny * H[1] + nz * H[2], 0), 52);
        sFres[k] = Math.pow(1 - nz, 2.6);
      }
    }
  })();

  function renderSphere(spinTex, cloudTex, molten, nightK) {
    const data = sImg.data;
    const mo = molten;
    for (let k = 0; k < SR * SR; k += 1) {
      const o = k * 4;
      const a = sA[k];
      if (a === 0) { data[o + 3] = 0; continue; }
      const base = sRow[k] * TW;
      const idx = base + (((sTx[k] - spinTex) % TW + TW) % TW | 0);
      const cidx = base + (((sTx[k] - cloudTex) % TW + TW) % TW | 0);
      const a3 = idx * 3;
      const d = sD[k];
      const dd = clamp((d + 0.07) / 1.07, 0, 1);
      const lit = 0.03 + dd * 1.18;
      let r = (tAlb[a3] * (1 - mo) + 36 * mo) * lit;
      let g = (tAlb[a3 + 1] * (1 - mo) + 26 * mo) * lit;
      let b = (tAlb[a3 + 2] * (1 - mo) + 24 * mo) * lit;
      const cd = (tCloud[cidx] / 255) * (1 - mo) * 0.84;
      const sp = sSpec[k] * (tSpec[idx] / 255) * (1 - mo) * dd * 1.5 * (1 - cd);
      r += 255 * sp; g += 248 * sp; b += 235 * sp;
      const cc = 240 * (0.03 + dd * 1.1);
      r = r * (1 - cd) + cc * cd;
      g = g * (1 - cd) + cc * cd;
      b = b * (1 - cd) + (cc * 1.02) * cd;
      const nl = (1 - ss(-0.04, 0.16, d)) * (tCity[idx] / 255) * (1 - cd) * nightK * (1 - mo);
      r += 255 * nl; g += 186 * nl; b += 96 * nl * 0.7;
      const f = sFres[k];
      const atmo = f * (0.2 + dd * 1.05) * (1 - mo * 0.5);
      r += 62 * atmo; g += 128 * atmo; b += 238 * atmo;
      const tw = Math.exp(-d * d * 80) * f * 0.5;
      r += 230 * tw; g += 110 * tw; b += 50 * tw;
      const lv = (tCrack[idx] / 255) * mo;
      r += 255 * lv * 1.15; g += 92 * lv; b += 16 * lv;
      data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = a;
    }
    sctx.putImageData(sImg, 0, 0);
  }

  const grain = document.createElement("canvas");
  grain.width = grain.height = 180;
  {
    const gg = grain.getContext("2d");
    const img = gg.createImageData(180, 180);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 120 + rand() * 135;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = rand() * 46;
    }
    gg.putImageData(img, 0, 0);
  }
  const grainPattern = ctx.createPattern(grain, "repeat");

  /* ---------- state ---------- */
  let w = 0, h = 0;
  let target = 0, current = 0;
  let time = 0;
  let chapterId = "";
  let running = true;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = sticky.clientWidth;
    h = sticky.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function storyProgress() {
    const total = Math.max(story.offsetHeight - window.innerHeight, 1);
    return clamp(-story.getBoundingClientRect().top, 0, total) / total;
  }
  function pageProgress() {
    const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    return clamp(window.scrollY / max, 0, 1);
  }
  function chapterFor(p) {
    let found = CHAPTERS[0];
    CHAPTERS.forEach((c) => { if (p >= c.from) found = c; });
    return found;
  }
  function jumpTo(p) {
    const total = Math.max(story.offsetHeight - window.innerHeight, 1);
    window.scrollTo({ top: story.offsetTop + total * clamp(p, 0, 0.999), behavior: reduce ? "auto" : "smooth" });
  }
  function burstFlash() {
    if (reduce) return;
    flash.classList.remove("go");
    void flash.offsetWidth;
    flash.classList.add("go");
  }

  /* ---------- chrome / DOM updates ---------- */
  function updateChrome(p) {
    const chapter = chapterFor(p);
    const rect = story.getBoundingClientRect();
    document.body.classList.toggle("in-story", rect.top <= 1 && rect.bottom >= window.innerHeight * 0.92);
    progressFill.style.transform = `scaleY(${p})`;
    topFill.style.transform = `scaleX(${pageProgress()})`;
    progressNum.textContent = p.toFixed(3);
    scrollHint.style.opacity = p < 0.02 ? "1" : "0";
    scrollHint.style.pointerEvents = p < 0.02 ? "auto" : "none";

    const introFade = 1 - fadeIn(p, 0.03, 0.085);
    intro.style.opacity = String(introFade);
    intro.style.transform = `translate(-50%, calc(-54% + ${(1 - introFade) * -22}px))`;

    const evoShow = fadeIn(p, 0.56, 0.63) * fadeOut(p, 0.74, 0.8);
    const evoT = norm(p, 0.575, 0.74);
    evo.style.setProperty("--show", evoShow.toFixed(3));
    evoItems.forEach((item, i) => {
      const step = smooth(clamp((evoT - i * 0.15) / 0.2, 0, 1));
      item.style.setProperty("--step", step.toFixed(3));
      item.classList.toggle("on", step > 0.62);
    });

    const forgeShow = fadeIn(p, 0.76, 0.86);
    forge.style.setProperty("--show", forgeShow.toFixed(3));
    forge.classList.toggle("on", forgeShow > 0.45);

    if (chapter.id !== chapterId) {
      chapterId = chapter.id;
      sticky.dataset.scene = chapter.id;
      stageNum.textContent = chapter.num;
      stageName.textContent = chapter.name;
      chapterKicker.textContent = `[ ${chapter.num} ] ${chapter.name}`;
      chapterTitle.textContent = chapter.title;
      chapterSub.textContent = chapter.sub;
      captionKicker.textContent = `Chapter ${chapter.num} / 06`;
      captionText.textContent = chapter.caption;
      pageNo.textContent = chapter.num;
      epoch.textContent = chapter.epoch;
      live.textContent = `${chapter.name}. ${chapter.caption}`;
      if (chapter.id === "bang" && Math.abs(target - current) < 0.14) burstFlash();
    }
  }

  /* ---------- drawing ---------- */
  function drawBackground(p, cosmosA, earthA) {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#03040a");
    bg.addColorStop(1, "#05060d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "lighter";
    const neb = 0.1 + cosmosA * 0.5;
    glowAt([96, 64, 176], w * 0.74, h * 0.28, Math.max(w, h) * 0.45, 0.2 * neb);
    glowAt([40, 90, 176], w * 0.2, h * 0.72, Math.max(w, h) * 0.4, 0.16 * neb);
    glowAt([150, 62, 120], w * 0.55, h * 0.84, Math.max(w, h) * 0.34, 0.1 * cosmosA);
    glowAt([60, 120, 190], w * 0.5, h * 0.55, Math.max(w, h) * 0.45, 0.1 * earthA);

    const starA = fadeIn(p, 0.06, 0.2);
    if (starA > 0.01) {
      const shift = p * h * 0.06;
      stars.forEach((s) => {
        const tw = 0.6 + Math.sin(time * s.tw + s.ph) * 0.4;
        const y = (((s.y * h - shift * s.d) % h) + h) % h;
        ctx.globalAlpha = s.a * tw * starA * (0.45 + s.d * 0.55);
        ctx.fillStyle = `rgb(${s.c})`;
        ctx.fillRect(s.x * w, y, s.s, s.s);
      });
    }
    ctx.globalAlpha = 1;
  }

  function drawBang(p) {
    const cx = w * 0.5, cy = h * 0.48, diag = Math.hypot(w, h);
    ctx.globalCompositeOperation = "lighter";

    const preA = 1 - smooth(norm(p, 0.035, 0.065));
    if (preA > 0.01) {
      const pulse = 0.88 + Math.sin(time * 2.1) * 0.12;
      glowAt([255, 238, 210], cx, cy, 120 * pulse, 0.5 * preA);
      glowAt([255, 252, 245], cx, cy, 26 * pulse, 0.95 * preA);
      ctx.globalAlpha = 0.5 * preA;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.03);
      ctx.drawImage(sprite([255, 238, 210]), -260, -260, 520, 520);
      ctx.restore();
    }

    const t = p < 0.05 ? 0 : norm(p, 0.05, 0.3);
    if (t <= 0) { ctx.globalAlpha = 1; return; }

    const grow = easeOut(norm(t, 0, 0.5));
    const R = lerp(18, diag * 0.62, grow);
    const a = 1 - smooth(norm(t, 0.18, 0.95));
    const core = 1 - smooth(norm(t, 0.0, 0.45));

    glowAt([120, 70, 170], cx, cy, R * 1.5, 0.28 * a);
    glowAt([255, 140, 70], cx, cy, R * 0.95, 0.5 * a);
    glowAt([255, 214, 150], cx, cy, R * 0.5, 0.75 * a);
    glowAt([255, 250, 238], cx, cy, Math.max(10, R * 0.2), 0.95 * core + 0.1 * a);

    const streak = (1 - smooth(norm(t, 0.08, 0.6))) * 0.75;
    if (streak > 0.01) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.035);
      ctx.globalAlpha = streak;
      ctx.drawImage(sprite([255, 226, 190]), -R * 1.7, -R * 1.7, R * 3.4, R * 3.4);
      ctx.restore();
    }

    for (let i = 0; i < 2; i += 1) {
      const rt = norm(t, 0.04 + i * 0.08, 0.95);
      if (rt <= 0 || rt >= 1) continue;
      const rr = easeOut(rt) * diag * 0.58;
      const ra = (1 - rt) * (i === 0 ? 0.5 : 0.28);
      const gr = ctx.createRadialGradient(cx, cy, rr * 0.9, cx, cy, rr * 1.03);
      gr.addColorStop(0, "rgba(255,220,180,0)");
      gr.addColorStop(0.72, `rgba(255,224,190,${ra})`);
      gr.addColorStop(1, "rgba(255,220,180,0)");
      ctx.globalAlpha = 1;
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, w, h);
    }

    const reach = diag * 0.52;
    const dim = 1 - fadeIn(p, 0.4, 0.5) * 0.55;
    particles.forEach((q) => {
      const local = clamp((t - q.delay) / (1 - q.delay), 0, 1);
      const ex = easeOut(local);
      const dist = ex * q.maxR * reach;
      const tw = 0.55 + Math.sin(time * q.tw + q.ph) * 0.45;
      const x = cx + Math.cos(q.ang) * dist;
      const y = cy + Math.sin(q.ang) * dist * q.flatten;
      ctx.globalAlpha = (0.2 + ex * 0.8) * tw * dim;
      ctx.fillStyle = PSTYLE[q.col];
      if (q.trail && ex > 0.06 && ex < 0.93 && t < 0.85) {
        ctx.strokeStyle = PSTYLE[q.col];
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(q.ang) * 26 * ex, y - Math.sin(q.ang) * 26 * ex * q.flatten);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.fillRect(x, y, q.size, q.size);
    });
    ctx.globalAlpha = 1;
  }

  function drawGalaxies(p) {
    ctx.globalCompositeOperation = "lighter";
    galaxies.forEach((gx) => {
      const grow = fadeIn(p, gx.start, gx.start + 0.1);
      const alpha = fadeIn(p, 0.22, 0.3) * fadeOut(p, 0.42, 0.52);
      if (alpha <= 0.01 || grow <= 0) return;
      const visible = Math.max(1, Math.floor(gx.pts.length * grow));
      ctx.save();
      ctx.translate(w * 0.5 + gx.nx * w, h * 0.48 + gx.ny * h);
      ctx.rotate(gx.rot + time * gx.spin);
      ctx.scale(gx.scale, gx.scale);
      glowAt([120, 130, 210], 0, 0, 230, 0.16 * alpha);
      for (let i = 0; i < visible; i += 1) {
        const pt = gx.pts[i];
        if (pt.haze) glowAt([150, 170, 255], pt.x, pt.y, 16, 0.07 * alpha * pt.a);
        ctx.globalAlpha = alpha * pt.a;
        ctx.fillStyle = `rgb(${pt.c})`;
        ctx.fillRect(pt.x, pt.y, pt.s, pt.s);
      }
      glowAt([255, 226, 170], 0, 0, 70, 0.85 * alpha);
      glowAt([255, 248, 232], 0, 0, 20, 0.95 * alpha);
      ctx.restore();
    });
    const ia = fadeIn(p, 0.26, 0.34) * fadeOut(p, 0.4, 0.48);
    if (ia > 0.01) {
      igniters.forEach((s) => {
        const ign = smooth(norm((time * 0.12 + s.delay) % 1, 0.15, 0.55));
        const x = w * 0.5 + s.nx * w * 0.42;
        const y = h * 0.48 + s.ny * h * 0.36;
        glowAt([190, 215, 255], x, y, 6 + ign * 30, ia * (0.1 + ign * 0.6));
        glowAt([255, 255, 255], x, y, 3 + ign * 3, ia * ign);
      });
    }
    const cosA = fadeIn(p, 0.24, 0.32) * fadeOut(p, 0.42, 0.5);
    if (cosA > 0.4) {
      const u = (time % 9) / 9;
      if (u < 0.14) {
        const t = u / 0.14;
        const x = lerp(-40, w * 0.7, t), y = lerp(h * 0.16, h * 0.44, t);
        const g = ctx.createLinearGradient(x - 120, y - 48, x, y);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(1, `rgba(255,255,255,${0.85 * Math.sin(t * Math.PI)})`);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - 120, y - 48);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawMoon(cx, cy, radius, alpha, earthT) {
    const mr = Math.max(8, radius * 0.24);
    const ang = lerp(-0.7, 0.05, earthT) + Math.sin(time * 0.2) * 0.03;
    let mx = cx + Math.cos(ang) * radius * 2.05;
    const my = cy + Math.sin(ang) * radius * 1.05;
    mx = Math.min(mx, w - mr - 24);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.clip();
    const g = ctx.createRadialGradient(mx - mr * 0.45, my - mr * 0.38, mr * 0.1, mx, my, mr * 1.15);
    g.addColorStop(0, "#d8d3ca");
    g.addColorStop(0.45, "#8f8a82");
    g.addColorStop(0.85, "#2a2927");
    g.addColorStop(1, "#0b0b0c");
    ctx.fillStyle = g;
    ctx.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
    const rr = mulberry32(77);
    for (let i = 0; i < 14; i += 1) {
      const a = rr() * 6.28, d = Math.sqrt(rr()) * mr * 0.85, s = mr * (0.05 + rr() * 0.14);
      const px = mx + Math.cos(a) * d, py = my + Math.sin(a) * d;
      ctx.fillStyle = "rgba(40,38,36,0.28)";
      ctx.beginPath(); ctx.arc(px, py, s, 0, 6.28); ctx.fill();
      ctx.strokeStyle = "rgba(235,230,220,0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(px - s * 0.2, py - s * 0.2, s, 0, 6.28); ctx.stroke();
    }
    ctx.restore();
  }

  function drawEarth(p) {
    const alpha = fadeIn(p, 0.4, 0.46) * fadeOut(p, 0.6, 0.68);
    if (alpha <= 0.01) return;
    const earthT = norm(p, 0.4, 0.58);
    const appear = ss(0, 0.42, earthT);
    const baseR = Math.min(w, h) * 0.27;
    const radius = lerp(6, baseR, appear);
    const cx = w * 0.5, cy = h * 0.53;
    const molten = 1 - ss(0.22, 0.92, earthT);

    ctx.globalCompositeOperation = "lighter";
    rocks.forEach((rock) => {
      const pull = smooth(norm(earthT, 0, 0.46));
      const dist = lerp(rock.orbit * baseR, radius * 0.2, pull);
      const ang = rock.ang + time * 0.22 * rock.speed + rock.wobble;
      const ra = alpha * (1 - ss(0.38, 0.6, earthT));
      if (ra <= 0.01) return;
      const x = cx + Math.cos(ang) * dist, y = cy + Math.sin(ang) * dist * 0.6;
      glowAt([255, 150, 84], x, y, rock.size * 2.2 * (1 - pull * 0.4), ra * 0.55);
      glowAt([255, 232, 205], x, y, rock.size * 0.6, ra * 0.8);
    });

    if (molten > 0.02) glowAt([255, 110, 40], cx, cy, radius * 1.9, alpha * molten * 0.42);
    glowAt([84, 146, 255], cx, cy, radius * 1.34, alpha * appear * (0.28 + (1 - molten) * 0.4));

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alpha * Math.max(appear, 0.2);
    if (texReady) {
      const spin = time * 0.045 + earthT * 1.4;
      const spinTex = (spin / (Math.PI * 2)) * TW;
      const cloudTex = spinTex * 1.35 + time * 1.5;
      renderSphere(spinTex, cloudTex, molten, ss(0.45, 0.9, earthT));
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(sphereCanvas, cx - radius, cy - radius, radius * 2, radius * 2);
    } else {
      const g = ctx.createRadialGradient(cx - radius * 0.4, cy - radius * 0.35, radius * 0.1, cx, cy, radius);
      g.addColorStop(0, "#3c78b8");
      g.addColorStop(1, "#050c1a");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawMoon(cx, cy, radius, alpha * appear, earthT);
  }

  function drawLimb(p) {
    const limbA = fadeIn(p, 0.55, 0.64);
    if (limbA <= 0.01) return;
    const R = Math.max(w * 1.05, h * 1.4);
    const cx = w * 0.5;
    const crest = h * (0.86 - fadeIn(p, 0.72, 0.9) * 0.02);
    const cy = crest + R;

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = limbA;
    const body = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R);
    body.addColorStop(0, "#02040a");
    body.addColorStop(1, "#0a1830");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    const band = ctx.createRadialGradient(cx, cy, R * 0.975, cx, cy, R * 1.05);
    band.addColorStop(0, "rgba(70,130,235,0)");
    band.addColorStop(0.5, `rgba(120,180,255,${0.55 * limbA})`);
    band.addColorStop(1, "rgba(60,110,220,0)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = band;
    ctx.fillRect(0, crest - R * 0.08, w, R * 0.2);

    const sunA = fadeIn(p, 0.7, 0.88);
    if (sunA > 0.01) {
      const sx = w * 0.64;
      const dx = sx - cx;
      const sy = cy - Math.sqrt(Math.max(R * R - dx * dx, 0));
      glowAt([255, 150, 70], sx, sy, w * 0.42, 0.34 * sunA);
      glowAt([255, 200, 140], sx, sy, w * 0.16, 0.6 * sunA);
      glowAt([255, 246, 228], sx, sy, w * 0.04, 0.95 * sunA);
      ctx.globalAlpha = 0.5 * sunA;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(1, 0.05);
      ctx.drawImage(sprite([255, 214, 160]), -w * 0.35, -w * 0.35, w * 0.7, w * 0.7);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function drawGrain() {
    if (!grainPattern) return;
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = grainPattern;
    ctx.translate(-((time * 40) % 180), -((time * 27) % 180));
    ctx.fillRect(0, 0, w + 360, h + 360);
    ctx.restore();
  }

  function draw(p) {
    if (w < 2 || h < 2) return;
    const cosmosA = fadeIn(p, 0.22, 0.32) * fadeOut(p, 0.42, 0.52);
    const earthA = fadeIn(p, 0.4, 0.48) * fadeOut(p, 0.58, 0.68);
    drawBackground(p, cosmosA, earthA);
    if (p < 0.5) drawBang(p);
    drawGalaxies(p);
    drawEarth(p);
    drawLimb(p);
    drawGrain();
  }

  function frame(ts) {
    if (!running) return;
    time = ts * 0.001;
    const delta = target - current;
    const k = reduce ? 1 : Math.abs(delta) > 0.05 ? 0.28 : 0.14;
    current += delta * k;
    if (Math.abs(delta) < 0.0004) current = target;
    draw(current);
    updateChrome(current);
    requestAnimationFrame(frame);
  }

  /* ---------- workspace preview cycling ---------- */
  let industryIndex = 0;
  function cycleIndustry() {
    industryIndex = (industryIndex + 1) % INDUSTRIES.length;
    const ind = INDUSTRIES[industryIndex];
    industryName.textContent = ind.slug;
    document.querySelectorAll(".window-nav li").forEach((li, i) => { li.textContent = ind.nav[i]; });
    ["m1", "m2", "m3"].forEach((id, i) => { $(id).textContent = ind.m[i]; });
    feedList.innerHTML = ind.feed.map((line) => `<li>${line}</li>`).join("");
  }
  if (!reduce) setInterval(cycleIndustry, 2800);

  /* ---------- interactions ---------- */
  document.querySelectorAll("[data-jump]").forEach((node) => {
    node.addEventListener("click", (event) => {
      const value = node.dataset.jump;
      if (value === undefined) return;
      event.preventDefault();
      jumpTo(Number(value));
    });
  });
  railTrack.addEventListener("click", (event) => {
    const rect = railTrack.getBoundingClientRect();
    jumpTo((event.clientY - rect.top) / rect.height);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("in"); });
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  const form = $("accessForm");
  const note = $("formNote");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      note.textContent = "Enter a work email so the walkthrough has somewhere to land.";
      return;
    }
    const entry = {
      name: String(data.get("name") || ""),
      email,
      industry: String(data.get("industry") || ""),
      at: new Date().toISOString()
    };
    try {
      const prev = JSON.parse(localStorage.getItem("awxforge-requests") || "[]");
      prev.push(entry);
      localStorage.setItem("awxforge-requests", JSON.stringify(prev));
    } catch (error) {
      note.textContent = "This browser blocked local saving. Your note stayed on the page.";
      return;
    }
    note.textContent = `Saved on this device. ${entry.name}, your ${entry.industry} walkthrough request is kept in this browser.`;
  });

  window.addEventListener("scroll", () => { target = storyProgress(); }, { passive: true });
  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", () => {
    running = document.visibilityState !== "hidden";
    if (running) requestAnimationFrame(frame);
  });

  resize();
  target = storyProgress();
  current = target;
  requestAnimationFrame(frame);
})();
