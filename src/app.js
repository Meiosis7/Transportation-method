const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d');
const statusEl = document.querySelector('#status');
const modeTitle = document.querySelector('#modeTitle');
const modeText = document.querySelector('#modeText');
const focusName = document.querySelector('#focusName');
const structureDot = document.querySelector('#structureDot');
const infoText = document.querySelector('#infoText');
const gradientFact = document.querySelector('#gradientFact');
const proteinFact = document.querySelector('#proteinFact');
const typeFact = document.querySelector('#typeFact');
const energyFact = document.querySelector('#energyFact');
const exampleFact = document.querySelector('#exampleFact');
const timeline = document.querySelector('#timeline');
const playBtn = document.querySelector('#playBtn');
const resetBtn = document.querySelector('#resetBtn');
const compareBtn = document.querySelector('#compareBtn');
const closeCompareBtn = document.querySelector('#closeCompareBtn');
const comparePanel = document.querySelector('#comparePanel');
const proteinBtn = document.querySelector('#proteinBtn');
const closeProteinBtn = document.querySelector('#closeProteinBtn');
const proteinPanel = document.querySelector('#proteinPanel');
const knowledgePanel = document.querySelector('#knowledgePanel');
const knowledgeToggle = document.querySelector('#knowledgeToggle');

const modes = [
  {
    id: 'free',
    title: '自由扩散',
    short: '自由扩散',
    text: '小分子或脂溶性物质直接穿过磷脂双分子层，从高浓度一侧向低浓度一侧扩散。',
    focus: '不需要转运蛋白',
    gradient: '顺浓度梯度',
    protein: '不需要',
    proteinType: '无',
    energy: '不消耗 ATP',
    examples: '小部分水；小分子脂溶性物质：甘油、乙醇、苯、胆固醇、性激素',
    color: '#2f8cff',
    direction: 'down',
    transporter: 'none',
  },
  {
    id: 'facilitated',
    title: '协助扩散',
    short: '协助扩散',
    text: '离子或较大的极性分子需要通道蛋白或载体蛋白协助，仍然从高浓度流向低浓度。',
    focus: '需要通道蛋白或载体蛋白',
    gradient: '顺浓度梯度',
    protein: '需要',
    proteinType: '通道蛋白 / 载体蛋白',
    energy: '不消耗 ATP',
    examples: '葡萄糖进入多数组织细胞；水通道；Na+、K+、Ca2+、Cl- 离子通道',
    color: '#14b8a6',
    direction: 'down',
    transporter: 'channel',
  },
  {
    id: 'active',
    title: '主动运输',
    short: '主动运输',
    text: '物质通过载体蛋白逆浓度梯度运输，需要细胞提供 ATP 能量。',
    focus: '需要载体蛋白',
    gradient: '逆浓度梯度',
    protein: '需要',
    proteinType: '载体蛋白',
    energy: '消耗 ATP',
    examples: '植物根吸收无机盐离子；钠钾泵吸钾排钠；小肠、肾小管上皮细胞吸葡萄糖',
    color: '#ed5f82',
    direction: 'up',
    transporter: 'activeCarrier',
  },
];

const info = {
  '高浓度区': '粒子数量多的一侧代表高浓度。自由扩散和协助扩散都朝低浓度区移动；主动运输则可以把物质运向高浓度区。',
  '低浓度区': '粒子数量少的一侧代表低浓度。顺浓度梯度运输不需要细胞额外供能，逆浓度梯度运输需要能量。',
  '磷脂双分子层': '细胞膜的基本骨架。小分子、脂溶性物质可直接通过；大分子或带电粒子通常不能直接穿过。',
  '自由扩散路径': '自由扩散不经过转运蛋白，物质直接穿过磷脂双分子层，方向总是顺浓度梯度。',
  '通道蛋白': '通道蛋白形成亲水通道，常帮助离子或水分子快速通过，属于协助扩散，不消耗 ATP。',
  '载体蛋白': '载体蛋白有特定结合位点。被运输分子先与一侧结合位点结合，随后载体蛋白构象改变，另一侧形成出口并释放分子。',
  '主动运输载体': '主动运输中的载体蛋白利用 ATP 水解释放的能量，把物质逆浓度梯度运输。',
  ATP: 'ATP 提供主动运输所需能量。自由扩散和协助扩散不需要 ATP 直接供能。',
};

const colors = {
  ink: '#233548',
  muted: '#6e7f8f',
  membraneA: '#ffd36f',
  membraneB: '#f7a64a',
  tail: 'rgba(74, 96, 116, 0.32)',
  outside: 'rgba(232, 248, 255, 0.82)',
  inside: 'rgba(238, 255, 244, 0.82)',
  particle: '#f5a524',
  particleAlt: '#ffe07d',
  channel: '#2f8cff',
  carrier: '#14b8a6',
  atp: '#ed5f82',
};

const hitAreas = [];
let playing = true;
let activeMode = 0;
let phase = 0;
let flowPhase = 0;
let facilitatedFlowPhase = 0;
let carrierPhase = 0;
let activeCarrierPhase = 0;
let activeProteinPhase = 0;
let lastTime = performance.now();
let pixelRatio = 1;
let sceneBox = { x: 0, y: 0, scale: 1 };

buildControls();
resize();
requestAnimationFrame(tick);

function buildControls() {
  modes.forEach((mode, index) => {
    const button = document.createElement('button');
    button.className = 'step';
    button.type = 'button';
    button.textContent = mode.short;
    button.addEventListener('click', () => {
      activeMode = index;
      phase = 0;
      flowPhase = 0;
      facilitatedFlowPhase = 0;
      carrierPhase = 0;
      activeCarrierPhase = 0;
      activeProteinPhase = 0;
      playing = true;
      delete infoText.dataset.pinned;
      syncPanel();
      updatePlayButton();
    });
    timeline.append(button);
  });

  playBtn.addEventListener('click', () => {
    playing = !playing;
    updatePlayButton();
  });

  resetBtn.addEventListener('click', () => {
    phase = 0;
    flowPhase = 0;
    facilitatedFlowPhase = 0;
    carrierPhase = 0;
    activeCarrierPhase = 0;
    activeProteinPhase = 0;
    playing = true;
    delete infoText.dataset.pinned;
    syncPanel();
    updatePlayButton();
  });

  compareBtn.addEventListener('click', () => {
    comparePanel.hidden = false;
    proteinPanel.hidden = true;
  });

  closeCompareBtn.addEventListener('click', () => {
    comparePanel.hidden = true;
  });

  proteinBtn.addEventListener('click', () => {
    proteinPanel.hidden = false;
    comparePanel.hidden = true;
  });

  closeProteinBtn.addEventListener('click', () => {
    proteinPanel.hidden = true;
  });

  knowledgeToggle.addEventListener('click', () => {
    const collapsed = knowledgePanel.classList.toggle('collapsed');
    knowledgeToggle.textContent = collapsed ? '展开知识卡片' : '收起知识卡片';
    knowledgeToggle.setAttribute('aria-expanded', String(!collapsed));
  });

  syncPanel();
  if (window.innerWidth <= 720) {
    knowledgePanel.classList.add('collapsed');
    knowledgeToggle.textContent = '展开知识卡片';
    knowledgeToggle.setAttribute('aria-expanded', 'false');
  }
  updatePlayButton();
}

function tick(now) {
  const delta = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (playing) {
    phase = (phase + delta * 0.12) % 1;
    flowPhase = (flowPhase + delta * 0.13) % 1;
    facilitatedFlowPhase = (facilitatedFlowPhase + delta * 0.24) % 1;
    carrierPhase = (carrierPhase + delta * 0.38) % 1;
    activeCarrierPhase = (activeCarrierPhase + delta * 0.3) % 1;
    activeProteinPhase = (activeProteinPhase + delta * 0.6) % 1;
    if (phase >= 1) {
      phase %= 1;
    }
  }

  draw(now / 1000);
  requestAnimationFrame(tick);
}

function syncPanel() {
  const mode = modes[activeMode];
  statusEl.textContent = mode.title;
  modeTitle.textContent = mode.title;
  modeText.textContent = mode.text;
  focusName.textContent = mode.focus;
  gradientFact.textContent = mode.gradient;
  proteinFact.textContent = mode.protein;
  typeFact.textContent = mode.proteinType;
  energyFact.textContent = mode.energy;
  exampleFact.textContent = mode.examples;
  structureDot.style.background = mode.color;
  structureDot.style.boxShadow = `0 0 0 6px ${hexToRgb(mode.color, 0.14)}`;
  infoText.textContent = infoText.dataset.pinned || '点击膜上的结构或左右两侧浓度区，可以查看浓度梯度、转运蛋白和能量消耗说明。';

  document.querySelectorAll('.step').forEach((button, index) => {
    button.classList.toggle('active', index === activeMode);
  });
}

function updatePlayButton() {
  playBtn.textContent = playing ? '暂停' : '播放';
  playBtn.setAttribute('aria-pressed', String(playing));
}

function draw(time) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  hitAreas.length = 0;

  const isCompact = width <= 980;
  const marginX = Math.max(22, width * 0.055);
  const marginY = Math.max(82, height * 0.13);
  const sideReserve = isCompact ? 0 : 380;
  const usableW = isCompact ? width - 28 : width - marginX * 2 - sideReserve * 0.55;
  const usableH = isCompact ? height - 250 : height - marginY * 2.08;
  const scale = isCompact
    ? Math.min(usableW / 780, usableH / 700)
    : Math.min(usableW / 920, usableH / 620);

  sceneBox = {
    x: isCompact ? width / 2 - 460 * scale : marginX,
    y: isCompact ? Math.max(172, height * 0.18) : height / 2 - 302 * scale + 22,
    scale,
  };

  ctx.save();
  ctx.translate(sceneBox.x, sceneBox.y);
  ctx.scale(scale, scale);
  drawScene(time);
  ctx.restore();
}

function drawScene(time) {
  const mode = modes[activeMode];
  drawGradientZones(mode);
  drawConcentrationParticles(time, mode);
  drawMembrane(time);
  drawTransporter(time, mode);
  drawMovingParticles(time, mode);
  drawEnergy(time, mode);
  drawComparisonStrip(mode);
  drawLabels(mode);
}

function drawGradientZones(mode) {
  ctx.save();
  roundRect(64, 58, 650, 210, 8);
  ctx.fillStyle = colors.outside;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(47, 140, 255, 0.16)';
  ctx.stroke();

  roundRect(64, 360, 650, 210, 8);
  ctx.fillStyle = colors.inside;
  ctx.fill();
  ctx.strokeStyle = 'rgba(20, 184, 166, 0.16)';
  ctx.stroke();

  const topLabel = mode.id === 'active' ? '膜外：高浓度' : '膜外：高浓度';
  const bottomLabel = mode.id === 'active' ? '膜内：低浓度' : '膜内：低浓度';
  zoneLabel(topLabel, 86, 92, '#1b75bc');
  zoneLabel(bottomLabel, 86, 534, '#0f8f69');
  drawGradientArrow(mode);
  ctx.restore();

  addHit('高浓度区', 384, 162, 330, 104, 'rect');
  addHit('低浓度区', 384, 465, 330, 104, 'rect');
}

function drawGradientArrow(mode) {
  const down = mode.direction === 'down';
  const x = 750;
  const y1 = down ? 168 : 456;
  const y2 = down ? 456 : 168;
  const color = mode.id === 'active' ? colors.atp : '#2f8cff';

  ctx.save();
  ctx.lineWidth = 5;
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.setLineDash(mode.id === 'active' ? [9, 9] : []);
  ctx.beginPath();
  ctx.moveTo(x, y1);
  ctx.lineTo(x, y2);
  ctx.stroke();
  ctx.setLineDash([]);
  const arrow = down ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(x, y2 + arrow * 18);
  ctx.lineTo(x - 12, y2 - arrow * 2);
  ctx.lineTo(x + 12, y2 - arrow * 2);
  ctx.closePath();
  ctx.fill();
  ctx.font = '800 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText(mode.gradient, 694, 318);
  ctx.restore();
}

function zoneLabel(text, x, y, color) {
  ctx.save();
  ctx.font = '820 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawConcentrationParticles(time, mode) {
  const topMany = true;
  const topCount = topMany ? 22 : 7;
  const bottomCount = topMany ? 7 : 22;
  drawStaticParticles(topCount, 120, 126, 570, 130, time, 1, mode);
  drawStaticParticles(bottomCount, 122, 404, 570, 122, time, 9, mode);
}

function drawStaticParticles(count, x, y, w, h, time, seed, mode) {
  for (let i = 0; i < count; i += 1) {
    const n = i + seed * 17;
    const drift = Math.sin(time * (0.55 + seeded(n) * 0.55) + n) * (7 + seeded(n * 4.1) * 8);
    const sway = Math.cos(time * (0.65 + seeded(n * 2.7) * 0.4) + n * 0.7) * (3 + seeded(n * 5.3) * 4);
    const px = x + seeded(n * 1.13) * w + drift;
    const py = y + seeded(n * 2.31) * h + sway;
    drawParticle(px, py, 8.6, seeded(n) > 0.5, mode.color);
  }
}

function drawMembrane(time) {
  ctx.save();
  ctx.translate(58, 288);
  ctx.fillStyle = 'rgba(35, 53, 72, 0.09)';
  roundRect(0, 34, 672, 96, 8);
  ctx.fill();

  drawPhospholipidRow(0, time);
  drawPhospholipidRow(88, time + 4.2);

  ctx.fillStyle = colors.tail;
  for (let i = 0; i < 26; i += 1) {
    const x = 28 + i * 25;
    ctx.beginPath();
    ctx.moveTo(x - 4, 22);
    ctx.bezierCurveTo(x - 9, 42, x - 2, 54, x - 6, 76);
    ctx.moveTo(x + 5, 22);
    ctx.bezierCurveTo(x + 11, 44, x + 3, 55, x + 7, 77);
    ctx.lineWidth = 3;
    ctx.strokeStyle = colors.tail;
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(35, 53, 72, 0.16)';
  roundRect(0, 42, 672, 68, 8);
  ctx.strokeStyle = 'rgba(35, 53, 72, 0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  addHit('磷脂双分子层', 394, 340, 350, 62, 'rect');
}

function drawPhospholipidRow(y, time) {
  for (let i = 0; i < 27; i += 1) {
    const x = 20 + i * 25;
    const bob = Math.sin(time + i * 0.7) * 1.6;
    ctx.beginPath();
    ctx.arc(x, y + bob, 10, 0, Math.PI * 2);
    ctx.fillStyle = colors.membraneA;
    ctx.fill();
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = colors.ink;
    ctx.stroke();
  }
}

function drawTransporter(time, mode) {
  if (mode.transporter === 'none') {
    drawFreeDiffusionWindow(time, mode);
    return;
  }

  if (mode.transporter === 'channel') {
    drawChannelProtein(time, mode);
    drawCarrierProtein(time, mode, 500, getCarrierState(mode));
    return;
  }

  drawActiveCarrierProtein(time, mode);
}

function drawFreeDiffusionWindow(time, mode) {
  ctx.save();
  const glow = 0.24 + Math.sin(time * 4) * 0.08;
  ctx.strokeStyle = `rgba(47, 140, 255, ${glow})`;
  ctx.lineWidth = 5;
  ctx.setLineDash([8, 8]);
  roundRect(320, 282, 84, 124, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(47, 140, 255, 0.09)';
  roundRect(320, 282, 84, 124, 8);
  ctx.fill();
  ctx.restore();
  addHit('自由扩散路径', 362, 344, 58, 82, 'rect');
}

function drawChannelProtein(time, mode) {
  const x = 350;
  ctx.save();
  ctx.translate(x, 282);
  ctx.fillStyle = colors.ink;
  roundRect(-38, -8, 76, 128, 8);
  ctx.fill();
  const grad = ctx.createLinearGradient(-34, 0, 34, 120);
  grad.addColorStop(0, '#80c8ff');
  grad.addColorStop(1, mode.color);
  ctx.fillStyle = grad;
  roundRect(-31, -2, 62, 116, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(235, 250, 255, 0.95)';
  roundRect(-13 + Math.sin(time * 3) * 2, 9, 26, 92, 8);
  ctx.fill();
  ctx.restore();
  addHit('通道蛋白', x, 344, 48, 78, 'rect');
}

function drawCarrierProtein(time, mode, x, state = { outerOpen: 0, innerOpen: 0, bound: 0 }) {
  const outerOpen = state.outerOpen || 0;
  const innerOpen = state.innerOpen || 0;
  const color = mode.id === 'active' ? '#30c6b4' : '#62d4c8';
  const topOpen = Math.max(0, Math.min(1, outerOpen));
  const bottomOpen = Math.max(0, Math.min(1, innerOpen));
  ctx.save();
  ctx.translate(x, 344);

  ctx.fillStyle = 'rgba(35, 53, 72, 0.16)';
  ctx.beginPath();
  ctx.ellipse(4, 72, 44, 12, 0, 0, Math.PI * 2);
  ctx.fill();

  drawCarrierLeaf(-1, topOpen, bottomOpen, colors.ink, 1);
  drawCarrierLeaf(1, topOpen, bottomOpen, colors.ink, 1);
  drawCarrierLeaf(-1, topOpen, bottomOpen, color, 0.82);
  drawCarrierLeaf(1, topOpen, bottomOpen, color, 0.82);
  drawCarrierCentralSeam(topOpen, bottomOpen);

  if (state.bound) {
    const size = 9.2 + Math.sin((state.t || 0) * Math.PI) * 1.1;
    drawParticle(0, state.boundY || 0, size, true, mode.color);
  }

  ctx.restore();
  addHit('载体蛋白', x, 344, 56, 82, 'rect');
}

function getCarrierLeafPose(side, topOpen, bottomOpen) {
  const openBalance = topOpen - bottomOpen;
  return {
    angle: side * openBalance * 0.2,
    xShift: side * openBalance * 6,
    yShift: 0,
  };
}

function drawCarrierLeaf(side, topOpen, bottomOpen, fillStyle, scale = 1) {
  const { angle, xShift, yShift } = getCarrierLeafPose(side, topOpen, bottomOpen);
  ctx.save();
  ctx.translate(xShift, yShift);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(side * 10 * scale, -65 * scale);
  ctx.bezierCurveTo(side * 37 * scale, -67 * scale, side * 48 * scale, -45 * scale, side * 43 * scale, -18 * scale);
  ctx.bezierCurveTo(side * 40 * scale, -3 * scale, side * 28 * scale, 7 * scale, side * 23 * scale, 14 * scale);
  ctx.bezierCurveTo(side * 37 * scale, 31 * scale, side * 34 * scale, 58 * scale, side * 12 * scale, 66 * scale);
  ctx.bezierCurveTo(side * 2 * scale, 54 * scale, side * 6 * scale, 31 * scale, side * 8 * scale, 14 * scale);
  ctx.bezierCurveTo(side * 9 * scale, 6 * scale, side * 12 * scale, 1 * scale, side * 16 * scale, -2 * scale);
  ctx.bezierCurveTo(side * 10 * scale, -12 * scale, side * 5 * scale, -30 * scale, side * 7 * scale, -47 * scale);
  ctx.bezierCurveTo(side * 8 * scale, -55 * scale, side * 9 * scale, -61 * scale, side * 10 * scale, -65 * scale);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();

  ctx.restore();
}

function drawCarrierCentralSeam(topOpen, bottomOpen) {
  const topGap = 8 + topOpen * 26;
  const bottomGap = 8 + bottomOpen * 26;
  ctx.save();
  ctx.strokeStyle = 'rgba(35, 53, 72, 0.62)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-topGap * 0.35, -58);
  ctx.bezierCurveTo(-topGap * 0.18, -34, -8, -16, -8, -3);
  ctx.bezierCurveTo(-8, 8, -bottomGap * 0.18, 34, -bottomGap * 0.35, 58);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(topGap * 0.35, -58);
  ctx.bezierCurveTo(topGap * 0.18, -34, 8, -16, 8, -3);
  ctx.bezierCurveTo(8, 8, bottomGap * 0.18, 34, bottomGap * 0.35, 58);
  ctx.stroke();
  ctx.restore();
}

function drawActiveCarrierProtein(time, mode) {
  const x = 400;
  drawCarrierProtein(time, mode, x, getPumpState(time));
  drawFixedAtpBadge(x + 96, 430, time);
  drawEnergyArrow(x + 54, 424, x + 14, 392, time);
  addHit('主动运输载体', x, 344, 62, 88, 'rect');
  addHit('ATP', x + 96, 430, 42, 34, 'ellipse');
}

function drawFixedAtpBadge(x, y, time) {
  const pulse = 1 + Math.sin(time * 3.2) * 0.04;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = 'rgba(35, 53, 72, 0.14)';
  ctx.beginPath();
  ctx.ellipse(4, 26, 42, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  const grad = ctx.createLinearGradient(-42, -26, 42, 28);
  grad.addColorStop(0, '#ff8aa5');
  grad.addColorStop(1, colors.atp);
  ctx.fillStyle = colors.atp;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 3;
  roundRect(-39, -23, 78, 46, 8);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
  roundRect(-31, -16, 62, 14, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ATP', 0, -1);
  ctx.font = '760 9px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('供能', 0, 14);
  ctx.restore();
}

function drawEnergyArrow(fromX, fromY, toX, toY, time) {
  const glow = 0.42 + Math.sin(time * 5) * 0.18;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = `rgba(232, 82, 120, ${glow})`;
  ctx.fillStyle = `rgba(232, 82, 120, ${Math.min(0.95, glow + 0.2)})`;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - Math.cos(angle - 0.55) * 18, toY - Math.sin(angle - 0.55) * 18);
  ctx.lineTo(toX - Math.cos(angle + 0.55) * 18, toY - Math.sin(angle + 0.55) * 18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMovingParticles(time, mode) {
  if (mode.id === 'facilitated') {
    drawFacilitatedMovingParticles(time, mode);
    return;
  }

  if (mode.id === 'active') {
    drawCarrierQueues(time, mode, 400, 'bottom');
    drawCarrierTransportParticle(mode, 400, 'bottom', activeCarrierPhase, 2);
    return;
  }

  const count = 6;
  for (let i = 0; i < count; i += 1) {
    const offset = (flowPhase + i / count) % 1;
    const eased = smoothstep(0.01, 0.99, offset);
    const path = getPath(mode, i);
    const point = pointOnPolyline(path, eased);
    const visible = offset > 0.01 && offset < 0.99;
    if (!visible) continue;
    drawFlowDashes(path, offset, mode.color);
    drawMotionTrail(path, eased, mode.color);
    drawParticle(point.x, point.y, 8.8, i % 2 === 0, mode.color);
  }
}

function drawFacilitatedMovingParticles(time, mode) {
  drawCarrierQueues(time, mode, 500, 'top');

  for (let i = 0; i < 4; i += 1) {
    const offset = (facilitatedFlowPhase + i / 4) % 1;
    const eased = smoothstep(0.01, 0.99, offset);
    const path = getChannelPath(i);
    const point = pointOnPolyline(path, eased);
    if (offset > 0.01 && offset < 0.99) {
      drawFlowDashes(path, offset, mode.color);
      drawMotionTrail(path, eased, mode.color);
      drawParticle(point.x, point.y, 8.5, i % 2 === 0, mode.color);
    }
  }

  drawCarrierTransportParticle(mode, 500, 'top', carrierPhase, 4);
}

function drawCarrierTransportParticle(mode, x, entrySide, transportPhase, particleCount = 2) {
  const carrierT = transportPhase % 1;
  const carrierPath = getCarrierPath(x, entrySide);
  drawFlowDashes(carrierPath, carrierT, mode.color, particleCount > 2 ? 3 : 2);
  for (let i = 0; i < particleCount; i += 1) {
    const t = (carrierT + i / particleCount) % 1;
    const carrierPoint = pointOnCarrierCycle(t, entrySide, x);
    drawMotionTrail(carrierPath, t, mode.color);
    drawParticle(carrierPoint.x, carrierPoint.y, particleCount > 2 ? 8.8 : 10.2, i % 2 === 0, mode.color);
  }
}

function drawCarrierQueues(time, mode, x, entrySide) {
  const entryTop = entrySide === 'top';
  const entryY = entryTop ? 182 : 496;
  const exitY = entryTop ? 496 : 182;
  const entryCount = 4;
  const exitCount = 2;

  for (let i = 0; i < entryCount; i += 1) {
    const row = i % 2;
    const wait = Math.sin(time * 1.4 + i * 0.9) * 3;
    drawParticle(x - 40 + i * 18, entryY + row * 20 + wait, 8.4, i % 2 === 0, mode.color);
  }

  for (let i = 0; i < exitCount; i += 1) {
    const wait = Math.sin(time * 1.1 + i * 1.2) * 2.4;
    drawParticle(x + 30 + i * 20, exitY + i * 16 + wait, 7.8, i % 2 === 1, mode.color);
  }
}

function getPath(mode, index) {
  if (mode.id === 'free') {
    const x = 318 + (index % 5) * 22;
    const sway = index % 2 ? 10 : -8;
    return [
      [x - 24, 128],
      [x - 10 + sway, 228],
      [x + 8, 338],
      [x + 12 - sway, 468],
      [x + 30, 534],
    ];
  }

  if (mode.id === 'facilitated') {
    return index % 2 === 0 ? getChannelPath(index) : [
      [500, 132],
      [500, 250],
      [500, 344],
      [500, 448],
      [500, 532],
    ];
  }

  const x = 392 + (index % 3) * 9;
  return [
    [x, 526],
    [x + 8, 456],
    [x, 348],
    [x - 7, 238],
    [x, 130],
  ];
}

function getChannelPath(index) {
  const x = 350 + (index % 2) * 8 - 4;
  return [
    [x, 132],
    [x, 236],
    [x, 338],
    [x, 452],
    [x, 532],
  ];
}

function getCarrierState(mode) {
  if (mode.id !== 'facilitated') return { outerOpen: 0.18, innerOpen: 0.18, bound: 0 };
  const t = carrierPhase % 1;
  return carrierStateFor(t, false);
}

function getPumpState(time) {
  const t = activeProteinPhase % 1;
  const state = carrierStateFor(t, true);
  state.bound = 0;
  return state;
}

function carrierStateFor(t, inverted) {
  let entryOpen = 1;
  if (t >= 0.34 && t < 0.5) {
    entryOpen = 1 - smoothstep(0.34, 0.5, t);
  } else if (t >= 0.5 && t < 0.84) {
    entryOpen = 0;
  } else if (t >= 0.84) {
    entryOpen = smoothstep(0.84, 1, t);
  }
  const exitOpen = 1 - entryOpen;
  const entryIsTop = !inverted;
  const outerOpen = entryIsTop ? entryOpen : exitOpen;
  const innerOpen = entryIsTop ? exitOpen : entryOpen;

  return {
    outerOpen,
    innerOpen,
    bound: 0,
    boundY: carrierBoundY(t) * (inverted ? -1 : 1),
    t,
  };
}

function carrierBoundY(t) {
  return -31;
}

function getCarrierPath(x, entrySide) {
  return entrySide === 'top'
    ? [[x, 132], [x, 236], [x, 344], [x, 452], [x, 532]]
    : [[x, 532], [x, 452], [x, 344], [x, 236], [x, 132]];
}

function pointOnCarrierCycle(t, entrySide = 'top', x = 500) {
  const path = getCarrierPath(x, entrySide);
  const eased = smoothstep(0.01, 0.99, t);
  return pointOnPolyline(path, eased);
}

function drawMotionTrail(path, t, color) {
  const current = Math.max(0, Math.min(1, t));
  const prev = Math.max(0, current - 0.15);
  const a = pointOnPolyline(path, prev);
  const b = pointOnPolyline(path, current);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = hexToRgb(color.replace('#', ''), 0.22);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function drawFlowDashes(path, progress, color, count = 3) {
  ctx.save();
  ctx.strokeStyle = hexToRgb(color.replace('#', ''), 0.34);
  ctx.fillStyle = hexToRgb(color.replace('#', ''), 0.46);
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';

  for (let i = 0; i < count; i += 1) {
    const t = (progress + i * 0.2) % 1;
    const a = pointOnPolyline(path, t);
    const b = pointOnPolyline(path, Math.min(0.999, t + 0.035));
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const x = a.x;
    const y = a.y;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(angle) * 9, y - Math.sin(angle) * 9);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8);
    ctx.lineTo(x - Math.cos(angle) * 1 - Math.sin(angle) * 5, y - Math.sin(angle) * 1 + Math.cos(angle) * 5);
    ctx.lineTo(x - Math.cos(angle) * 1 + Math.sin(angle) * 5, y - Math.sin(angle) * 1 - Math.cos(angle) * 5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawEnergy(time, mode) {
  return;
}

function drawAtpSpark(x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = colors.atp;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const angle = (Math.PI * 2 * i) / 8;
    const radius = i % 2 === 0 ? r : r * 0.58;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = '800 8px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ATP', 0, 0);
  ctx.restore();
}

function drawComparisonStrip(mode) {
  const items = [
    ['浓度梯度', mode.gradient],
    ['转运蛋白', mode.protein],
    ['蛋白种类', mode.proteinType],
    ['能量', mode.energy],
  ];
  ctx.save();
  ctx.translate(76, 590);
  items.forEach(([labelText, value], index) => {
    const x = index * 168;
    ctx.fillStyle = index % 2 ? 'rgba(255, 255, 255, 0.78)' : 'rgba(255, 255, 255, 0.92)';
    roundRect(x, -38, 154, 58, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(35, 53, 72, 0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = colors.muted;
    ctx.font = '700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(labelText, x + 12, -16);
    ctx.fillStyle = colors.ink;
    ctx.font = '830 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    wrapText(value, x + 12, 3, 132, 16);
  });
  ctx.restore();
}

function drawLabels(mode) {
  label('磷脂双分子层', 76, 316, '#885311');
  if (mode.id === 'free') label('直接通过膜', 416, 284, mode.color);
  if (mode.id === 'facilitated') {
    label('通道蛋白', 382, 282, colors.channel);
    label('载体蛋白', 532, 282, colors.carrier);
  }
  if (mode.id === 'active') {
    label('载体蛋白', 430, 282, colors.atp);
  }

  ctx.save();
  ctx.fillStyle = '#405366';
  ctx.font = '760 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('点击浓度区、膜结构或 ATP 查看说明', 76, 42);
  ctx.restore();
}

function label(text, x, y, color) {
  ctx.save();
  ctx.font = '820 15px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const width = ctx.measureText(text).width + 38;
  ctx.fillStyle = 'rgba(35, 53, 72, 0.1)';
  roundRect(x - 9, y - 17, width, 34, 8);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  roundRect(x - 12, y - 22, width, 34, 8);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(35, 53, 72, 0.28)';
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y - 5, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.ink;
  ctx.fillText(text, x + 10, y);
  ctx.restore();
}

function drawParticle(x, y, radius, alt, color = colors.particle) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x + radius * 0.25, y + radius * 0.72, radius * 0.9, radius * 0.24, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(35, 53, 72, 0.11)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = colors.ink;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - radius * 0.25, y - radius * 0.28, radius * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = alt ? '#fff0a8' : colors.particleAlt;
  ctx.fill();
  ctx.restore();
}

function addHit(name, x, y, w, h, type) {
  hitAreas.push({ name, x, y, w, h, type });
}

function pickStructure(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left - sceneBox.x) / sceneBox.scale;
  const y = (clientY - rect.top - sceneBox.y) / sceneBox.scale;

  for (let i = hitAreas.length - 1; i >= 0; i -= 1) {
    const area = hitAreas[i];
    if (area.type === 'ellipse') {
      const dx = (x - area.x) / area.w;
      const dy = (y - area.y) / area.h;
      if (dx * dx + dy * dy <= 1) return area.name;
    } else if (Math.abs(x - area.x) <= area.w && Math.abs(y - area.y) <= area.h) {
      return area.name;
    }
  }
  return null;
}

function selectStructure(name) {
  focusName.textContent = name;
  infoText.dataset.pinned = info[name] || '';
  infoText.textContent = infoText.dataset.pinned;
  const mode = modes[activeMode];
  structureDot.style.background = mode.color;
  structureDot.style.boxShadow = `0 0 0 6px ${hexToRgb(mode.color, 0.14)}`;
}

function resize() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
  canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

function pointOnPolyline(points, t) {
  const total = points.length - 1;
  const scaled = Math.max(0, Math.min(0.999, t)) * total;
  const index = Math.floor(scaled);
  const local = scaled - index;
  const a = points[index];
  const b = points[index + 1] || points[index];
  const eased = local * local * (3 - 2 * local);
  return {
    x: a[0] + (b[0] - a[0]) * eased,
    y: a[1] + (b[1] - a[1]) * eased,
  };
}

function smoothstep(start, end, value) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
}

function seeded(value) {
  return fract(Math.sin(value * 12.9898) * 43758.5453);
}

function fract(value) {
  return value - Math.floor(value);
}

function wrapText(text, x, y, maxWidth, lineHeight) {
  let line = '';
  let lineIndex = 0;
  for (const char of text) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineIndex * lineHeight);
      line = char;
      lineIndex += 1;
    } else {
      line = next;
    }
  }
  ctx.fillText(line, x, y + lineIndex * lineHeight);
}

function roundRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function hexToRgb(hex, alpha) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

window.addEventListener('resize', resize);

canvas.addEventListener('pointermove', (event) => {
  const name = pickStructure(event.clientX, event.clientY);
  canvas.style.cursor = name ? 'pointer' : 'default';
});

canvas.addEventListener('pointerdown', (event) => {
  const name = pickStructure(event.clientX, event.clientY);
  if (name) selectStructure(name);
});
