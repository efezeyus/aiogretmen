import { createSlice } from '@reduxjs/toolkit';

// Başlangıç durumu
const initialState = {
  darkMode: false,
  sidebarOpen: false,
  notifications: [],
  activeModule: null,
};

// UI slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    addNotification: (state, action) => {
      state.notifications.push({
        id: Date.now(),
        ...action.payload,
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notification) => notification.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    setActiveModule: (state, action) => {
      state.activeModule = action.payload;
    },
  },
});

export const {
  toggleDarkMode,
  setSidebarOpen,
  toggleSidebar,
  addNotification,
  removeNotification,
  clearNotifications,
  setActiveModule,
} = uiSlice.actions;

export default uiSlice.reducer; 