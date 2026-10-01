import { createSlice } from '@reduxjs/toolkit';

// Retrieve initial auth state from localStorage safely
const savedToken = localStorage.getItem('access_token');
const savedRefreshToken = localStorage.getItem('refresh_token');
const savedUserStr = localStorage.getItem('user_info');

let parsedUser = null;
try {
  parsedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
} catch (error) {
  parsedUser = null;
}

const initialState = {
  token: savedToken || null,
  refreshToken: savedRefreshToken || null,
  user: parsedUser,
  isAuthenticated: !!savedToken,
  role: parsedUser ? parsedUser.role : null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { access, refresh, user } = action.payload;
      state.token = access;
      state.refreshToken = refresh || state.refreshToken;
      state.user = user;
      state.isAuthenticated = true;
      state.role = user ? user.role : null;

      localStorage.setItem('access_token', access);
      if (refresh) {
        localStorage.setItem('refresh_token', refresh);
      }
      if (user) {
        localStorage.setItem('user_info', JSON.stringify(user));
      }
    },
    updateUserProfile: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user_info', JSON.stringify(state.user));
    },
    logout: (state) => {
      state.token = null;
      state.refreshToken = null;
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
    },
  },
});

export const { setCredentials, updateUserProfile, logout } = authSlice.actions;

export default authSlice.reducer;
