/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
  user: any | null;
  // token: string | null;
}

// Try to read from localStorage (client-side only)
let storedUser: any = null;
// let storedToken: string | null = null;

if (typeof window !== "undefined") {
  const userData = localStorage.getItem("user");
  // const tokenData = localStorage.getItem("token");

  if (userData) storedUser = JSON.parse(userData);
  // if (tokenData) storedToken = tokenData;
}

const initialState: UserState = {
  user: storedUser,
  // token: storedToken,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ user: any; token: string }>) => {
      state.user = action.payload.user;
      // state.token = action.payload.token;

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        // localStorage.setItem("token", action.payload.token);
      }
    },
    clearUser: (state) => {
      state.user = null;
      // state.token = null;

      if (typeof window !== "undefined") {
        localStorage.removeItem("user");
        // localStorage.removeItem("token");
      }
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
