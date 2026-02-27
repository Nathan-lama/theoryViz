// ── UI Slice ────────────────────────────────────────────────────
// Manages: cinemaMode, hudVisible, audioMuted

export const uiSlice = (set) => ({
  cinemaMode: false,
  hudVisible: true,
  audioMuted: false,

  toggleCinema: () => set((s) => ({ cinemaMode: !s.cinemaMode, hudVisible: s.cinemaMode })),
  toggleHud: () => set((s) => ({ hudVisible: !s.hudVisible })),
  toggleMute: () => set((s) => ({ audioMuted: !s.audioMuted })),
})
