// "Блокнот" игры — тут храним, что выбрал ребёнок.
// Другие файлы читают и меняют эти значения через простые функции.

const GameState = (() => {
  const STORAGE_KEY = "hamster-math-state";

  const defaults = {
    hamster: null,   // "rusty" | "grey" | "white"
    forest: null,     // "sunny" | "sunset" | "foggy"
    leaf: null,       // "oak" | "maple" | "birch"
    number: null,     // "2".."9" | "random"
    mode: null,       // "show" | "practice"
    mistakes: [],    // [{a, b, answer}] - неправильно решенные примеры
  };

  let data = { ...defaults };

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        data = { ...defaults, ...JSON.parse(saved) };
      }
    } catch (e) {
      data = { ...defaults };
    }
    return data;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // если localStorage недоступен — просто не сохраняем, игра всё равно работает
    }
  }

  function set(key, value) {
    data[key] = value;
    save();
  }

  function get(key) {
    return data[key];
  }

  function getAll() {
    return { ...data };
  }

  function addMistake(example) {
    // Добавляем только уникальные примеры (проверяем a и b)
    const exists = data.mistakes.some(m => m.a === example.a && m.b === example.b);
    if (!exists) {
      data.mistakes.push({ a: example.a, b: example.b, answer: example.answer });
      save();
    }
  }

  function getMistakes() {
    return [...data.mistakes];
  }

  function removeMistake(example) {
    data.mistakes = data.mistakes.filter(m => !(m.a === example.a && m.b === example.b));
    save();
  }

  function clearMistakes() {
    data.mistakes = [];
    save();
  }

  function hasMistakes() {
    return data.mistakes.length > 0;
  }

  function reset() {
    data = { ...defaults };
    save();
  }

  load();

  return { set, get, getAll, addMistake, getMistakes, removeMistake, clearMistakes, hasMistakes, reset };
})();
