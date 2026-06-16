export function createAnimationState() {
  return {
    playing: true,
    activeMode: 0,
    phase: 0,
    flowPhase: 0,
    facilitatedFlowPhase: 0,
    carrierPhase: 0,
    activeCarrierPhase: 0,
    activeProteinPhase: 0,
    showPhosphorylation: false,
  };
}

export function resetAnimation(state) {
  state.phase = 0;
  state.flowPhase = 0;
  state.facilitatedFlowPhase = 0;
  state.carrierPhase = 0;
  state.activeCarrierPhase = 0;
  state.activeProteinPhase = 0;
  state.playing = true;
}

export function advanceAnimation(state, delta) {
  if (!state.playing) return;

  state.phase = (state.phase + delta * 0.12) % 1;
  state.flowPhase = (state.flowPhase + delta * 0.13) % 1;
  state.facilitatedFlowPhase = (state.facilitatedFlowPhase + delta * 0.24) % 1;
  state.carrierPhase = (state.carrierPhase + delta * 0.63) % 1;
  state.activeCarrierPhase = (state.activeCarrierPhase + delta * 0.6075) % 1;
  state.activeProteinPhase = state.activeCarrierPhase;
}
