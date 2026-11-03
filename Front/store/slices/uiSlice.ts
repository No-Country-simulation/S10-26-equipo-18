import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { LeadQuery } from "@/lib/types";

export const filtrosIniciales: LeadQuery = {
  search: "",
  ciudad: "",
  rubro: "",
  problema: "",
  estado: "",
  severidad: "",
  canal: "",
  sort: "rating-asc",
};

type Tema = "oscuro" | "claro";

interface UiState {
  configOpen: boolean;
  selectedLeadId: string | null;
  filtros: LeadQuery;
  tema: Tema;
  sidebarColapsado: boolean;
}

const initialState: UiState = {
  configOpen: false,
  selectedLeadId: null,
  filtros: filtrosIniciales,
  tema: "oscuro",
  sidebarColapsado: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    abrirConfig(state) {
      state.configOpen = true;
    },
    cerrarConfig(state) {
      state.configOpen = false;
    },
    seleccionarLead(state, action: PayloadAction<string | null>) {
      state.selectedLeadId = action.payload;
    },
    setFiltro(
      state,
      action: PayloadAction<{ key: keyof LeadQuery; value: string }>,
    ) {
      state.filtros[action.payload.key] = action.payload.value;
    },
    setFiltros(state, action: PayloadAction<LeadQuery>) {
      state.filtros = { ...state.filtros, ...action.payload };
    },
    resetFiltros(state) {
      state.filtros = filtrosIniciales;
    },
    setTema(state, action: PayloadAction<Tema>) {
      state.tema = action.payload;
    },
    alternarTema(state) {
      state.tema = state.tema === "oscuro" ? "claro" : "oscuro";
    },
    toggleSidebar(state) {
      state.sidebarColapsado = !state.sidebarColapsado;
    },
    setSidebarColapsado(state, action: PayloadAction<boolean>) {
      state.sidebarColapsado = action.payload;
    },
  },
});

export const {
  abrirConfig,
  cerrarConfig,
  seleccionarLead,
  setFiltro,
  setFiltros,
  resetFiltros,
  setTema,
  alternarTema,
  toggleSidebar,
  setSidebarColapsado,
} = uiSlice.actions;
export default uiSlice.reducer;
