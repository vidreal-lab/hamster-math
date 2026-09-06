// "Билетёр" — переключает экраны и запоминает, что выбрал ребёнок.

const Screens = (() => {
  const order = ["hamster", "settings", "game"];
  let currentIndex = 0;

  function screenEl(name) {
    return document.getElementById(`screen-${name}`);
  }

  function showScreen(name) {
    order.forEach((n) => {
      screenEl(n).hidden = n !== name;
    });
    currentIndex = order.indexOf(name);

    if (name === "game") {
      GameScreen.start();
      updateMistakeButton();
    } else {
      GameScreen.stop();
      // Очищаем ошибки при возврате в setup
      if (name === "hamster") {
        GameState.clearMistakes();
      }
    }
  }

  function restoreSelections(root) {
    root.querySelectorAll("[data-choice-group]").forEach((group) => {
      const key = group.dataset.choiceGroup;
      const saved = GameState.get(key);
      if (!saved) return;
      group.querySelectorAll("[data-value]").forEach((btn) => {
        btn.classList.toggle("selected", btn.dataset.value === saved);
      });
    });
  }

  function updateNextButton(screenEl) {
    const nextBtn = screenEl.querySelector("[data-next]");
    if (!nextBtn) return;
    const groups = screenEl.querySelectorAll("[data-choice-group]");
    const allChosen = Array.from(groups).every((group) => {
      const key = group.dataset.choiceGroup;
      return Boolean(GameState.get(key));
    });
    nextBtn.disabled = !allChosen;
  }

  function initChoiceGroups() {
    document.querySelectorAll("[data-choice-group]").forEach((group) => {
      const key = group.dataset.choiceGroup;
      group.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-value]");
        if (!btn) return;
        group.querySelectorAll("[data-value]").forEach((b) => {
          b.classList.toggle("selected", b === btn);
        });
        GameState.set(key, btn.dataset.value);
        updateNextButton(btn.closest(".screen"));
      });
    });
  }

  function initNavButtons() {
    document.querySelectorAll("[data-next]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.disabled) return;
        showScreen(order[currentIndex + 1]);
      });
    });
    document.querySelectorAll("[data-back]").forEach((btn) => {
      btn.addEventListener("click", () => {
        showScreen(order[currentIndex - 1]);
      });
    });
    document.querySelectorAll("[data-to-settings]").forEach((btn) => {
      btn.addEventListener("click", () => {
        showScreen("settings");
      });
    });

    // Кнопка "Работа над ошибками"
    const mistakeBtn = document.getElementById("btn-mistake-review");
    if (mistakeBtn) {
      mistakeBtn.addEventListener("click", () => {
        GameState.set("mode", "mistake-review");
        GameScreen.stop();
        GameScreen.start();
      });
    }
  }

  function updateMistakeButton() {
    const mistakeBtn = document.getElementById("btn-mistake-review");
    if (!mistakeBtn) return;

    const mode = GameState.get("mode");
    const hasMistakes = GameState.hasMistakes();

    // Показываем кнопку только в режиме practice и если есть ошибки
    mistakeBtn.hidden = mode !== "practice";
    mistakeBtn.disabled = !hasMistakes;
  }

  function init() {
    // Устанавливаем режим "practice", семечку "black" и фон по умолчанию
    if (!GameState.get("mode")) {
      GameState.set("mode", "practice");
    }
    if (!GameState.get("leaf")) {
      GameState.set("leaf", "black");
    }
    if (!GameState.get("forest")) {
      GameState.set("forest", "default");
    }
    restoreSelections(document);
    document.querySelectorAll(".screen").forEach((el) => {
      updateNextButton(el);
    });
    initChoiceGroups();
    initNavButtons();
    showScreen("hamster");
  }

  document.addEventListener("DOMContentLoaded", init);

  return { showScreen, updateMistakeButton };
})();
