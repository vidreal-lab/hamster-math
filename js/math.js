// "Учитель" — придумывает примеры умножения и варианты ответов для "Тренировки".

const MathGame = (() => {
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function nextExample(numberSetting) {
    const a = numberSetting === "random" ? randomInt(2, 9) : Number(numberSetting);
    const b = randomInt(2, 9);
    return { a, b, answer: a * b };
  }

  // Три листа-ответа: правильный + два "похожих" неправильных
  // (соседние по таблице умножения числа), в случайном порядке.
  function choices(a, b, answer) {
    const candidates = new Set();
    const tryAdd = (v) => {
      if (v > 0 && v !== answer) candidates.add(v);
    };
    tryAdd(a * (b - 1));
    tryAdd(a * (b + 1));
    tryAdd((a - 1) * b);
    tryAdd((a + 1) * b);
    tryAdd(answer + a);
    tryAdd(answer - a);
    tryAdd(answer + b);
    tryAdd(answer - b);

    const pool = Array.from(candidates);
    const wrong = [];
    while (wrong.length < 2 && pool.length > 0) {
      const i = randomInt(0, pool.length - 1);
      wrong.push(pool[i]);
      pool.splice(i, 1);
    }
    while (wrong.length < 2) {
      const v = randomInt(2, 81);
      if (v !== answer && !wrong.includes(v)) wrong.push(v);
    }

    const list = [
      { value: answer, correct: true },
      { value: wrong[0], correct: false },
      { value: wrong[1], correct: false },
    ];
    // перемешиваем
    for (let i = list.length - 1; i > 0; i--) {
      const j = randomInt(0, i);
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  return { nextExample, choices, randomInt };
})();
