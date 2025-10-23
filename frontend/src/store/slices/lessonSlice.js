import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Async thunks
export const fetchLessons = createAsyncThunk(
  'lessons/fetchLessons',
  async () => {
    const response = await axios.get(`${API_URL}/lessons`);
    return response.data;
  }
);

export const fetchLessonById = createAsyncThunk(
  'lessons/fetchLessonById',
  async (lessonId) => {
    const response = await axios.get(`${API_URL}/lessons/${lessonId}`);
    return response.data;
  }
);

export const createLesson = createAsyncThunk(
  'lessons/createLesson',
  async (lessonData) => {
    const response = await axios.post(`${API_URL}/lessons`, lessonData);
    return response.data;
  }
);

export const updateLesson = createAsyncThunk(
  'lessons/updateLesson',
  async ({ lessonId, lessonData }) => {
    const response = await axios.put(`${API_URL}/lessons/${lessonId}`, lessonData);
    return response.data;
  }
);

export const deleteLesson = createAsyncThunk(
  'lessons/deleteLesson',
  async (lessonId) => {
    await axios.delete(`${API_URL}/lessons/${lessonId}`);
    return lessonId;
  }
);

const initialState = {
  lessons: [],
  currentLesson: null,
  loading: false,
  error: null,
};

const lessonSlice = createSlice({
  name: 'lessons',
  initialState,
  reducers: {
    clearCurrentLesson: (state) => {
      state.currentLesson = null;
    },
    clearLessonError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch lessons
      .addCase(fetchLessons.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLessons.fulfilled, (state, action) => {
        state.loading = false;
        state.lessons = action.payload;
      })
      .addCase(fetchLessons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Fetch lesson by ID
      .addCase(fetchLessonById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLessonById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentLesson = action.payload;
      })
      .addCase(fetchLessonById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Create lesson
      .addCase(createLesson.pending, (state) => {
        state.loading = true;
      })
      .addCase(createLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.lessons.push(action.payload);
      })
      .addCase(createLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update lesson
      .addCase(updateLesson.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateLesson.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.lessons.findIndex(lesson => lesson.id === action.payload.id);
        if (index !== -1) {
          state.lessons[index] = action.payload;
        }
        if (state.currentLesson?.id === action.payload.id) {
          state.currentLesson = action.payload;
        }
      })
      .addCase(updateLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Delete lesson
      .addCase(deleteLesson.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteLesson.fulfilled, (state, action) => {
        state.loading = false;
        state.lessons = state.lessons.filter(lesson => lesson.id !== action.payload);
        if (state.currentLesson?.id === action.payload) {
          state.currentLesson = null;
        }
      })
      .addCase(deleteLesson.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { clearCurrentLesson, clearLessonError } = lessonSlice.actions;
export default lessonSlice.reducer;
