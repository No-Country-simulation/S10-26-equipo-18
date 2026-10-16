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

interface UiState {
  configOpen: boolean;
  selectedLeadId: string | null;
  filtros: LeadQuery;
}

const initialState: UiState = {
  configOpen: false,
  selectedLeadId: null,
  filtros: filtrosIniciales,
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
  },
});

export const {
  abrirConfig,
  cerrarConfig,
  seleccionarLead,
  setFiltro,
  setFiltros,
  resetFiltros,
} = uiSlice.actions;
export default uiSlice.reducer;
