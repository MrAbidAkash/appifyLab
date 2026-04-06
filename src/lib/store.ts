// src/lib/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { userApi } from "./services/userApi";
import userReducer from "./slices/userSlice";

export function makeStore() {
  return configureStore({
    reducer: {
      [userApi.reducerPath]: userApi.reducer,
      // add other reducers / slices here
      user: userReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(userApi.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
