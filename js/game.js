// "Дирижёр" — командует игровым экраном: рисует лес и хомяка, крутит
// "Показ" (3 клика: пример → ответ → новый пример) и "Тренировку"
// (пример + 3 листа-ответа, счёт, настроение хомяка, звук).

const GameScreen = (() => {
  const NS = "http://www.w3.org/2000/svg";
  let sceneSvg = null;
  let clickHandler = null;
  let settings = null;

  function el(tag, attrs) {
    const elem = document.createElementNS(NS, tag);
    for (const k in attrs) elem.setAttribute(k, attrs[k]);
    return elem;
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

  // Hamster.drawInScene читает viewBox сцены через getAttribute, поэтому
  // рисуем прямо в sceneSvg, а не в промежуточной группе.
  function paintHamsterDirect(mood) {
    const old = sceneSvg.querySelector("[data-hamster]");
    if (old) old.remove();
    const before = new Set(Array.from(sceneSvg.children));
    Hamster.drawInScene(sceneSvg, settings.hamster, mood);
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

  // ---------------- Режим "Показ" ----------------
  // Удалён — остался только режим "Тренировка"

  // ---------------- Режим "Тренировка" ----------------
  const practice = (() => {
    let example = null;
    let locked = false;
    let scoreCorrect = 0;
    let scoreTotal = 0;
    const answerPositions = [
      { x: 620, y: 470 },
      { x: 700, y: 470 },
      { x: 780, y: 470 },
    ];

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
      const opts = MathGame.choices(example.a, example.b, example.answer);
      clearLeaves();
      clearSign();

      // Сначала листья с вариантами ответов
      opts.forEach((opt, i) => {
        const pos = answerPositions[i];
        const leafEl = placeLeaf(settings.leaf, `${opt.value}`, null, pos.x, pos.y, 1.35);
        leafEl.style.cursor = "pointer";
        leafEl.addEventListener("click", (e) => {
          e.stopPropagation();
          onAnswer(leafEl, opt.correct);
        });
      });

      // Затем хомяк
      paintHamsterDirect("calm");

      // Табличка после хомяка (немного ниже лап, чтобы лапы были над верхним краем)
      sceneSvg.appendChild(drawSign(`${example.a}×${example.b}`, 430, 470, 1.0));
    }

    function onAnswer(leafEl, correct) {
      if (locked) return;
      locked = true;
      scoreTotal += 1;
      if (correct) scoreCorrect += 1;
      else GameState.addMistake(example);
      updateScoreUi();

      setLeafHighlight(leafEl, correct ? "correct" : "wrong");

      // Если ответ неправильный, подсвечиваем правильный лист
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

    function start() {
      scoreCorrect = 0;
      scoreTotal = 0;
      updateScoreUi();
      newExample();
    }

    return { start };
  })();

  // ---------------- Режим "Работа над ошибками" ----------------
  const mistakeReview = (() => {
    let remainingMistakes = [];
    let currentExample = null;
    let locked = false;
    const answerPositions = [
      { x: 620, y: 470 },
      { x: 700, y: 470 },
      { x: 780, y: 470 },
    ];

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
        // Все ошибки исправлены - возвращаемся в тренировку
        GameState.clearMistakes();
        GameState.set("mode", "practice");
        const scoreBox = document.getElementById("practice-score");
        const mistakeBox = document.getElementById("mistake-count");
        if (mistakeBox) mistakeBox.hidden = true;
        if (scoreBox) scoreBox.hidden = false;
        setTimeout(() => {
          practice.start();
        }, 800);
        return;
      }

      const opts = MathGame.choices(currentExample.a, currentExample.b, currentExample.answer);
      clearLeaves();
      clearSign();

      // Сначала листья с вариантами ответов
      opts.forEach((opt, i) => {
        const pos = answerPositions[i];
        const leafEl = placeLeaf(settings.leaf, `${opt.value}`, null, pos.x, pos.y, 1.35);
        leafEl.style.cursor = "pointer";
        leafEl.addEventListener("click", (e) => {
          e.stopPropagation();
          onAnswer(leafEl, opt.correct);
        });
      });

      // Затем хомяк
      paintHamsterDirect("calm");

      // Табличка после хомяка
      sceneSvg.appendChild(drawSign(`${currentExample.a}×${currentExample.b}`, 430, 470, 1.0));

      updateMistakeUi();
    }

    function onAnswer(leafEl, correct) {
      if (locked) return;
      locked = true;

      setLeafHighlight(leafEl, correct ? "correct" : "wrong");

      // Если ответ неправильный, подсвечиваем правильный лист
      if (!correct) {
        sceneSvg.querySelectorAll("[data-leaf]").forEach((leaf) => {
          if (leaf !== leafEl && leaf.dataset.leafValue === String(currentExample.answer)) {
            setLeafHighlight(leaf, "correct");
          }
        });
      }

      if (correct) {
        // Удаляем этот пример из списка оставшихся ошибок
        remainingMistakes = remainingMistakes.filter(
          m => !(m.a === currentExample.a && m.b === currentExample.b)
        );
        GameState.removeMistake(currentExample);
        updateMistakeUi();
        paintHamsterDirect("happy");
        Sound.playHappy();
      } else {
        // Оставляем пример в списке, переходим к следующему
        paintHamsterDirect("sad");
        Sound.playSad();
      }

      const delay = correct ? 1100 : 2100;
      setTimeout(newExample, delay);
    }

    function start() {
      remainingMistakes = GameState.getMistakes();
      newExample();
    }

    return { start };
  })();

  function start() {
    sceneSvg = document.getElementById("forest-scene");
    settings = GameState.getAll();

    // Очищаем сцену и добавляем фон изображением
    sceneSvg.innerHTML = "";

    // Добавляем фоновое изображение
    const bgImage = document.createElementNS(NS, "image");
    bgImage.setAttribute("href", "assets/resh forest.jpg");
    bgImage.setAttribute("x", "0");
    bgImage.setAttribute("y", "0");
    bgImage.setAttribute("width", "900");
    bgImage.setAttribute("height", "600");
    bgImage.setAttribute("preserveAspectRatio", "xMidYMid slice");
    sceneSvg.appendChild(bgImage);

    paintHamsterDirect("calm");

    const scoreBox = document.getElementById("practice-score");
    const mistakeBox = document.getElementById("mistake-count");

    if (settings.mode === "mistake-review") {
      if (scoreBox) scoreBox.hidden = true;
      if (mistakeBox) mistakeBox.hidden = false;
      mistakeReview.start();
      clickHandler = null;
    } else {
      // Всегда запускаем режим "Тренировка"
      if (scoreBox) scoreBox.hidden = false;
      if (mistakeBox) mistakeBox.hidden = true;
      practice.start();
      clickHandler = null;
    }
  }

  function stop() {
    if (sceneSvg && clickHandler) {
      sceneSvg.removeEventListener("click", clickHandler);
    }
    sceneSvg = null;
    clickHandler = null;
    settings = null;
  }

  return { start, stop };
})();

const Screen = {
  show: (name) => Screens.showScreen(name)
};
