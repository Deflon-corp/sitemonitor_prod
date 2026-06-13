import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/auth/authSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here as the app grows
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Useful for some cases, but use with caution
    }),
});

export default store;
