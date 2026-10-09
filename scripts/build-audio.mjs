// Writes the game's sounds as WAV files into src/audio/.
//
// Run `node scripts/build-audio.mjs`. Everything is synthesised here, so the
// sounds are covered by the MIT license with the rest of the code. Output is
// mono, 22050 Hz, 16-bit PCM, which every browser Phaser supports can play.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "audio");
const RATE = 22050;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => {
    const clipped = Math.max(-1, Math.min(1, s));
    data.writeInt16LE(Math.round(clipped * 32767), i * 2);
  });
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28); // bytes per second
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

const midiToHz = (note) => 440 * Math.pow(2, (note - 69) / 12);

const waves = {
  square: (phase) => (phase % 1 < 0.5 ? 1 : -1),
  triangle: (phase) => 1 - 4 * Math.abs((phase % 1) - 0.5),
  sine: (phase) => Math.sin(phase * 2 * Math.PI),
};

// Adds one note into `buffer` with a short attack and release, so notes start
// and end at zero and do not click.
function addNote(buffer, start, length, hz, volume, wave) {
  const first = Math.round(start * RATE);
  const count = Math.round(length * RATE);
  const attack = Math.min(0.01 * RATE, count / 4);
  const release = Math.min(0.04 * RATE, count / 3);
  for (let i = 0; i < count && first + i < buffer.length; i++) {
    const envelope = Math.min(1, i / attack, (count - i) / release);
    buffer[first + i] += waves[wave]((hz * i) / RATE) * volume * envelope;
  }
}

// A light, bouncy loop in C major: 8 bars at 120 beats per minute, 16 s.
// The last bar leads back into the first, and every note ends inside the
// loop, so it repeats with no gap or click.
function music() {
  const beat = 0.5;
  const bars = 8;
  const buffer = new Float32Array(Math.round(bars * 4 * beat * RATE));
  const chords = [
    [48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55],
    [57, 60, 64], [53, 57, 60], [55, 59, 62], [55, 59, 62],
  ];
  // Melody, one entry per eighth note: MIDI note or 0 for a rest.
  const melody = [
    72, 0, 76, 79, 76, 0, 74, 72, 77, 0, 76, 74, 72, 0, 69, 0,
    71, 0, 74, 77, 79, 77, 74, 71, 72, 0, 76, 0, 79, 0, 0, 0,
    81, 0, 79, 76, 77, 0, 76, 74, 72, 0, 74, 76, 77, 0, 76, 0,
    74, 0, 76, 77, 79, 0, 77, 74, 71, 0, 72, 74, 74, 0, 0, 0,
  ];
  chords.forEach((chord, bar) => {
    const barStart = bar * 4 * beat;
    for (let b = 0; b < 4; b++) {
      addNote(buffer, barStart + b * beat, beat * 0.45, midiToHz(chord[0] - 12), 0.22, "triangle");
      addNote(buffer, barStart + b * beat + beat / 2, beat * 0.3, midiToHz(chord[(b % 2) + 1]), 0.07, "square");
    }
  });
  melody.forEach((note, i) => {
    if (!note) return;
    addNote(buffer, i * (beat / 2), beat * 0.42, midiToHz(note), 0.12, "square");
  });
  return normalise(buffer, 0.8);
}

// A short descending "bonk" with a little noise, for being hit.
function hurt() {
  const length = 0.4;
  const buffer = new Float32Array(Math.round(length * RATE));
  let phase = 0;
  let seed = 7;
  const noise = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed / 2147483647) * 2 - 1;
  };
  for (let i = 0; i < buffer.length; i++) {
    const t = i / RATE;
    const hz = 420 * Math.pow(0.25, t / length);
    phase += hz / RATE;
    const envelope = Math.min(1, i / (0.005 * RATE)) * Math.pow(1 - t / length, 1.5);
    buffer[i] = (waves.square(phase) * 0.6 + noise() * 0.25) * envelope;
  }
  // As loud on average as the hurt sound it replaced, so it stays under the
  // music, which the game plays at 0.3 volume.
  return normalise(buffer, 0.14);
}

// A quick rising blip, for starting a game and trying again.
function select() {
  const length = 0.16;
  const buffer = new Float32Array(Math.round(length * RATE));
  addNote(buffer, 0, 0.07, midiToHz(76), 0.6, "square");
  addNote(buffer, 0.07, 0.09, midiToHz(84), 0.6, "square");
  // As loud on average as the select sound it replaced.
  return normalise(buffer, 0.36);
}

function normalise(buffer, peak) {
  const max = buffer.reduce((m, s) => Math.max(m, Math.abs(s)), 0) || 1;
  return Array.from(buffer, (s) => (s / max) * peak);
}

const files = { "music.wav": music(), "hurt.wav": hurt(), "select.wav": select() };

for (const [name, samples] of Object.entries(files)) {
  writeFileSync(join(OUT, name), wav(samples));
}

console.log(`Wrote ${Object.keys(files).length} WAV files to src/audio/.`);
