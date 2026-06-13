import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginUser, sendOtpApi, verifyOtpApi } from "../../../api/authApi";

// Async thunk for login
export const loginUserThunk = createAsyncThunk(
  "auth/loginUser",
  async (loginData, { rejectWithValue }) => {
    try {
      const response = await loginUser(loginData);

      // Store tokens in localStorage if they exist in response
      const token = response.data?.access_token;
      const refreshToken = response.data?.refresh_token;

      if (token) {
        localStorage.setItem("token", token);
      }
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      if (response.data?.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      // Return both data and message
      return {
        ...response.data,
        message: response.message,
      };
    } catch (error) {
      // Use backend message if available
      const errorMessage =
        error.response?.data?.message || "Login failed. Please try again.";
      return rejectWithValue(errorMessage);
    }
  },
);

// Async thunk for sending OTP
export const sendOtpThunk = createAsyncThunk(
  "auth/sendOtp",
  async (loginId, { rejectWithValue }) => {
    try {
      const response = await sendOtpApi(loginId);
      return response;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Failed to send OTP. Please try again.";
      return rejectWithValue(errorMessage);
    }
  },
);

// Async thunk for verifying OTP
export const verifyOtpThunk = createAsyncThunk(
  "auth/verifyOtp",
  async ({ loginId, otp }, { rejectWithValue }) => {
    try {
      const response = await verifyOtpApi(loginId, otp);

      // Store tokens in localStorage if they exist in response
      const token = response.data?.access_token;
      const refreshToken = response.data?.refresh_token;

      if (token) {
        localStorage.setItem("token", token);
      }
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
      if (response.data?.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      // Return both data and message
      return {
        ...response.data,
        message: response.message,
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        "Verification failed. Please try again.";
      return rejectWithValue(errorMessage);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null,
    token: localStorage.getItem("token") || null,
    refreshToken: localStorage.getItem("refreshToken") || null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.error = null;
      state.success = false;
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },
    updateTokens: (state, action) => {
      state.token = action.payload.access_token;
      if (action.payload.refresh_token) {
        state.refreshToken = action.payload.refresh_token;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUserThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(loginUserThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload?.user;
        state.token = action.payload?.access_token;
        state.refreshToken = action.payload?.refresh_token;
        state.success = true;
      })
      .addCase(loginUserThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      // Send OTP cases
      .addCase(sendOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendOtpThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Verify OTP cases
      .addCase(verifyOtpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(verifyOtpThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload?.user;
        state.token = action.payload?.access_token;
        state.refreshToken = action.payload?.refresh_token;
        state.success = true;
      })
      .addCase(verifyOtpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

export const { logout, updateTokens, clearError } = authSlice.actions;
export default authSlice.reducer;
