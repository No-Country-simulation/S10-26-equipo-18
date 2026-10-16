import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  vendedorId: string | null;
  hydrated: boolean;
}

const initialState: AuthState = {
  vendedorId: null,
  hydrated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setVendedor(state, action: PayloadAction<string | null>) {
      state.vendedorId = action.payload;
    },
    setHydrated(state, action: PayloadAction<boolean>) {
      state.hydrated = action.payload;
    },
    logout(state) {
      state.vendedorId = null;
    },
  },
});

export const { setVendedor, setHydrated, logout } = authSlice.actions;
export default authSlice.reducer;
