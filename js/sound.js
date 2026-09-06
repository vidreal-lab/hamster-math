// "Музыкант" — простые звуки победы и грусти через Web Audio, без файлов.

const Sound = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      ctx = new AudioCtx();
    }
    return ctx;
  }

  function tone(freq, start, duration, type, gainPeak) {
    const audio = getCtx();
    if (!audio) return;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(audio.destination);
    const t0 = audio.currentTime + start;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainPeak || 0.2, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  function playHappy() {
    tone(523.25, 0, 0.15, "sine");
    tone(659.25, 0.12, 0.15, "sine");
    tone(783.99, 0.24, 0.22, "sine");
  }

  function playSad() {
    tone(392, 0, 0.18, "sine", 0.15);
    tone(311.13, 0.15, 0.3, "sine", 0.15);
  }

  return { playHappy, playSad };
})();
