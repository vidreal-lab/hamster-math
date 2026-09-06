// "Художник леса" — рисует фон леса в стиле референса "лес.png":
// никакого неба — весь верх кадра занят бугристыми кронами деревьев
// разных оттенков зелени, в просвете между стволами светится дымка
// с бледными далёкими деревьями, снизу трава с камнями и кустами.

const Forest = (() => {
  const NS = "http://www.w3.org/2000/svg";
  let uid = 0;

  // Внешний контур кроны — крупные лопасти, вместе дающие округлое облако.
  const CROWN_LOBES = [
    { dx: 0, dy: 0.05, r: 1.0 },
    { dx: -0.55, dy: -0.32, r: 0.7 },
    { dx: 0.55, dy: -0.32, r: 0.7 },
    { dx: 0, dy: -0.58, r: 0.62 },
    { dx: -0.88, dy: 0.1, r: 0.58 },
    { dx: 0.88, dy: 0.1, r: 0.58 },
    { dx: -0.42, dy: 0.5, r: 0.56 },
    { dx: 0.42, dy: 0.5, r: 0.56 },
    { dx: 0, dy: 0.6, r: 0.5 },
  ];

  // Мелкие бугорки по краю кроны — та самая "капустная" бугристая текстура с референса.
  const CROWN_BUMPS = [
    { dx: -0.95, dy: -0.15, r: 0.26 },
    { dx: -0.75, dy: -0.42, r: 0.28 },
    { dx: -0.4, dy: -0.68, r: 0.3 },
    { dx: 0, dy: -0.82, r: 0.3 },
    { dx: 0.4, dy: -0.68, r: 0.3 },
    { dx: 0.75, dy: -0.42, r: 0.28 },
    { dx: 0.95, dy: -0.15, r: 0.26 },
    { dx: 1.02, dy: 0.25, r: 0.24 },
    { dx: 0.7, dy: 0.55, r: 0.26 },
    { dx: 0.25, dy: 0.78, r: 0.26 },
    { dx: -0.25, dy: 0.78, r: 0.26 },
    { dx: -0.7, dy: 0.55, r: 0.26 },
    { dx: -1.02, dy: 0.25, r: 0.24 },
  ];

  const palettes = {
    sunny: {
      backdrop: "#eef6da",
      haze: "#f7fbe6",
      ground: "#8fc45c",
      groundDark: "#6ea83a",
      canopy: [
        { base: "#a9d46b", dark: "#7fae44", light: "#d8ecab" },
        { base: "#5e9e4c", dark: "#3f7a34", light: "#8cc26e" },
        { base: "#347a3c", dark: "#215c29", light: "#579a54" },
      ],
      trunk: "#b97a42",
      trunkDark: "#7d5027",
      trunkLight: "#d99a5c",
      bush: "#2f6b3c",
      bushDark: "#1f4d2a",
      bushLight: "#4f8f52",
      rock: "#aab3ac",
      rockDark: "#848d87",
      rockLight: "#c3cac5",
      shadow: "rgba(30, 50, 10, 0.18)",
      fogOpacity: 0,
    },
    sunset: {
      backdrop: "#5a3f5e",
      haze: "#ff9e5e",
      ground: "#8a5a3f",
      groundDark: "#6b4530",
      canopy: [
        { base: "#8a6a4a", dark: "#5f4630", light: "#b28f63" },
        { base: "#6c4560", dark: "#4a2f42", light: "#8a5f7a" },
        { base: "#402638", dark: "#2a1624", light: "#5c3a51" },
      ],
      trunk: "#6b4530",
      trunkDark: "#452c1e",
      trunkLight: "#8a613f",
      bush: "#2a1624",
      bushDark: "#1a0e17",
      bushLight: "#402638",
      rock: "#8f7d78",
      rockDark: "#6b5b57",
      rockLight: "#a8968f",
      shadow: "rgba(20, 10, 30, 0.28)",
      fogOpacity: 0,
    },
    foggy: {
      backdrop: "#c9d4c8",
      haze: "#e8eee6",
      ground: "#9aab98",
      groundDark: "#7f9480",
      canopy: [
        { base: "#b9c6ba", dark: "#9aab98", light: "#d8e0d4" },
        { base: "#8ea38f", dark: "#708573", light: "#aebeac" },
        { base: "#647865", dark: "#4e5f4f", light: "#7f9480" },
      ],
      trunk: "#8f8578",
      trunkDark: "#6b6358",
      trunkLight: "#a89a86",
      bush: "#4e5f4f",
      bushDark: "#3a483b",
      bushLight: "#647865",
      rock: "#a8b0ac",
      rockDark: "#848d87",
      rockLight: "#c1c8c4",
      shadow: "rgba(40, 45, 40, 0.15)",
      fogOpacity: 0.5,
    },
  };

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  }

  function buildDefs(svg, id) {
    const defs = el("defs", {});
    const blur = el("filter", { id: `blur-${id}` });
    blur.appendChild(el("feGaussianBlur", { stdDeviation: "6" }));
    defs.appendChild(blur);
    svg.appendChild(defs);
  }

  // Вместо неба — тёплая подложка того же тона, что просвечивает между кронами.
  function buildBackdrop(svg, w, h, pal) {
    svg.appendChild(el("rect", { x: 0, y: 0, width: w, height: h, fill: pal.backdrop }));
  }

  // Светлое пятно-просвет в кронах, как на референсе.
  function buildGlow(svg, w, h, pal, id) {
    const g = el("g", { filter: `url(#blur-${id})`, opacity: 0.65 });
    g.appendChild(el("ellipse", { cx: w * 0.48, cy: h * 0.24, rx: w * 0.22, ry: h * 0.22, fill: pal.haze }));
    g.appendChild(el("ellipse", { cx: w * 0.4, cy: h * 0.33, rx: w * 0.14, ry: h * 0.15, fill: pal.haze }));
    svg.appendChild(g);
  }

  function buildGround(svg, w, h, pal, groundY) {
    svg.appendChild(
      el("path", {
        d: `M0,${groundY + h * 0.02} Q${w * 0.5},${groundY - h * 0.02} ${w},${groundY + h * 0.02} L${w},${h} L0,${h} Z`,
        fill: pal.ground,
      })
    );
    svg.appendChild(
      el("path", {
        d: `M0,${groundY + h * 0.1} Q${w * 0.5},${groundY + h * 0.05} ${w},${groundY + h * 0.11} L${w},${h} L0,${h} Z`,
        fill: pal.groundDark,
        opacity: 0.4,
      })
    );
  }

  // Крона: силуэт из крупных лопастей + тёмный низ + светлый верх + бугорки по краю ("капуста").
  function buildCrown(g, cx, cy, size, darkColor, baseColor, lightColor) {
    CROWN_LOBES.forEach((b) => {
      g.appendChild(el("circle", { cx: cx + b.dx * size, cy: cy + b.dy * size, r: b.r * size, fill: baseColor }));
    });
    [
      { dx: -0.1, dy: 0.32, r: 0.68 },
      { dx: 0.42, dy: 0.3, r: 0.46 },
      { dx: -0.55, dy: 0.1, r: 0.4 },
    ].forEach((s) => {
      g.appendChild(
        el("circle", { cx: cx + s.dx * size, cy: cy + s.dy * size, r: s.r * size, fill: darkColor, opacity: 0.8 })
      );
    });
    CROWN_BUMPS.forEach((b) => {
      const isLight = b.dy < 0.15;
      g.appendChild(
        el("circle", {
          cx: cx + b.dx * size,
          cy: cy + b.dy * size,
          r: b.r * size,
          fill: isLight ? lightColor : baseColor,
          opacity: isLight ? 0.75 : 0.9,
        })
      );
    });
    [
      { dx: -0.42, dy: -0.42, r: 0.34 },
      { dx: 0.1, dy: -0.62, r: 0.26 },
      { dx: 0.5, dy: -0.3, r: 0.28 },
    ].forEach((s) => {
      g.appendChild(
        el("circle", { cx: cx + s.dx * size, cy: cy + s.dy * size, r: s.r * size, fill: lightColor, opacity: 0.75 })
      );
    });
  }

  function buildFlatCrown(g, cx, cy, size, color, opacity) {
    CROWN_LOBES.forEach((b) => {
      g.appendChild(el("circle", { cx: cx + b.dx * size, cy: cy + b.dy * size, r: b.r * size, fill: color, opacity }));
    });
  }

  function buildTrunk(g, height, lean, trunkColor, trunkDark, trunkLight) {
    const wBottom = height * 0.28;
    const wTop = height * 0.13;
    // Корневые наплывы у основания.
    [-1, 1].forEach((side) => {
      g.appendChild(
        el("path", {
          d: `M ${side * wBottom * 0.3},${-height * 0.06}
              C ${side * wBottom * 0.75},${-height * 0.02} ${side * wBottom * 0.95},${height * 0.02} ${side * wBottom * 0.7},${height * 0.06}
              L ${side * wBottom * 0.35},${height * 0.02} Z`,
          fill: trunkColor,
        })
      );
    });
    g.appendChild(
      el("path", {
        d: `M ${-wBottom / 2},0
            C ${-wBottom / 2 - 2},${-height * 0.25} ${-wTop / 2 + lean * 0.3},${-height * 0.7} ${-wTop / 2 + lean},${-height}
            L ${wTop / 2 + lean},${-height}
            C ${wTop / 2 + lean * 0.3},${-height * 0.7} ${wBottom / 2 + 2},${-height * 0.25} ${wBottom / 2},0
            Z`,
        fill: trunkColor,
      })
    );
    // Полоски коры вдоль ствола — светлая/тёмная переменка, как на референсе.
    [
      { offset: -wBottom * 0.26, color: trunkDark, opacity: 0.55, w: 1.4 },
      { offset: -wBottom * 0.05, color: trunkLight, opacity: 0.5, w: 1.6 },
      { offset: wBottom * 0.12, color: trunkDark, opacity: 0.4, w: 1.3 },
      { offset: wBottom * 0.28, color: trunkDark, opacity: 0.55, w: 1.4 },
    ].forEach((s) => {
      g.appendChild(
        el("path", {
          d: `M ${s.offset},${-height * 0.03} C ${s.offset + lean * 0.2},${-height * 0.35} ${s.offset + lean * 0.55},${-height * 0.65} ${s.offset + lean * 0.85},${-height * 0.95}`,
          stroke: s.color,
          "stroke-width": Math.max(1.3, wBottom * 0.12),
          fill: "none",
          opacity: s.opacity,
          "stroke-linecap": "round",
        })
      );
    });
  }

  // Дерево задаётся точками по факту (низ ствола и центр кроны), а не абстрактным "scale" —
  // так крона гарантированно достаёт до верхнего края кадра, как на референсе.
  function buildTree(svg, x, footY, crownCy, lean, crownSize, tone, colors) {
    const height = footY - (crownCy + crownSize * 0.35);
    const g = el("g", { transform: `translate(${x}, ${footY})` });
    buildTrunk(g, height, lean, colors.trunk, colors.trunkDark, colors.trunkLight);
    buildCrown(g, lean * 0.9, crownCy - footY, crownSize, tone.dark, tone.base, tone.light);
    svg.appendChild(g);
  }

  function buildBush(svg, x, y, scale, pal) {
    const g = el("g", { transform: `translate(${x}, ${y}) scale(${scale})` });
    buildCrown(g, 0, 0, 24, pal.bushDark, pal.bush, pal.bushLight);
    svg.appendChild(g);
  }

  function buildRock(g, x, y, scale, pal) {
    g.appendChild(el("path", { d: "M -16,8 Q -18,-6 -4,-10 Q 10,-16 16,-2 Q 20,8 8,10 Q -6,14 -16,8 Z", fill: pal.rock, transform: `translate(${x},${y}) scale(${scale})` }));
    g.appendChild(el("path", { d: "M -14,8 Q -10,2 0,4 Q 10,6 12,9 Q 0,13 -14,8 Z", fill: pal.rockDark, opacity: 0.7, transform: `translate(${x},${y}) scale(${scale})` }));
    g.appendChild(el("path", { d: "M -12,-2 Q -6,-9 2,-8 Q -2,-4 -4,2 Z", fill: pal.rockLight, opacity: 0.7, transform: `translate(${x},${y}) scale(${scale})` }));
  }

  // Группа из 2-3 камней вместе, как на референсе, с общей тенью.
  function buildRockCluster(svg, x, y, scale, pal) {
    const g = el("g", {});
    g.appendChild(el("ellipse", { cx: x + 4 * scale, cy: y + 10 * scale, rx: 30 * scale, ry: 8 * scale, fill: pal.shadow }));
    buildRock(g, x - 14 * scale, y + 2 * scale, scale * 0.75, pal);
    buildRock(g, x + 10 * scale, y, scale, pal);
    if (scale > 0.7) buildRock(g, x + 26 * scale, y + 4 * scale, scale * 0.6, pal);
    svg.appendChild(g);
  }

  function buildGrassTuft(svg, x, y, scale, colorDark, colorLight) {
    const g = el("g", { transform: `translate(${x}, ${y}) scale(${scale})` });
    [
      { dx: -6, rot: -18, h: 16, c: colorDark },
      { dx: 0, rot: 0, h: 20, c: colorLight },
      { dx: 6, rot: 16, h: 15, c: colorDark },
    ].forEach((b) => {
      g.appendChild(
        el("path", {
          d: `M ${b.dx - 2},0 Q ${b.dx - 1},${-b.h * 0.6} ${b.dx},${-b.h} Q ${b.dx + 1},${-b.h * 0.6} ${b.dx + 2},0 Z`,
          fill: b.c,
          transform: `rotate(${b.rot} ${b.dx} 0)`,
        })
      );
    });
    svg.appendChild(g);
  }

  // Бледные размытые стволы и кроны далёкого леса, видные в просвете между передними деревьями.
  function buildDistantTrunks(svg, w, h, pal, id) {
    const tone = pal.canopy[0];
    const spots = [
      { fx: 0.29, fy: 0.62, crownFy: 0.34, size: 0.14 },
      { fx: 0.46, fy: 0.6, crownFy: 0.3, size: 0.16 },
      { fx: 0.62, fy: 0.63, crownFy: 0.35, size: 0.13 },
    ];
    const g = el("g", { filter: `url(#blur-${id})`, opacity: 0.55 });
    spots.forEach((s) => {
      const footY = h * s.fy;
      const crownCy = h * s.crownFy;
      const trunkH = footY - crownCy;
      g.appendChild(
        el("rect", {
          x: w * s.fx - h * 0.012,
          y: crownCy,
          width: h * 0.024,
          height: trunkH,
          fill: pal.trunkLight,
        })
      );
      buildFlatCrown(g, w * s.fx, crownCy, h * s.size, tone.light, 0.8);
    });
    svg.appendChild(g);
  }

  // Тёмная кустистая изгородь вдоль земли, гуще по углам, как на референсе.
  function buildBushHedge(svg, w, h, pal, unit) {
    [
      { fx: 0.14, fy: 0.8 },
      { fx: 0.3, fy: 0.83 },
      { fx: 0.5, fy: 0.79 },
      { fx: 0.62, fy: 0.84 },
      { fx: 0.8, fy: 0.8 },
    ].forEach((b) => buildBush(svg, w * b.fx, h * b.fy, 1.3 * unit, pal));
    buildBush(svg, w * 0.0, h * 1.02, 2.6 * unit, pal);
    buildBush(svg, w * 1.0, h * 1.03, 2.8 * unit, pal);
  }

  function buildTrees(svg, w, h, pal, id) {
    const unit = Math.min(w, h) / 600;

    buildDistantTrunks(svg, w, h, pal, id);

    const colors = { trunk: pal.trunk, trunkDark: pal.trunkDark, trunkLight: pal.trunkLight };

    // Крупные деревья на переднем плане — кроны достают до верхнего края кадра,
    // как на референсе, где неба не видно совсем.
    const trees = [
      { fx: 0.03, footFy: 0.68, crownFy: 0.26, size: 0.3, lean: 22, tone: 1 },
      { fx: 0.19, footFy: 0.74, crownFy: 0.33, size: 0.23, lean: -8, tone: 0 },
      { fx: 0.35, footFy: 0.71, crownFy: 0.21, size: 0.32, lean: 6, tone: 2 },
      { fx: 0.53, footFy: 0.69, crownFy: 0.27, size: 0.26, lean: -10, tone: 1 },
      { fx: 0.7, footFy: 0.73, crownFy: 0.23, size: 0.29, lean: 9, tone: 0 },
      { fx: 0.87, footFy: 0.68, crownFy: 0.2, size: 0.31, lean: -15, tone: 2 },
      { fx: 1.0, footFy: 0.72, crownFy: 0.28, size: 0.21, lean: 20, tone: 1 },
    ];
    trees.forEach((t) =>
      buildTree(svg, w * t.fx, h * t.footFy, h * t.crownFy, t.lean * unit, h * t.size, pal.canopy[t.tone], colors)
    );

    buildBushHedge(svg, w, h, pal, unit);

    const rockClusters = [
      { fx: 0.08, fy: 0.85 },
      { fx: 0.27, fy: 0.93 },
      { fx: 0.47, fy: 0.87 },
      { fx: 0.66, fy: 0.94 },
      { fx: 0.85, fy: 0.86 },
    ];
    rockClusters.forEach((r, i) => buildRockCluster(svg, w * r.fx, h * r.fy, (0.7 + (i % 3) * 0.1) * unit, pal));

    const tuftSpots = [
      { fx: 0.12, fy: 0.91 },
      { fx: 0.22, fy: 0.97 },
      { fx: 0.4, fy: 0.9 },
      { fx: 0.58, fy: 0.98 },
      { fx: 0.73, fy: 0.9 },
      { fx: 0.9, fy: 0.97 },
    ];
    tuftSpots.forEach((t) =>
      buildGrassTuft(svg, w * t.fx, h * t.fy, unit, pal.canopy[2].dark, pal.canopy[0].light)
    );
  }

  // Лёгкая туманная дымка сверху всей сцены — только для пасмурной палитры.
  function buildMist(svg, w, h, pal, id) {
    if (pal.fogOpacity <= 0) return;
    svg.appendChild(
      el("rect", {
        x: 0,
        y: 0,
        width: w,
        height: h,
        fill: pal.haze,
        opacity: pal.fogOpacity * 0.35,
        filter: `url(#blur-${id})`,
      })
    );
  }

  function render(svg, type, w, h) {
    const pal = palettes[type] || palettes.sunny;
    uid += 1;
    const id = uid;
    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    buildDefs(svg, id);
    buildBackdrop(svg, w, h, pal);
    buildGlow(svg, w, h, pal, id);
    buildGround(svg, w, h, pal, h * 0.6);
    buildTrees(svg, w, h, pal, id);
    buildMist(svg, w, h, pal, id);
  }

  function renderPreview(svg, type) {
    render(svg, type, 200, 200);
  }

  function initPreviews() {
    document.querySelectorAll("[data-forest-preview]").forEach((svg) => {
      renderPreview(svg, svg.dataset.forestPreview);
    });
  }

  function drawScene(sceneSvg, type) {
    render(sceneSvg, type, 900, 600);
  }

  document.addEventListener("DOMContentLoaded", initPreviews);

  return { drawScene };
})();
