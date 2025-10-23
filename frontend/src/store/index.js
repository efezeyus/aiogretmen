import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { combineReducers } from 'redux';

// Slice'lar
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import lessonReducer from './slices/lessonSlice';
import aiReducer from './slices/aiSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  ui: uiReducer,
  lessons: lessonReducer,
  ai: aiReducer,
});

// Redux Persist yapılandırma
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Sadece auth durumunu kalıcı hale getir
};

// Kalıcı reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Store oluşturma
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

// Default export for App.js
export default store; 