// "Дирижёр" — командует игровым экраном: рисует лес, хомяка и семечки-ответы,
// ведёт счёт в "Тренировке" и список примеров в "Работе над ошибками".

const GameScreen = (() => {
  const NS = "http://www.w3.org/2000/svg";
  const BG_W = 900;          // размеры файла фона
  const BG_H = 600;
  const SCENE_H = 600;       // высота системы координат сцены (ширина зависит от экрана)
  const STAGE_W = 900;       // "сцена" с выверенными координатами для широких экранов

  let sceneSvg = null;
  let bgImage = null;
  let clickHandler = null;
  let settings = null;
  let resizeHandler = null;
  let resizeTimer = null;
  let layout = null;
  let currentMood = "calm";
  let activeMode = null;  // "practice" | "mistake-review" — текущий активный режим

  function el(tag, attrs) {
    const elem = document.createElementNS(NS, tag);
    for (const k in attrs) elem.setAttribute(k, attrs[k]);
    return elem;
  }

  // ---------------- Раскладка сцены ----------------
  // viewBox подстраивается под пропорции окна (высота всегда SCENE_H), поэтому
  // вся сцена целиком попадает в кадр и на телефоне, и на компьютере.
  function computeLayout() {
    const winW = window.innerWidth || BG_W;
    const winH = window.innerHeight || BG_H;
    const h = SCENE_H;
    const w = Math.round(h * (winW / winH));
    const portrait = w / h < 1.2;

    if (portrait) {
      // Телефон вертикально: хомяк с табличкой внизу, семечки рядком над ним.
      const size = h * 0.3;
      const cx = w * 0.5;
      const cy = h * 0.96;
      const gap = Math.min(w * 0.3, 95);
      const seedY = h * 0.4;
      return {
        w, h, portrait,
        hamster: { cx, cy, size },
        sign: { x: cx, y: cy - size * 0.28 },
        seedScale: 1.15,
        seeds: [
          { x: cx - gap, y: seedY },
          { x: cx, y: seedY },
          { x: cx + gap, y: seedY },
        ],
      };
    }

    // Широкий экран: сохраняем выверенные координаты, центрируя "сцену" 900×600.
    const dx = (w - STAGE_W) / 2;
    return {
      w, h, portrait,
      hamster: { cx: dx + 330, cy: h * 0.88, size: h * 0.34 },
      sign: { x: dx + 430, y: 470 },
      seedScale: 1.35,
      seeds: [
        { x: dx + 620, y: 470 },
        { x: dx + 700, y: 470 },
        { x: dx + 780, y: 470 },
      ],
    };
  }

  // Растягивает фон так, чтобы он полностью закрывал viewBox без искажений.
  function applyLayout() {
    sceneSvg.setAttribute("viewBox", `0 0 ${layout.w} ${layout.h}`);
    if (!bgImage) return;
    const scale = Math.max(layout.w / BG_W, layout.h / BG_H);
    const bw = BG_W * scale;
    const bh = BG_H * scale;
    bgImage.setAttribute("x", (layout.w - bw) / 2);
    bgImage.setAttribute("y", (layout.h - bh) / 2);
    bgImage.setAttribute("width", bw);
    bgImage.setAttribute("height", bh);
  }

  function drawSign(text, x, y, scale) {
    const g = el("g", {
      transform: `translate(${x}, ${y}) scale(${scale})`,
      "data-sign": "1"
    });

    // Деревянная доска
    g.appendChild(el("rect", {
      x: -70, y: -35, width: 140, height: 70, rx: 4,
      fill: "#8b6f47", stroke: "#5d4a2f", "stroke-width": 2
    }));

    // Текстура дерева (полоски)
    g.appendChild(el("rect", {
      x: -65, y: -30, width: 130, height: 3,
      fill: "#6b5537", opacity: 0.4
    }));
    g.appendChild(el("rect", {
      x: -65, y: -15, width: 130, height: 2,
      fill: "#6b5537", opacity: 0.3
    }));
    g.appendChild(el("rect", {
      x: -65, y: 10, width: 130, height: 2,
      fill: "#6b5537", opacity: 0.3
    }));

    // Текст примера
    const textEl = el("text", {
      x: 0, y: 8,
      "text-anchor": "middle",
      "font-size": text.length > 4 ? 28 : 36,
      "font-weight": "bold",
      fill: "#ffffff",
      "font-family": "Comic Sans MS, sans-serif"
    });
    textEl.textContent = text;
    g.appendChild(textEl);

    return g;
  }

  function clearSign() {
    sceneSvg.querySelectorAll("[data-sign]").forEach((n) => n.remove());
  }

  // Hamster.drawInScene дорисовывает хомяка прямо в sceneSvg, поэтому помечаем
  // всё новое атрибутом data-hamster, чтобы потом уметь его убрать.
  function paintHamsterDirect(mood) {
    currentMood = mood;
    const old = sceneSvg.querySelector("[data-hamster]");
    if (old) old.remove();
    const before = new Set(Array.from(sceneSvg.children));
    Hamster.drawInScene(sceneSvg, settings.hamster, mood, layout.hamster);
    Array.from(sceneSvg.children).forEach((child) => {
      if (!before.has(child)) child.setAttribute("data-hamster", "1");
    });
  }

  function clearLeaves() {
    sceneSvg.querySelectorAll("[data-leaf]").forEach((n) => n.remove());
  }

  function placeLeaf(type, text, highlight, x, y, scale) {
    const wrap = document.createElementNS(NS, "g");
    wrap.setAttribute("data-leaf", "1");
    wrap.setAttribute("transform", `translate(${x}, ${y}) scale(${scale})`);
    wrap.dataset.leafType = type;
    wrap.dataset.leafValue = text;
    wrap.appendChild(Leaf.createLeafElement(type, text, highlight));
    sceneSvg.appendChild(wrap);
    return wrap;
  }

  function setLeafHighlight(leafEl, highlight) {
    leafEl.innerHTML = "";
    leafEl.appendChild(
      Leaf.createLeafElement(leafEl.dataset.leafType, leafEl.dataset.leafValue, highlight)
    );
  }

  // Раскладывает семечки с вариантами и табличку с примером.
  function renderRound(example, opts, onPick) {
    clearLeaves();
    clearSign();

    opts.forEach((opt, i) => {
      const pos = layout.seeds[i];
      const leafEl = placeLeaf(settings.leaf, `${opt.value}`, null, pos.x, pos.y, layout.seedScale);
      leafEl.style.cursor = "pointer";
      leafEl.addEventListener("click", (e) => {
        e.stopPropagation();
        onPick(leafEl, opt.correct);
      });
    });

    // Хомяк рисуется после семечек, а табличка — после хомяка, чтобы лапы
    // оказались под её верхним краем.
    paintHamsterDirect("calm");
    sceneSvg.appendChild(drawSign(`${example.a}×${example.b}`, layout.sign.x, layout.sign.y, 1.0));
  }

  // ---------------- Режим "Тренировка" ----------------
  const practice = (() => {
    let example = null;
    let opts = null;
    let locked = false;
    let scoreCorrect = 0;
    let scoreTotal = 0;

    function updateScoreUi() {
      const box = document.getElementById("practice-score");
      const correctEl = document.getElementById("score-correct");
      const totalEl = document.getElementById("score-total");
      if (box) box.hidden = false;
      if (correctEl) correctEl.textContent = scoreCorrect;
      if (totalEl) totalEl.textContent = scoreTotal;
    }

    function newExample() {
      locked = false;
      example = MathGame.nextExample(settings.number);
      opts = MathGame.choices(example.a, example.b, example.answer);
      renderRound(example, opts, onAnswer);
    }

    function onAnswer(leafEl, correct) {
      if (locked) return;
      locked = true;
      scoreTotal += 1;
      if (correct) scoreCorrect += 1;
      else GameState.addMistake(example);
      updateScoreUi();

      setLeafHighlight(leafEl, correct ? "correct" : "wrong");

      // Если ответ неправильный, подсвечиваем ещё и правильную семечку
      if (!correct) {
        sceneSvg.querySelectorAll("[data-leaf]").forEach((leaf) => {
          if (leaf !== leafEl && leaf.dataset.leafValue === String(example.answer)) {
            setLeafHighlight(leaf, "correct");
          }
        });
      }

      paintHamsterDirect(correct ? "happy" : "sad");
      if (correct) Sound.playHappy();
      else Sound.playSad();

      const delay = correct ? 1100 : 2100;
      setTimeout(() => {
        newExample();
        Screens.updateMistakeButton();
      }, delay);
    }

    // Перерисовка после смены ориентации: пример и счёт сохраняем.
    function relayout() {
      if (locked || !example) return;
      renderRound(example, opts, onAnswer);
    }

    function start() {
      scoreCorrect = 0;
      scoreTotal = 0;
      updateScoreUi();
      newExample();
    }

    return { start, relayout };
  })();

  // ---------------- Режим "Работа над ошибками" ----------------
  const mistakeReview = (() => {
    let remainingMistakes = [];
    let currentExample = null;
    let opts = null;
    let locked = false;

    function updateMistakeUi() {
      const box = document.getElementById("mistake-count");
      if (box) {
        box.hidden = false;
        box.textContent = `Осталось ошибок: ${remainingMistakes.length}`;
      }
    }

    function pickRandomMistake() {
      if (remainingMistakes.length === 0) return null;
      const idx = Math.floor(Math.random() * remainingMistakes.length);
      return remainingMistakes[idx];
    }

    function newExample() {
      locked = false;
      currentExample = pickRandomMistake();

      if (!currentExample) {
        // Все ошибки исправлены — возвращаемся в тренировку
        GameState.clearMistakes();
        GameState.set("mode", "practice");
        settings.mode = "practice";
        activeMode = "practice";
        const scoreBox = document.getElementById("practice-score");
        const mistakeBox = document.getElementById("mistake-count");
        if (mistakeBox) mistakeBox.hidden = true;
        if (scoreBox) scoreBox.hidden = false;
        setTimeout(() => {
          practice.start();
          Screens.updateMistakeButton();
        }, 800);
        return;
      }

      opts = MathGame.choices(currentExample.a, currentExample.b, currentExample.answer);
      renderRound(currentExample, opts, onAnswer);
      updateMistakeUi();
    }

    function onAnswer(leafEl, correct) {
      if (locked) return;
      locked = true;

      setLeafHighlight(leafEl, correct ? "correct" : "wrong");

      // Если ответ неправильный, подсвечиваем ещё и правильную семечку
      if (!correct) {
        sceneSvg.querySelectorAll("[data-leaf]").forEach((leaf) => {
          if (leaf !== leafEl && leaf.dataset.leafValue === String(currentExample.answer)) {
            setLeafHighlight(leaf, "correct");
          }
        });
      }

      if (correct) {
        // Убираем этот пример из списка оставшихся ошибок
        remainingMistakes = remainingMistakes.filter(
          m => !(m.a === currentExample.a && m.b === currentExample.b)
        );
        GameState.removeMistake(currentExample);
        updateMistakeUi();
        paintHamsterDirect("happy");
        Sound.playHappy();
      } else {
        // Оставляем пример в списке, чтобы он попался ещё раз
        paintHamsterDirect("sad");
        Sound.playSad();
      }

      const delay = correct ? 1100 : 2100;
      setTimeout(newExample, delay);
    }

    function relayout() {
      if (locked || !currentExample) return;
      renderRound(currentExample, opts, onAnswer);
      updateMistakeUi();
    }

    function start() {
      remainingMistakes = GameState.getMistakes();
      updateMistakeUi();
      newExample();
    }

    return { start, relayout };
  })();

  function start() {
    sceneSvg = document.getElementById("forest-scene");
    settings = GameState.getAll();
    layout = computeLayout();

    // Фон — картинкой, поверх неё уже всё остальное
    sceneSvg.innerHTML = "";
    bgImage = el("image", {
      href: "assets/forest-bg.jpg",
      preserveAspectRatio: "xMidYMid slice",
    });
    sceneSvg.appendChild(bgImage);
    applyLayout();

    paintHamsterDirect("calm");

    const scoreBox = document.getElementById("practice-score");
    const mistakeBox = document.getElementById("mistake-count");

    if (settings.mode === "mistake-review") {
      if (scoreBox) scoreBox.hidden = true;
      if (mistakeBox) mistakeBox.hidden = false;
      activeMode = "mistake-review";
      mistakeReview.start();
    } else {
      if (scoreBox) scoreBox.hidden = false;
      if (mistakeBox) mistakeBox.hidden = true;
      activeMode = "practice";
      practice.start();
    }
    clickHandler = null;

    // Поворот телефона / изменение размера окна — пересобираем раскладку,
    // но пример и счёт не сбрасываем.
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("orientationchange", resizeHandler);
    }
    resizeHandler = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!sceneSvg) return;
        layout = computeLayout();
        applyLayout();
        if (activeMode === "mistake-review") mistakeReview.relayout();
        else practice.relayout();
      }, 150);
    };
    window.addEventListener("resize", resizeHandler);
    window.addEventListener("orientationchange", resizeHandler);
  }

  function stop() {
    if (sceneSvg && clickHandler) {
      sceneSvg.removeEventListener("click", clickHandler);
    }
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      window.removeEventListener("orientationchange", resizeHandler);
    }
    clearTimeout(resizeTimer);
    sceneSvg = null;
    bgImage = null;
    clickHandler = null;
    settings = null;
    resizeHandler = null;
    layout = null;
  }

  return { start, stop };
})();

const Screen = {
  show: (name) => Screens.showScreen(name)
};