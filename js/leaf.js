// "Художник семечек" — рисует реалистичную семечку подсолнуха с числом внутри.

const Leaf = (() => {
  const NS = "http://www.w3.org/2000/svg";

  const highlightColors = {
    correct: "#3fae4a",
    wrong: "#d9483f",
  };

  function el(tag, attrs) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  }

  function buildShape(type, text, highlight) {
    const g = el("g", {});

    // Изображение семечки с поворотом на 270°
    const imgGroup = el("g", {
      transform: "rotate(270)"
    });

    imgGroup.appendChild(
      el("image", {
        href: "assets/black_seed_final.png",
        x: -48,
        y: -26,
        width: 96,
        height: 52,
      })
    );

    g.appendChild(imgGroup);

    // Текст с ответом
    if (text) {
      const fontSize = text.length > 2 ? 22 : 26;
      // Определяем цвет текста в зависимости от подсветки
      let textColor = "#ffffff";
      if (highlight && highlightColors[highlight]) {
        textColor = highlightColors[highlight];
      }

      g.appendChild(
        el("text", {
          x: 0,
          y: 6,
          "text-anchor": "middle",
          "font-size": fontSize,
          "font-weight": "bold",
          fill: textColor,
          stroke: "#1a1a1a",
          "stroke-width": 2,
          "paint-order": "stroke",
        })
      ).textContent = text;
    }

    return g;
  }

  function renderPreview(svg, type) {
    svg.innerHTML = "";
    svg.setAttribute("viewBox", "-30 -55 60 110");
    svg.appendChild(buildShape(type, "", null));
  }

  function initPreviews() {
    document.querySelectorAll("[data-leaf-preview]").forEach((svg) => {
      renderPreview(svg, svg.dataset.leafPreview);
    });
  }

  function createLeafElement(type, text, highlight) {
    return buildShape(type, text || "", highlight || null);
  }

  document.addEventListener("DOMContentLoaded", initPreviews);

  return { createLeafElement };
})();
