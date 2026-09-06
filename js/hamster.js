// "Художник хомяка" — рисует хомяка целиком: тело, голову, щёки-мешочки,
// уши, лапки и мордочку, которая меняется по настроению (calm/happy/sad).

const Hamster = (() => {
  const NS = "http://www.w3.org/2000/svg";

  const palettes = {
    rusty: {
      body: "#d98c4a",
      bodyDark: "#b56a2e",
      bodyLight: "#f0b378",
      belly: "#f7e3c4",
      cheek: "#ffd9a0",
      blush: "#ff9d8a",
      nose: "#6b3a1f",
      eye: "#3a2415",
    },
    grey: {
      body: "#a6a29a",
      bodyDark: "#84807a",
      bodyLight: "#c9c5bd",
      belly: "#e9e5dc",
      cheek: "#d8d3c8",
      blush: "#e2a9a0",
      nose: "#4a4640",
      eye: "#2b2824",
    },
    white: {
      body: "#f3ede0",
      bodyDark: "#d6cdb9",
      bodyLight: "#fffbf2",
      belly: "#fffaf0",
      cheek: "#f7e6d4",
      blush: "#f4a9a0",
      nose: "#c68a7a",
      eye: "#3a332c",
    },
  };

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  }

  function buildShadow(g, s) {
    g.appendChild(el("ellipse", { cx: 0, cy: 0.06 * s, rx: 0.55 * s, ry: 0.12 * s, fill: "rgba(30,40,10,0.18)" }));
  }

  function buildTail(g, s, pal) {
    g.appendChild(el("circle", { cx: 0.46 * s, cy: -0.18 * s, r: 0.13 * s, fill: pal.bodyDark, opacity: 0.85 }));
  }

  function buildBody(g, s, pal) {
    g.appendChild(el("ellipse", { cx: 0, cy: -0.48 * s, rx: 0.52 * s, ry: 0.56 * s, fill: pal.body }));
    g.appendChild(el("ellipse", { cx: 0, cy: -0.4 * s, rx: 0.3 * s, ry: 0.4 * s, fill: pal.belly, opacity: 0.9 }));
    g.appendChild(el("ellipse", { cx: -0.26 * s, cy: -0.28 * s, rx: 0.2 * s, ry: 0.24 * s, fill: pal.bodyDark, opacity: 0.25 }));
    g.appendChild(el("ellipse", { cx: 0.26 * s, cy: -0.28 * s, rx: 0.2 * s, ry: 0.24 * s, fill: pal.bodyDark, opacity: 0.25 }));
  }

  function buildFeet(g, s, pal) {
    g.appendChild(el("ellipse", { cx: -0.2 * s, cy: 0.02 * s, rx: 0.13 * s, ry: 0.08 * s, fill: pal.bodyDark }));
    g.appendChild(el("ellipse", { cx: 0.2 * s, cy: 0.02 * s, rx: 0.13 * s, ry: 0.08 * s, fill: pal.bodyDark }));
  }

  function buildEars(g, s, pal, mood) {
    const drop = mood === "sad";
    [-1, 1].forEach((side) => {
      const ex = side * 0.3 * s;
      const ey = drop ? -1.02 * s : -1.14 * s;
      const rot = drop ? side * 35 : 0;
      const earG = el("g", { transform: `rotate(${rot} ${ex} ${ey})` });
      earG.appendChild(el("circle", { cx: ex, cy: ey, r: 0.17 * s, fill: pal.bodyDark }));
      earG.appendChild(el("circle", { cx: ex, cy: ey, r: 0.09 * s, fill: pal.cheek }));
      g.appendChild(earG);
    });
  }

  function buildHead(g, s, pal) {
    g.appendChild(el("circle", { cx: 0, cy: -0.94 * s, r: 0.42 * s, fill: pal.body }));
    g.appendChild(el("ellipse", { cx: 0, cy: -1.06 * s, rx: 0.3 * s, ry: 0.22 * s, fill: pal.bodyLight, opacity: 0.5 }));
  }

  function buildCheeks(g, s, pal, mood) {
    const puff = mood === "happy" ? 1.15 : 1;
    [-1, 1].forEach((side) => {
      g.appendChild(
        el("circle", { cx: side * 0.38 * s, cy: -0.82 * s, r: 0.22 * s * puff, fill: pal.cheek })
      );
      if (mood === "happy") {
        g.appendChild(
          el("circle", { cx: side * 0.4 * s, cy: -0.78 * s, r: 0.1 * s, fill: pal.blush, opacity: 0.7 })
        );
      }
    });
  }

  function buildEyes(g, s, pal, mood) {
    const ey = -0.98 * s;
    if (mood === "happy") {
      [-1, 1].forEach((side) => {
        const ex = side * 0.16 * s;
        g.appendChild(
          el("path", {
            d: `M ${ex - 0.07 * s},${ey} Q ${ex},${ey - 0.09 * s} ${ex + 0.07 * s},${ey}`,
            stroke: pal.eye,
            "stroke-width": 0.045 * s,
            fill: "none",
            "stroke-linecap": "round",
          })
        );
      });
      return;
    }
    if (mood === "sad") {
      [-1, 1].forEach((side) => {
        const ex = side * 0.16 * s;
        g.appendChild(el("ellipse", { cx: ex, cy: ey, rx: 0.055 * s, ry: 0.07 * s, fill: pal.eye }));
        g.appendChild(
          el("path", {
            d: `M ${ex - side * 0.08 * s},${ey - 0.14 * s} Q ${ex},${ey - 0.08 * s} ${ex + side * 0.09 * s},${ey - 0.17 * s}`,
            stroke: pal.eye,
            "stroke-width": 0.035 * s,
            fill: "none",
            "stroke-linecap": "round",
          })
        );
      });
      return;
    }
    [-1, 1].forEach((side) => {
      const ex = side * 0.16 * s;
      g.appendChild(el("ellipse", { cx: ex, cy: ey, rx: 0.06 * s, ry: 0.075 * s, fill: pal.eye }));
      g.appendChild(el("circle", { cx: ex + 0.02 * s, cy: ey - 0.02 * s, r: 0.018 * s, fill: "#fff", opacity: 0.85 }));
    });
  }

  function buildNose(g, s, pal) {
    g.appendChild(el("ellipse", { cx: 0, cy: -0.82 * s, rx: 0.045 * s, ry: 0.035 * s, fill: pal.nose }));
  }

  function buildWhiskers(g, s, pal) {
    [-1, 1].forEach((side) => {
      [-0.05, 0, 0.05].forEach((dy, i) => {
        g.appendChild(
          el("line", {
            x1: side * 0.1 * s,
            y1: -0.8 * s + dy * s,
            x2: side * 0.32 * s,
            y2: -0.82 * s + dy * s * 1.3,
            stroke: pal.bodyDark,
            "stroke-width": 0.012 * s,
            opacity: 0.6,
            "stroke-linecap": "round",
          })
        );
      });
    });
  }

  function buildMouth(g, s, pal, mood) {
    const y = -0.74 * s;
    if (mood === "happy") {
      g.appendChild(
        el("path", {
          d: `M ${-0.13 * s},${y} Q 0,${y + 0.16 * s} ${0.13 * s},${y} Q 0,${y + 0.05 * s} ${-0.13 * s},${y} Z`,
          fill: "#8a3b3b",
        })
      );
      return;
    }
    if (mood === "sad") {
      g.appendChild(
        el("path", {
          d: `M ${-0.1 * s},${y + 0.03 * s} Q 0,${y - 0.05 * s} ${0.1 * s},${y + 0.03 * s}`,
          stroke: pal.eye,
          "stroke-width": 0.03 * s,
          fill: "none",
          "stroke-linecap": "round",
        })
      );
      return;
    }
    g.appendChild(
      el("path", {
        d: `M ${-0.08 * s},${y} Q 0,${y + 0.04 * s} ${0.08 * s},${y}`,
        stroke: pal.eye,
        "stroke-width": 0.03 * s,
        fill: "none",
        "stroke-linecap": "round",
      })
    );
  }

  function buildPaws(g, s, pal, mood) {
    if (mood === "happy") {
      [-1, 1].forEach((side) => {
        g.appendChild(el("ellipse", { cx: side * 0.5 * s, cy: -0.72 * s, rx: 0.11 * s, ry: 0.15 * s, fill: pal.body }));
      });
      return;
    }
    if (mood === "sad") {
      [-1, 1].forEach((side) => {
        g.appendChild(el("ellipse", { cx: side * 0.22 * s, cy: -0.1 * s, rx: 0.12 * s, ry: 0.16 * s, fill: pal.body }));
      });
      return;
    }
    // calm - лапы держат табличку
    [-1, 1].forEach((side) => {
      g.appendChild(el("ellipse", { cx: side * 0.28 * s, cy: -0.35 * s, rx: 0.12 * s, ry: 0.15 * s, fill: pal.body }));
      g.appendChild(el("ellipse", { cx: side * 0.27 * s, cy: -0.32 * s, rx: 0.09 * s, ry: 0.11 * s, fill: pal.bodyLight }));
    });
  }

  function buildHamster(cx, cy, size, pal, mood) {
    const g = el("g", { transform: `translate(${cx}, ${cy})` });
    buildShadow(g, size);
    buildTail(g, size, pal);
    buildBody(g, size, pal);
    buildFeet(g, size, pal);
    buildEars(g, size, pal, mood);
    buildHead(g, size, pal);
    buildCheeks(g, size, pal, mood);
    buildEyes(g, size, pal, mood);
    buildNose(g, size, pal);
    buildWhiskers(g, size, pal);
    buildMouth(g, size, pal, mood);
    buildPaws(g, size, pal, mood);
    return g;
  }

  function renderPreview(svg, type) {
    const pal = palettes[type] || palettes.rusty;
    svg.innerHTML = "";
    svg.setAttribute("viewBox", "0 0 200 200");
    svg.appendChild(buildHamster(100, 175, 95, pal, "calm"));
  }

  function initPreviews() {
    document.querySelectorAll("[data-hamster-preview]").forEach((svg) => {
      renderPreview(svg, svg.dataset.hamsterPreview);
    });
  }

  function getViewBox(svg) {
    const parts = (svg.getAttribute("viewBox") || "0 0 900 600").split(/\s+/).map(Number);
    return { w: parts[2], h: parts[3] };
  }

  function drawInScene(sceneSvg, type, mood) {
    const pal = palettes[type] || palettes.rusty;
    const { w, h } = getViewBox(sceneSvg);
    const size = h * 0.34;
    sceneSvg.appendChild(buildHamster(w * 0.5 - 20, h * 0.88, size, pal, mood || "calm"));
  }

  document.addEventListener("DOMContentLoaded", initPreviews);

  return { drawInScene };
})();
