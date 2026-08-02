"use strict";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const load = (file) => {
  const image = new Image();
  image.src = `assets/${file}`;
  return image;
};

const image = {
  tiles: load("bg_neoruins_0.png"),
  tree: [0, 1, 2, 3].map((frame) => load(`spr_blocktree_parts_${frame}.png`)),
  petal: load("spr_blocktree_block_0.png"),
  font: load("fnt_main.png"),
  boxTop: load("spr_textbox_top_0.png"),
  boxLeft: load("spr_textbox_left_0.png"),
  boxCorner: [0, 1, 2, 3, 4, 5, 6, 7].map((frame) => load(`spr_textbox_topleft_${frame}.png`)),
};

const music = Object.assign(new Audio("assets/man.ogg"), { loop: true, autoplay: true });
const textSound = new Audio("assets/snd_text.wav");
const STEP = 1000 / 30;
const TEXT_SCALE = 2;
let musicStarted = false;

const glyphs = new Map(`32,94,92,3,16,3,0
39,111,92,2,16,3,0
40,59,92,4,16,5,0
41,53,92,4,16,5,0
42,2,2,8,16,9,0
44,107,92,2,16,3,0
46,103,92,2,16,3,0
65,42,74,6,16,7,0
69,74,74,6,16,7,0
72,98,74,6,16,7,0
73,106,74,6,16,7,0
78,106,38,6,16,7,0
84,50,20,6,16,7,0
87,21,2,7,16,8,0
89,10,20,6,16,7,0
97,100,2,6,16,7,0
98,92,2,6,16,7,0
99,84,2,6,16,7,0
100,90,20,6,16,7,0
101,106,20,6,16,7,0
102,2,56,6,16,7,0
103,114,20,6,16,7,0
104,114,38,6,16,7,0
105,10,56,6,16,7,0
108,82,38,6,16,7,0
109,30,2,7,16,8,0
110,66,38,6,16,7,0
111,58,38,6,16,7,0
112,50,38,6,16,7,0
114,34,38,6,16,7,0
115,26,38,6,16,7,0
116,18,38,6,16,7,0
117,10,38,6,16,7,0
118,2,38,6,16,7,0
119,39,2,7,16,8,0
121,74,38,6,16,7,0`.split("\n").map((line) => {
  const [code, x, y, width, height, shift, offset] = line.split(",").map(Number);
  return [code, { x, y, width, height, shift, offset }];
}));

const roomTiles = [
  [280, 440], [320, 440], [280, 400], [280, 360], [320, 360], [320, 400], [280, 320], [320, 320],
  [320, 280], [280, 280], [240, 280], [360, 280], [240, 240], [280, 240], [320, 240], [360, 240],
  [360, 200], [320, 200], [280, 200], [240, 200], [200, 240], [200, 200], [200, 160], [240, 160],
  [280, 160], [320, 160], [360, 160], [400, 160], [400, 200], [400, 240], [240, 120], [280, 120],
  [320, 120], [360, 120],
];

let dialogue = null;
let lineIndex = 0;
let typed = 0;
let typeClock = 0;
let choice = false;
let selectedOption = 0;
let answered = false;
let petals = [];
let petalClock = 20 * STEP;

function startMusic() {
  if (!musicStarted) music.play().then(() => { musicStarted = true; }).catch(() => {});
}

function playTextSound() {
  textSound.currentTime = 0;
  textSound.play().catch(() => {});
}

function drawText(text, x, y) {
  let cursor = x;
  for (const character of text) {
    const glyph = glyphs.get(character.charCodeAt(0));
    if (!glyph) continue;
    ctx.drawImage(image.font, glyph.x, glyph.y, glyph.width, glyph.height, cursor + glyph.offset, y, glyph.width * TEXT_SCALE, glyph.height * TEXT_SCALE);
    cursor += glyph.shift * TEXT_SCALE;
  }
}

function beginDialogue(lines, hasChoice = false) {
  dialogue = lines;
  lineIndex = 0;
  typed = 0;
  choice = hasChoice;
  typeClock = performance.now();
}

function currentLine() {
  return dialogue[lineIndex];
}

function advanceDialogue() {
  if (typed < currentLine().length) {
    typed = currentLine().length;
    return;
  }
  if (choice && lineIndex === dialogue.length - 1) return;
  if (lineIndex < dialogue.length - 1) {
    lineIndex += 1;
    typed = 0;
    typeClock = performance.now();
  } else {
    dialogue = null;
  }
}

function choose() {
  answered = true;
  beginDialogue([selectedOption === 0 ? "* (You received an Egg.)" : "* (Then he needn't be here.)"]);
}

function openTreeDialogue() {
  if (answered) beginDialogue(["* (It is a tree.)"]);
  else beginDialogue(["* (Well, there is a man here.)", "* (He offered you something.)"], true);
}

function point(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * 640 / rect.width, y: (event.clientY - rect.top) * 480 / rect.height };
}

canvas.addEventListener("click", (event) => {
  startMusic();
  const cursor = point(event);
  if (!dialogue) {
    if (cursor.x >= 200 && cursor.x <= 450 && cursor.y >= 80 && cursor.y <= 270) openTreeDialogue();
    return;
  }
  if (choice && typed === currentLine().length && lineIndex === dialogue.length - 1 && cursor.y >= 400) {
    selectedOption = cursor.x < 180 ? 0 : 1;
    choose();
  } else advanceDialogue();
});

function update(time) {
  if (dialogue && typed < currentLine().length) {
    const count = Math.floor((time - typeClock) / STEP);
    if (count > 0) {
      typed = Math.min(currentLine().length, typed + count);
      typeClock += count * STEP;
      playTextSound();
    }
  }
  if (time >= petalClock) {
    petals.push({ x: 266 + Math.random() * 52, y: 102 + Math.random() * 45, vx: .4 + Math.random(), vy: .7 + Math.random() * 1.5, born: time });
    petalClock = time + 20 * STEP;
  }
  petals = petals.filter((petal) => time - petal.born < 2000);
}

function drawTree(time) {
  ctx.drawImage(image.tree[1], 240, 80, 210, 182);
  ctx.drawImage(image.tree[2], 240 + Math.sin(time / 200) * 2, 80 + Math.cos(time / 333) * 2, 210, 182);
  ctx.drawImage(image.tree[3], 240 + Math.sin(time / 233), 80 + Math.cos(time / 400), 210, 182);
  for (const petal of petals) {
    const age = time - petal.born;
    const step = Math.floor(age / STEP);
    const alpha = step < 18 ? Math.min(1, (step + 1) * .2) : Math.max(0, 1 - (step - 17) / 43);
    ctx.globalAlpha = alpha;
    ctx.drawImage(image.petal, petal.x + petal.vx * step, petal.y + petal.vy * step, 32, 20);
  }
  ctx.globalAlpha = 1;
}

function drawBoxSprite(sprite, x, y, width, height, flipX = false, flipY = false) {
  ctx.save();
  ctx.translate(flipX ? x + width : x, flipY ? y + height : y);
  ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
  ctx.drawImage(sprite, 0, 0, width, height);
  ctx.restore();
}

function drawDialogue(time) {
  if (!dialogue) return;
  const corner = image.boxCorner[Math.floor(time / 166) % 8];
  ctx.fillStyle = "#000";
  ctx.fillRect(54, 334, 532, 121);
  drawBoxSprite(image.boxTop, 72, 320, 497, 32);
  drawBoxSprite(image.boxTop, 72, 439, 497, 32, false, true);
  drawBoxSprite(image.boxLeft, 40, 352, 32, 87);
  drawBoxSprite(image.boxLeft, 569, 352, 32, 87, true);
  drawBoxSprite(corner, 40, 320, 32, 32);
  drawBoxSprite(corner, 569, 320, 32, 32, true);
  drawBoxSprite(corner, 40, 439, 32, 32, false, true);
  drawBoxSprite(corner, 569, 439, 32, 32, true, true);
  drawText(currentLine().slice(0, typed), 64, 346);
  if (choice && typed === currentLine().length && lineIndex === dialogue.length - 1) {
    drawText(selectedOption === 0 ? "* Yes" : "  Yes", 64, 400);
    drawText(selectedOption === 1 ? "* No" : "  No", 214, 400);
  }
}

function frame(time) {
  update(time);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 640, 480);
  for (const [x, y] of roomTiles) ctx.drawImage(image.tiles, 80, 40, 40, 40, x, y, 40, 40);
  drawTree(time);
  drawDialogue(time);
  requestAnimationFrame(frame);
}

addEventListener("pointerdown", startMusic, { once: true });
addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (!["enter", "z", "x", "c", "arrowleft", "arrowright"].includes(key)) return;
  event.preventDefault();
  startMusic();
  if (!dialogue) return;
  if (choice && typed === currentLine().length && lineIndex === dialogue.length - 1) {
    if (key === "arrowleft" || key === "arrowright") selectedOption = selectedOption ? 0 : 1;
    else choose();
  } else advanceDialogue();
});

startMusic();
requestAnimationFrame(frame);
