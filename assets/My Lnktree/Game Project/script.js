const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const W = canvas.width, H = canvas.height;

// ---------- DOM refs ----------
const hpEl = document.getElementById("hp");
const scoreNumEl = document.getElementById("scoreNum");
const comboEl = document.getElementById("combo");
const comboNumEl = document.getElementById("comboNum");
const titleScreen = document.getElementById("titleScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreText = document.getElementById("finalScoreText");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");

// ---------- Game state ----------
const keys = {};
let state = "title"; // "title" | "playing" | "gameover"
let score = 0;
let combo = 0, comboTimer = 0;
let shakeTime = 0, shakeMag = 0;
let flashTime = 0, flashColor = "#fff";
let time = 0;

const player = {
  x: W/2, y: H/2, r: 20, speed: 3.5,
  hp: 100, maxHp: 100, dirX: 0, dirY: 1, walk: 0,
  attackTimer: 0, attackCooldown: 0, invuln: 0
};

let enemies = [];
let particles = [];   // combat sparkles / coins
let petals = [];      // ambient falling sakura petals
let slashes = [];     // attack slash arcs

function makeEnemy(x, y) {
  return {
    x, y, r: 17, speed: 0.65 + Math.random()*0.35,
    wobble: Math.random()*10, blink: 2 + Math.random()*3, hue: Math.random()
  };
}

function initEnemies() {
  enemies = [];
  for (let i = 0; i < 7; i++) {
    enemies.push(makeEnemy(60 + Math.random()*(W-120), 80 + Math.random()*(H-140)));
  }
}

function initPetals() {
  petals = [];
  for (let i = 0; i < 26; i++) {
    petals.push({
      x: Math.random()*W, y: Math.random()*H,
      s: 3 + Math.random()*3, vy: 0.35 + Math.random()*0.5,
      vx: -0.3 + Math.random()*0.6, rot: Math.random()*Math.PI*2,
      vr: -0.02 + Math.random()*0.04
    });
  }
}
initPetals();
initEnemies();

// ---------- Input ----------
addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  keys[e.key] = true;
  if (e.code === "Space") {
    e.preventDefault();
    if (state === "title") startGame();
    else if (state === "playing") attack();
  }
  if (state === "gameover" && e.key.toLowerCase() === "r") resetGame();
});
addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
  keys[e.key] = false;
});

function bindButton(btn, key) {
  const down = e => { e.preventDefault(); keys[key] = true; };
  const up = e => { e.preventDefault(); keys[key] = false; };
  btn.addEventListener("pointerdown", down);
  btn.addEventListener("pointerup", up);
  btn.addEventListener("pointercancel", up);
  btn.addEventListener("pointerleave", up);
}
document.querySelectorAll("[data-key]").forEach(b => bindButton(b, b.dataset.key));
document.getElementById("attack").addEventListener("pointerdown", e => {
  e.preventDefault();
  if (state === "playing") attack();
});

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", resetGame);

function startGame() {
  state = "playing";
  titleScreen.classList.add("hidden");
}

function resetGame() {
  player.x = W/2; player.y = H/2; player.hp = player.maxHp;
  player.attackTimer = 0; player.attackCooldown = 0; player.invuln = 0;
  score = 0; combo = 0; comboTimer = 0;
  particles = []; slashes = [];
  initEnemies();
  scoreNumEl.textContent = score;
  comboEl.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  state = "playing";
}

// ---------- Actions ----------
function attack() {
  if (player.attackCooldown > 0) return;
  player.attackTimer = 14;
  player.attackCooldown = 28;

  const baseAngle = Math.atan2(player.dirY, player.dirX);
  slashes.push({ x: player.x, y: player.y, angle: baseAngle, life: 14, maxLife: 14 });

  let hitCount = 0;
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    const dx = e.x - player.x, dy = e.y - player.y;
    const d = Math.hypot(dx, dy);
    if (d < 70) {
      enemies.splice(i, 1);
      score++;
      hitCount++;
      burst(e.x, e.y, 18);
      spawnEnemy();
    }
  }
  if (hitCount > 0) {
    combo += hitCount;
    comboTimer = 90;
    comboNumEl.textContent = combo;
    comboEl.classList.remove("hidden");
    comboEl.style.animation = "none";
    void comboEl.offsetWidth;
    comboEl.style.animation = "comboPop .18s ease";
  }
}

function spawnEnemy() {
  const side = Math.floor(Math.random()*4);
  let x, y;
  if (side === 0) { x = 30; y = Math.random()*H; }
  else if (side === 1) { x = W-30; y = Math.random()*H; }
  else if (side === 2) { x = Math.random()*W; y = 40; }
  else { x = Math.random()*W; y = H-40; }
  enemies.push(makeEnemy(x, y));
}

function burst(x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = Math.random()*Math.PI*2, s = 1+Math.random()*3;
    const gold = Math.random() < 0.4;
    particles.push({
      x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s,
      life: 25+Math.random()*20, gold
    });
  }
}

function shake(mag, dur) {
  shakeMag = mag; shakeTime = dur;
}

// ---------- Update ----------
function update() {
  time++;
  updatePetals();

  if (state !== "playing") return;

  let dx = 0, dy = 0;
  if (keys["w"] || keys["ArrowUp"]) dy--;
  if (keys["s"] || keys["ArrowDown"]) dy++;
  if (keys["a"] || keys["ArrowLeft"]) dx--;
  if (keys["d"] || keys["ArrowRight"]) dx++;

  if (dx || dy) {
    const len = Math.hypot(dx,dy);
    dx/=len; dy/=len;
    player.x += dx*player.speed;
    player.y += dy*player.speed;
    player.dirX=dx; player.dirY=dy;
    player.walk += .22;
  }
  player.x=Math.max(30,Math.min(W-30,player.x));
  player.y=Math.max(55,Math.min(H-30,player.y));

  if (player.attackTimer>0) player.attackTimer--;
  if (player.attackCooldown>0) player.attackCooldown--;
  if (player.invuln>0) player.invuln--;

  if (comboTimer > 0) {
    comboTimer--;
    if (comboTimer === 0) { combo = 0; comboEl.classList.add("hidden"); }
  }

  enemies.forEach(e => {
    const edx=player.x-e.x, edy=player.y-e.y, d=Math.hypot(edx,edy)||1;
    e.x += edx/d*e.speed;
    e.y += edy/d*e.speed;
    e.wobble += .08;

    if (d < player.r+e.r && player.invuln<=0) {
      player.hp -= 8;
      player.invuln=35;
      burst(player.x,player.y,10);
      shake(6, 12);
      flashTime = 8; flashColor = "#ff4f6d";
      if(player.hp<=0) {
        player.hp = 0;
        state = "gameover";
        finalScoreText.textContent = "Musuh dikalahkan: " + score;
        gameOverScreen.classList.remove("hidden");
      }
    }
  });

  for (let i=particles.length-1;i>=0;i--) {
    const p=particles[i];
    p.x+=p.vx; p.y+=p.vy; p.vx*=.96; p.vy*=.96; p.life--;
    if(p.life<=0) particles.splice(i,1);
  }

  for (let i=slashes.length-1;i>=0;i--) {
    slashes[i].life--;
    if (slashes[i].life<=0) slashes.splice(i,1);
  }

  if (shakeTime>0) shakeTime--;
  if (flashTime>0) flashTime--;

  hpEl.style.width = Math.max(0,player.hp)+"%";
  hpEl.style.background = player.hp > 50
    ? "linear-gradient(180deg,#ff8fb0,#fb4f7b)"
    : player.hp > 25
      ? "linear-gradient(180deg,#ffd27a,#f6a13b)"
      : "linear-gradient(180deg,#ff8a8a,#e23b3b)";
  scoreNumEl.textContent = score;
}

function updatePetals() {
  petals.forEach(p => {
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    if (p.y > H+10) { p.y = -10; p.x = Math.random()*W; }
    if (p.x < -10) p.x = W+10;
    if (p.x > W+10) p.x = -10;
  });
}

// ---------- Drawing ----------
function drawBackground() {
  // grass gradient
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"#8ccf6b");
  g.addColorStop(1,"#6bab4d");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // checker texture
  const tile = 40;
  for (let y=0;y<H;y+=tile) {
    for (let x=0;x<W;x+=tile) {
      if (((x/tile)+(y/tile))%2===0) {
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        ctx.fillRect(x,y,tile,tile);
      }
    }
  }

  // path
  const pg = ctx.createLinearGradient(0,235,0,305);
  pg.addColorStop(0,"#d8c290");
  pg.addColorStop(1,"#b89e6c");
  ctx.fillStyle = pg;
  ctx.fillRect(0,235,W,70);
  ctx.fillRect(445,0,70,H);

  ctx.strokeStyle="#efe0b3aa"; ctx.lineWidth=4; ctx.setLineDash([18,18]);
  ctx.beginPath(); ctx.moveTo(0,270); ctx.lineTo(W,270); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(480,0); ctx.lineTo(480,H); ctx.stroke();
  ctx.setLineDash([]);

  // bushes
  for(let i=0;i<70;i++){
    const x=(i*137)%W, y=(i*71)%H;
    if (Math.abs(y-270)<45 || Math.abs(x-480)<45) continue;
    ctx.fillStyle="rgba(70,130,60,0.55)";
    ctx.beginPath(); ctx.arc(x,y,5+(i%4),0,Math.PI*2); ctx.fill();
  }

  // little ground flowers
  for(let i=0;i<25;i++){
    const x=(i*211)%W, y=(i*97)%H;
    ctx.fillStyle="#f7a9c4";
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fill();
  }

  // sakura trees in corners
  drawTree(60, 55);
  drawTree(W-60, H-55);
}

function drawTree(x,y){
  ctx.save();
  ctx.translate(x,y);
  ctx.fillStyle="#0002";
  ctx.beginPath(); ctx.ellipse(0,34,40,12,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#7a5230";
  ctx.fillRect(-7,-4,14,38);
  const canopy = ctx.createRadialGradient(-10,-25,5,0,-20,46);
  canopy.addColorStop(0,"#ffd9e6");
  canopy.addColorStop(1,"#f28fb3");
  ctx.fillStyle = canopy;
  ctx.beginPath(); ctx.arc(0,-22,46,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#fff3f8aa";
  for(let i=0;i<10;i++){
    const a=(i/10)*Math.PI*2;
    ctx.beginPath();
    ctx.arc(Math.cos(a)*30, -22+Math.sin(a)*26, 4,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPetals() {
  petals.forEach(p => {
    ctx.save();
    ctx.translate(p.x,p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = "#ffd6e4dd";
    ctx.beginPath();
    ctx.ellipse(0,0,p.s,p.s*0.55,0,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  });
}

function drawEnemy(e) {
  ctx.save();
  ctx.translate(e.x,e.y+Math.sin(e.wobble)*2);

  ctx.fillStyle="#0003"; ctx.beginPath(); ctx.ellipse(0,17,18,6,0,0,Math.PI*2); ctx.fill();

  const bodyGrad = ctx.createRadialGradient(-5,-6,3,0,4,20);
  bodyGrad.addColorStop(0,"#b98be0");
  bodyGrad.addColorStop(1,"#6c3a92");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath(); ctx.arc(0,2,15,0,Math.PI*2); ctx.fill();

  const headGrad = ctx.createRadialGradient(-4,-13,2,0,-6,14);
  headGrad.addColorStop(0,"#c9a2ea");
  headGrad.addColorStop(1,"#8f56b8");
  ctx.fillStyle = headGrad;
  ctx.beginPath(); ctx.arc(0,-9,12,0,Math.PI*2); ctx.fill();

  const blinking = (time % Math.floor(e.blink*60)) < 4;
  ctx.fillStyle="white";
  ctx.beginPath();
  if (blinking) {
    ctx.rect(-8,-11,6,2); ctx.rect(2,-11,6,2);
  } else {
    ctx.arc(-5,-10,3,0,Math.PI*2); ctx.arc(5,-10,3,0,Math.PI*2);
  }
  ctx.fill();
  if (!blinking) {
    ctx.fillStyle="#222";
    ctx.beginPath(); ctx.arc(-5,-10,1.5,0,Math.PI*2); ctx.arc(5,-10,1.5,0,Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawSlashes() {
  slashes.forEach(s => {
    const t = 1 - s.life / s.maxLife;
    const spread = 1.1;
    const radius = 46 + t*14;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - t);
    const grad = ctx.createLinearGradient(s.x, s.y, s.x + Math.cos(s.angle)*radius, s.y + Math.sin(s.angle)*radius);
    grad.addColorStop(0, "#fff7c2");
    grad.addColorStop(1, "#ffe07a00");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 7 - t*4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(s.x, s.y, radius, s.angle - spread/2, s.angle + spread/2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawPlayer() {
  ctx.save();
  ctx.translate(player.x,player.y);
  const bob = Math.sin(player.walk)*2;
  ctx.translate(0,bob);

  if (player.invuln > 0 && Math.floor(player.invuln/4)%2===0) {
    ctx.globalAlpha = 0.55;
  }

  ctx.fillStyle="#0003"; ctx.beginPath(); ctx.ellipse(0,22,20,7,0,0,Math.PI*2); ctx.fill();

  // legs
  ctx.strokeStyle="#3b3154"; ctx.lineWidth=7; ctx.lineCap="round";
  const step=Math.sin(player.walk)*5;
  ctx.beginPath(); ctx.moveTo(-6,13); ctx.lineTo(-7-step,25); ctx.moveTo(6,13); ctx.lineTo(7+step,25); ctx.stroke();

  // dress with gradient
  const dressGrad = ctx.createLinearGradient(0,-1,0,17);
  dressGrad.addColorStop(0,"#ff86ab");
  dressGrad.addColorStop(1,"#d8446f");
  ctx.fillStyle = dressGrad;
  ctx.beginPath(); ctx.moveTo(-15,-1); ctx.lineTo(15,-1); ctx.lineTo(22,17); ctx.lineTo(-22,17); ctx.closePath(); ctx.fill();
  ctx.strokeStyle="#ffffff55"; ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(-15,-1); ctx.lineTo(15,-1); ctx.stroke();

  // arms
  ctx.strokeStyle="#ffd4bd"; ctx.lineWidth=6;
  ctx.beginPath(); ctx.moveTo(-13,1); ctx.lineTo(-22+step*.5,10); ctx.moveTo(13,1); ctx.lineTo(22-step*.5,10); ctx.stroke();

  // hair behind head
  const hairGrad = ctx.createRadialGradient(-6,-20,3,0,-15,22);
  hairGrad.addColorStop(0,"#7455a0");
  hairGrad.addColorStop(1,"#4a3168");
  ctx.fillStyle = hairGrad;
  ctx.beginPath(); ctx.arc(0,-15,19,0,Math.PI*2); ctx.fill();

  // face
  ctx.fillStyle="#ffd4bd"; ctx.beginPath(); ctx.arc(0,-16,14,0,Math.PI*2); ctx.fill();
  // cheeks
  ctx.fillStyle="#ff9fb3aa";
  ctx.beginPath(); ctx.arc(-8,-13,2.4,0,Math.PI*2); ctx.arc(8,-13,2.4,0,Math.PI*2); ctx.fill();

  // hair top + bangs
  ctx.fillStyle = hairGrad;
  ctx.beginPath(); ctx.arc(0,-21,16,Math.PI,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-15,-22); ctx.lineTo(-5,-12); ctx.lineTo(0,-22); ctx.lineTo(5,-12); ctx.lineTo(15,-22); ctx.closePath(); ctx.fill();

  // eyes
  ctx.fillStyle="#38244d";
  ctx.beginPath(); ctx.arc(-5,-16,2.2,0,Math.PI*2); ctx.arc(5,-16,2.2,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#ffffffaa";
  ctx.beginPath(); ctx.arc(-4.3,-16.6,0.8,0,Math.PI*2); ctx.arc(5.7,-16.6,0.8,0,Math.PI*2); ctx.fill();

  // ribbon
  ctx.fillStyle="#f6d15a";
  ctx.beginPath(); ctx.arc(0,-28,4,0,Math.PI*2); ctx.fill();
  ctx.fillStyle="#e8bb3f";
  ctx.beginPath(); ctx.moveTo(-4,-28); ctx.lineTo(-9,-24); ctx.lineTo(-4,-25); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(4,-28); ctx.lineTo(9,-24); ctx.lineTo(4,-25); ctx.closePath(); ctx.fill();

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawParticles(){
  particles.forEach(p=>{
    ctx.globalAlpha=Math.max(0,p.life/40);
    ctx.fillStyle = p.gold ? "#ffe07a" : "#ff9fc0";
    ctx.beginPath(); ctx.arc(p.x,p.y,p.gold?2.4:3,0,Math.PI*2); ctx.fill();
  });
  ctx.globalAlpha=1;
}

function draw() {
  ctx.save();
  if (shakeTime > 0) {
    const mag = shakeMag * (shakeTime/12);
    ctx.translate((Math.random()-0.5)*mag, (Math.random()-0.5)*mag);
  }

  drawBackground();
  drawPetals();
  if (state !== "title") {
    enemies.forEach(drawEnemy);
    drawSlashes();
    drawPlayer();
    drawParticles();
  }

  ctx.restore();

  if (flashTime > 0) {
    ctx.globalAlpha = (flashTime/8) * 0.35;
    ctx.fillStyle = flashColor;
    ctx.fillRect(0,0,W,H);
    ctx.globalAlpha = 1;
  }

  // vignette
  const vg = ctx.createRadialGradient(W/2,H/2,H*0.35,W/2,H/2,H*0.75);
  vg.addColorStop(0,"rgba(0,0,0,0)");
  vg.addColorStop(1,"rgba(0,0,0,0.28)");
  ctx.fillStyle = vg;
  ctx.fillRect(0,0,W,H);
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
