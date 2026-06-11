const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d');
const statusEl = document.querySelector('#status');
const modeTitle = document.querySelector('#modeTitle');
const modeText = document.querySelector('#modeText');
const infoCard = document.querySelector('#infoCard');
const infoCardTitle = document.querySelector('#infoCardTitle');
const infoText = document.querySelector('#infoText');
const closeInfoBtn = document.querySelector('#closeInfoBtn');
const gradientFact = document.querySelector('#gradientFact');
const proteinFact = document.querySelector('#proteinFact');
const typeFact = document.querySelector('#typeFact');
const energyFact = document.querySelector('#energyFact');
const exampleFact = document.querySelector('#exampleFact');
const timeline = document.querySelector('#timeline');
const playBtn = document.querySelector('#playBtn');
const resetBtn = document.querySelector('#resetBtn');
const phosphoBtn = document.querySelector('#phosphoBtn');
const compareBtn = document.querySelector('#compareBtn');
const closeCompareBtn = document.querySelector('#closeCompareBtn');
const comparePanel = document.querySelector('#comparePanel');
const proteinBtn = document.querySelector('#proteinBtn');
const closeProteinBtn = document.querySelector('#closeProteinBtn');
const proteinPanel = document.querySelector('#proteinPanel');
const knowledgePanel = document.querySelector('#knowledgePanel');

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
    examples: '气体分子：O₂、CO₂、N₂；小部分水；小分子脂溶性物质：甘油、乙醇、苯、胆固醇、性激素',
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
    examples: '葡萄糖进入多数组织细胞；水通道；Na⁺、K⁺、Ca²⁺、Cl⁻ 离子通道',
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
let showPhosphorylation = false;

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
      hideInfoCard();
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
    hideInfoCard();
    syncPanel();
    updatePlayButton();
  });

  phosphoBtn.addEventListener('click', () => {
    showPhosphorylation = !showPhosphorylation;
    phase = 0;
    activeCarrierPhase = 0;
    activeProteinPhase = 0;
    playing = true;
    hideInfoCard();
    syncPanel();
    updatePlayButton();
    updatePhosphoButton();
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

  closeInfoBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    hideInfoCard();
  });

  syncPanel();
  updatePlayButton();
  updatePhosphoButton();
}

function tick(now) {
  const delta = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;

  if (playing) {
    phase = (phase + delta * 0.12) % 1;
    flowPhase = (flowPhase + delta * 0.13) % 1;
    facilitatedFlowPhase = (facilitatedFlowPhase + delta * 0.24) % 1;
    carrierPhase = (carrierPhase + delta * 0.38) % 1;
    activeCarrierPhase = (activeCarrierPhase + delta * 0.36) % 1;
    activeProteinPhase = activeCarrierPhase;
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
  gradientFact.textContent = mode.gradient;
  proteinFact.textContent = mode.protein;
  typeFact.textContent = mode.proteinType;
  energyFact.textContent = mode.energy;
  exampleFact.textContent = mode.examples;

  document.querySelectorAll('.step').forEach((button, index) => {
    button.classList.toggle('active', index === activeMode);
  });
  phosphoBtn.hidden = mode.id !== 'active';
  updatePhosphoButton();
}

function updatePlayButton() {
  playBtn.textContent = playing ? '暂停' : '播放';
  playBtn.setAttribute('aria-pressed', String(playing));
}

function updatePhosphoButton() {
  phosphoBtn.classList.toggle('active-toggle', showPhosphorylation);
  phosphoBtn.setAttribute('aria-pressed', String(showPhosphorylation));
}

function draw(time) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  ctx.clearRect(0, 0, width, height);
  hitAreas.length = 0;

  const isCompact = width <= 980;
  const marginX = Math.max(22, width * 0.055);
  const usableW = isCompact ? width - 20 : width - marginX * 2;
  const desktopTop = 178;
  const desktopBottom = 190;
  const usableH = isCompact ? height - 320 : Math.max(360, height - desktopTop - desktopBottom);
  const scale = isCompact
    ? Math.min(usableW / 720, usableH / 610)
    : Math.min(1.22, usableW / 900, usableH / 620);
  const desktopSceneY = desktopTop + Math.max(0, (usableH - 620 * scale) * 0.18);

  sceneBox = {
    x: isCompact ? width / 2 - 405 * scale : width / 2 - 405 * scale,
    y: isCompact ? Math.max(238, height * 0.23) : desktopSceneY,
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

  roundRect(64, 410, 650, 160, 8);
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

  addHit('高浓度区', 384, 162, 350, 120, 'rect');
  addHit('低浓度区', 384, 490, 350, 100, 'rect');
}

function drawGradientArrow(mode) {
  const down = mode.direction === 'down';
  const x = 758;
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
  ctx.textAlign = 'right';
  ctx.fillText(mode.gradient, 742, 318);
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
  const topCount = mode.id === 'facilitated' ? 28 : (topMany ? 22 : 7);
  const bottomCount = mode.id === 'active' ? 5 : (topMany ? 7 : 22);
  drawStaticParticles(topCount, 120, 126, 570, 130, time, 1, mode);
  const clearZone = mode.id === 'active' && showPhosphorylation
    ? { x: 330, y: 365, w: 285, h: 160 }
    : null;
  drawStaticParticles(bottomCount, 122, 404, 570, 122, time, 9, mode, clearZone);
}

function drawStaticParticles(count, x, y, w, h, time, seed, mode, clearZone = null) {
  for (let i = 0; i < count; i += 1) {
    const n = i + seed * 17;
    const drift = Math.sin(time * (0.55 + seeded(n) * 0.55) + n) * (7 + seeded(n * 4.1) * 8);
    const sway = Math.cos(time * (0.65 + seeded(n * 2.7) * 0.4) + n * 0.7) * (3 + seeded(n * 5.3) * 4);
    const px = x + seeded(n * 1.13) * w + drift;
    const py = y + seeded(n * 2.31) * h + sway;
    if (
      clearZone &&
      px >= clearZone.x &&
      px <= clearZone.x + clearZone.w &&
      py >= clearZone.y &&
      py <= clearZone.y + clearZone.h
    ) {
      continue;
    }
    drawParticle(px, py, 8.6, seeded(n) > 0.5, mode.color);
  }
}

function drawMembrane(time) {
  ctx.save();
  ctx.translate(58, 288);

  drawPhospholipidLeaflet(0, 1, time);
  drawPhospholipidLeaflet(104, -1, time + 4.2);

  ctx.save();
  ctx.strokeStyle = 'rgba(35, 53, 72, 0.1)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(20, 52);
  ctx.lineTo(670, 52);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  addHit('磷脂双分子层', 394, 340, 372, 88, 'rect');
}

function drawPhospholipidLeaflet(y, direction, time) {
  for (let i = 0; i < 27; i += 1) {
    const x = 20 + i * 25;
    const lateral = Math.sin(time * 0.85 + i * 0.47) * 1.8;
    const vertical = Math.sin(time * 1.15 + i * 0.62) * 1.25;
    const tailSway = Math.sin(time * 1.55 + i * 0.54) * 3.4;
    const headX = x + lateral;
    const headY = y + vertical;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = colors.tail;
    ctx.beginPath();
    ctx.moveTo(headX - 4, headY + direction * 10);
    ctx.bezierCurveTo(
      headX - 9 + tailSway * 0.18,
      y + direction * 24 + vertical * 0.58,
      headX - 8 + tailSway * 0.38,
      y + direction * 37,
      headX - 5 + tailSway * 0.5,
      y + direction * 50,
    );
    ctx.moveTo(headX + 5, headY + direction * 10);
    ctx.bezierCurveTo(
      headX + 10 + tailSway * 0.18,
      y + direction * 24 + vertical * 0.58,
      headX + 9 + tailSway * 0.38,
      y + direction * 37,
      headX + 6 + tailSway * 0.5,
      y + direction * 50,
    );
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(headX, headY, 10, 0, Math.PI * 2);
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
  ctx.lineWidth = 4;
  ctx.setLineDash([7, 7]);
  roundRect(354, 282, 28, 124, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(47, 140, 255, 0.09)';
  roundRect(354, 282, 28, 124, 8);
  ctx.fill();
  ctx.restore();
  addHit('自由扩散路径', 368, 344, 34, 92, 'rect');
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
  roundRect(-13, 9, 26, 92, 8);
  ctx.fill();
  ctx.restore();
  addHit('通道蛋白', x, 344, 64, 96, 'rect');
}

function drawCarrierProtein(time, mode, x, state = { outerOpen: 0, innerOpen: 0, bound: 0 }) {
  const outerOpen = state.outerOpen || 0;
  const innerOpen = state.innerOpen || 0;
  const color = mode.id === 'active' ? '#30c6b4' : '#62d4c8';
  const topOpen = Math.max(0, Math.min(1, outerOpen));
  const bottomOpen = Math.max(0, Math.min(1, innerOpen));
  ctx.save();
  ctx.translate(x, 344);

  drawCarrierLeaf(-1, topOpen, bottomOpen, color);
  drawCarrierLeaf(1, topOpen, bottomOpen, color);
  drawCarrierBindingSite(state, mode, topOpen, bottomOpen);

  if (state.bound) {
    const size = 9.2 + Math.sin((state.t || 0) * Math.PI) * 1.1;
    drawParticle(0, state.boundY || 0, size, true, mode.color);
  }

  ctx.restore();
  addHit('载体蛋白', x, 344, 78, 104, 'rect');
}

function getCarrierLeafPose(side, topOpen, bottomOpen) {
  const openBalance = topOpen - bottomOpen;
  return {
    angle: side * openBalance * 0.2,
    xShift: side * openBalance * 6,
    yShift: 0,
  };
}

function drawCarrierLeaf(side, topOpen, bottomOpen, fillStyle) {
  const { angle, xShift, yShift } = getCarrierLeafPose(side, topOpen, bottomOpen);
  ctx.save();
  ctx.translate(xShift, yShift);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(side * 10, -65);
  ctx.bezierCurveTo(side * 37, -67, side * 48, -45, side * 43, -18);
  ctx.bezierCurveTo(side * 40, -3, side * 28, 7, side * 23, 14);
  ctx.bezierCurveTo(side * 37, 31, side * 34, 58, side * 12, 66);
  ctx.bezierCurveTo(side * 2, 54, side * 6, 31, side * 8, 14);
  ctx.bezierCurveTo(side * 9, 6, side * 12, 1, side * 16, -2);
  ctx.bezierCurveTo(side * 10, -12, side * 5, -30, side * 7, -47);
  ctx.bezierCurveTo(side * 8, -55, side * 9, -61, side * 10, -65);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = colors.ink;
  ctx.lineJoin = 'round';
  ctx.stroke();

  ctx.restore();
}

function drawCarrierBindingSite(state, mode, topOpen, bottomOpen) {
  const siteSide = 1;
  const site = getCarrierSiteLocal(state);
  const { angle, xShift, yShift } = getCarrierLeafPose(siteSide, topOpen, bottomOpen);

  ctx.save();
  ctx.translate(xShift, yShift);
  ctx.rotate(angle);
  ctx.translate(site.x, site.y);

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(-8, 0, 11, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(-8, -11);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-8, 0, 11, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  ctx.strokeStyle = mode.id === 'active' ? colors.atp : mode.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(-8, 0, 16, -Math.PI * 0.4, Math.PI * 0.4);
  ctx.stroke();
  ctx.restore();
}

function drawActiveCarrierProtein(time, mode) {
  const x = 400;
  const transportPhase = showPhosphorylation ? activePhaseAfterPhosphorylation(activeCarrierPhase) : activeProteinPhase;
  drawCarrierProtein(time, mode, x, getPumpState(transportPhase));
  if (showPhosphorylation) {
    drawPhosphorylationProcess(x, time, activeProteinPhase);
  } else {
    drawFixedAtpBadge(x + 96, 430, time);
    drawEnergyArrow(x + 54, 424, x + 14, 392, time);
  }
  addHit('主动运输载体', x, 344, 82, 108, 'rect');
  addHit('ATP', x + 112, 444, 68, 46, 'ellipse');
}

function drawPhosphorylationProcess(x, time, cycleT) {
  const incoming = { x: x + 188, y: 480 };
  const pTarget = { x: x + 28, y: 390 };
  const terminalOffset = atpComplexTerminalOffset(0.68);
  const source = {
    x: pTarget.x - terminalOffset.x,
    y: pTarget.y - terminalOffset.y,
  };
  const adpTarget = { x: x + 190, y: 482 };
  const arrive = smoothstep(0.02, 0.42, cycleT);
  const bindProgress = smoothstep(0.42, 0.58, cycleT);
  const adpLeave = smoothstep(0.6, 0.84, cycleT);
  const attached = cycleT >= 0.42 && cycleT < 0.9;
  const release = cycleT >= 0.9 ? smoothstep(0.9, 0.98, cycleT) : 0;
  const atp = {
    x: lerp(incoming.x, source.x, arrive),
    y: lerp(incoming.y, source.y, arrive),
  };

  if (cycleT < 0.6) {
    drawAtpComplex(atp.x, atp.y, 0.68, cycleT < 0.42);
  }

  const adpStart = atpComplexAppWorld(source.x, source.y, 0.68);
  const adp = {
    x: lerp(adpStart.x, adpTarget.x, adpLeave),
    y: lerp(adpStart.y, adpTarget.y, adpLeave),
  };
  if (cycleT >= 0.6 && cycleT < 0.84) {
    drawAppStructure(adp.x, adp.y, 0.58);
  }

  if (attached && release < 0.95) {
    const px = lerp(atpComplexTerminalWorld(atp.x, atp.y, 0.68).x, pTarget.x, bindProgress) + release * 24;
    const py = lerp(atpComplexTerminalWorld(atp.x, atp.y, 0.68).y, pTarget.y, bindProgress) - release * 8;
    drawPhosphateGroup(px, py, attached);
  }

  if (attached && release < 0.7) {
    ctx.save();
    ctx.fillStyle = colors.atp;
    ctx.font = '820 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('磷酸化', pTarget.x + 2, pTarget.y - 28);
    ctx.restore();
  }
}

function drawAtpComplex(x, y, scale = 1, showTerminal = true) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(Math.PI / 4);
  if (showTerminal) {
    drawPhosphateNode(-44, 0, '#ffe27a');
    drawBond(-32, 0, -20, 0);
  }
  drawPhosphateNode(-8, 0, '#ffc66a');
  drawPhosphateNode(28, 0, '#ffc66a');
  drawAdenosine(64, 0);
  drawBond(4, 0, 16, 0);
  drawBond(40, 0, 50, 0);
  ctx.restore();
}

function drawAppStructure(x, y, scale = 1, angle = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(angle);
  drawPhosphateNode(-8, 0, '#ffc66a');
  drawPhosphateNode(28, 0, '#ffc66a');
  drawAdenosine(64, 0);
  drawBond(4, 0, 16, 0);
  drawBond(40, 0, 50, 0);
  ctx.restore();
}

function atpComplexTerminalWorld(x, y, scale) {
  const point = atpComplexTerminalOffset(scale);
  return {
    x: x + point.x,
    y: y + point.y,
  };
}

function atpComplexTerminalOffset(scale) {
  const point = rotatePoint(-44, 0, Math.PI / 4);
  return {
    x: point.x * scale,
    y: point.y * scale,
  };
}

function atpComplexAppWorld(x, y, scale) {
  const point = rotatePoint(14, 0, Math.PI / 4);
  return {
    x: x + point.x * scale,
    y: y + point.y * scale,
  };
}

function rotatePoint(x, y, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

function drawAdenosine(x, y) {
  ctx.save();
  ctx.fillStyle = '#9ad8ff';
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2.5;
  roundRect(x - 14, y - 14, 28, 28, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#174866';
  ctx.font = '900 14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('A', x, y + 1);
  ctx.restore();
}

function drawPhosphateNode(x, y, fill = '#ffe27a') {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(x, y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a4b00';
  ctx.font = '900 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', x, y + 1);
  ctx.restore();
}

function drawBond(x1, y1, x2, y2) {
  ctx.save();
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawPhosphateGroup(x, y, attached = false) {
  ctx.save();
  ctx.fillStyle = attached ? '#ffcf5a' : '#ffe27a';
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.arc(x, y, attached ? 13 : 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a4b00';
  ctx.font = '900 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('P', x, y + 1);
  ctx.restore();
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
    const transportPhase = showPhosphorylation ? activePhaseAfterPhosphorylation(activeCarrierPhase) : activeCarrierPhase;
    drawCarrierTransportParticle(mode, 400, 'bottom', transportPhase, 2);
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
  const current = pointOnCarrierCycle(carrierT, entrySide, x);
  if (!current.visible) return;

  const prev = pointOnCarrierCycle((carrierT + 0.985) % 1, entrySide, x);
  if (prev.visible && Math.abs(current.y - prev.y) < 80) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineWidth = current.bound ? 6 : 4.6;
    ctx.strokeStyle = hexToRgb(mode.color.replace('#', ''), current.bound ? 0.2 : 0.28);
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(current.x, current.y);
    ctx.stroke();
    ctx.restore();
  }

  if (current.bound) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(current.x, current.y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgb(mode.color.replace('#', ''), 0.32);
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();
  }

  drawParticle(current.x, current.y, current.bound ? 10.4 : 9.2, true, mode.color);
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
    const gapX = 368;
    const enterOffset = (index % 3 - 1) * 16;
    const exitOffset = ((index + 1) % 3 - 1) * 14;
    const passOffset = (index % 2 ? 1.8 : -1.8);
    return [
      [gapX + enterOffset, 128],
      [gapX + enterOffset * 0.35, 230],
      [gapX + passOffset, 338],
      [gapX + exitOffset * 0.28, 468],
      [gapX + exitOffset, 534],
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

function getPumpState(phaseValue = activeProteinPhase) {
  const t = phaseValue % 1;
  const state = carrierStateFor(t, true);
  state.bound = 0;
  return state;
}

function activePhaseAfterPhosphorylation(t) {
  const cycleT = t % 1;
  if (cycleT < 0.2) {
    return smoothstep(0.02, 0.2, cycleT) * 0.2;
  }
  if (cycleT < 0.62) {
    return 0.2;
  }
  if (cycleT < 0.9) {
    return lerp(0.3, 0.78, smoothstep(0.62, 0.9, cycleT));
  }
  return lerp(0.78, 0.99, smoothstep(0.9, 0.99, cycleT));
}

function carrierStateFor(t, inverted) {
  let access = 0;
  if (t >= 0.3 && t < 0.58) {
    access = smoothstep(0.3, 0.58, t);
  } else if (t >= 0.58 && t < 0.78) {
    access = 1;
  } else if (t >= 0.78) {
    access = 1 - smoothstep(0.78, 0.98, t);
  }

  const entryOpen = 1 - access;
  const exitOpen = 1 - entryOpen;
  const entryIsTop = !inverted;
  const outerOpen = entryIsTop ? entryOpen : exitOpen;
  const innerOpen = entryIsTop ? exitOpen : entryOpen;

  return {
    outerOpen,
    innerOpen,
    access,
    entrySide: entryIsTop ? 'top' : 'bottom',
    bound: 0,
    boundY: carrierBoundY(t) * (inverted ? -1 : 1),
    t,
  };
}

function carrierBoundY(t) {
  return -31;
}

function getCarrierSiteLocal(state) {
  const entryTop = state.entrySide !== 'bottom';
  return {
    x: 15,
    y: entryTop ? -34 : 34,
  };
}

function getCarrierSiteWorld(x, state) {
  const topOpen = Math.max(0, Math.min(1, state.outerOpen || 0));
  const bottomOpen = Math.max(0, Math.min(1, state.innerOpen || 0));
  const siteSide = 1;
  const site = getCarrierSiteLocal(state);
  const bindX = site.x - 8;
  const { angle, xShift, yShift } = getCarrierLeafPose(siteSide, topOpen, bottomOpen);
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: x + xShift + bindX * cos - site.y * sin,
    y: 344 + yShift + bindX * sin + site.y * cos,
  };
}

function getCarrierPath(x, entrySide) {
  return entrySide === 'top'
    ? [[x, 132], [x, 236], [x, 344], [x, 452], [x, 532]]
    : [[x, 532], [x, 452], [x, 344], [x, 236], [x, 132]];
}

function pointOnCarrierCycle(t, entrySide = 'top', x = 500) {
  const entryTop = entrySide === 'top';
  const state = carrierStateFor(t, !entryTop);
  const site = getCarrierSiteWorld(x, state);
  const entry = { x: x - 32, y: entryTop ? 138 : 532 };
  const exit = { x: x + 32, y: entryTop ? 532 : 138 };

  if (t < 0.2) {
    const k = smoothstep(0.02, 0.2, t);
    return {
      x: lerp(entry.x, site.x, k),
      y: lerp(entry.y, site.y, k),
      bound: k > 0.82,
      visible: true,
    };
  }

  if (t < 0.62) {
    return { x: site.x, y: site.y, bound: true, visible: true };
  }

  if (t < 0.84) {
    const k = smoothstep(0.62, 0.84, t);
    return {
      x: lerp(site.x, exit.x, k),
      y: lerp(site.y, exit.y, k),
      bound: k < 0.15,
      visible: true,
    };
  }

  return { x: exit.x, y: exit.y, bound: false, visible: false };
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
  addHit(text, x + width / 2 - 2, y - 5, width / 2, 18, 'rect');
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
  showInfoCard(name);
}

function showInfoCard(name, clientX = null, clientY = null) {
  const text = info[name];
  if (!text) return;

  infoCardTitle.textContent = name;
  infoText.textContent = text;
  infoCard.hidden = false;

  const padding = 14;
  const fallbackX = window.innerWidth * 0.5;
  const fallbackY = window.innerHeight * 0.48;
  const x = clientX ?? fallbackX;
  const y = clientY ?? fallbackY;
  const rect = infoCard.getBoundingClientRect();
  const left = Math.min(window.innerWidth - rect.width - padding, Math.max(padding, x + 18));
  const top = Math.min(window.innerHeight - rect.height - padding, Math.max(padding, y + 18));

  infoCard.style.left = `${left}px`;
  infoCard.style.top = `${top}px`;
}

function hideInfoCard() {
  infoCard.hidden = true;
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

function lerp(a, b, t) {
  return a + (b - a) * t;
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
  if (name) {
    showInfoCard(name, event.clientX, event.clientY);
  } else {
    hideInfoCard();
  }
});

document.addEventListener('pointerdown', (event) => {
  if (event.target === canvas || infoCard.contains(event.target)) return;
  hideInfoCard();
});
