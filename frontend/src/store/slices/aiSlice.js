import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// API servisi
const API_URL = '/api/ai';

// Başlangıç durumu
const initialState = {
  loading: false,
  conversation: [],
  currentAnswer: null,
  teacherGender: 'male',
  error: null,
};

// Async actions

// Soru sorma
export const askQuestion = createAsyncThunk(
  'ai/askQuestion',
  async (questionData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      if (!token) {
        return rejectWithValue('Oturum açmanız gerekiyor');
      }

      // HTTP başlığını ayarla
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // API'ye istek gönderme
      const response = await axios.post(`${API_URL}/ask`, questionData, config);
      return {
        question: questionData.question,
        answer: response.data.data.answer,
        teacherGender: response.data.data.teacherGender,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Konu anlatımı
export const explainTopic = createAsyncThunk(
  'ai/explainTopic',
  async (topicData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      if (!token) {
        return rejectWithValue('Oturum açmanız gerekiyor');
      }

      // HTTP başlığını ayarla
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // API'ye istek gönderme
      const response = await axios.post(
        `${API_URL}/explain-topic`,
        topicData,
        config
      );
      return {
        topic: topicData.topic,
        explanation: response.data.data.explanation,
        teacherGender: response.data.data.teacherGender,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Test soruları oluşturma
export const generateQuestions = createAsyncThunk(
  'ai/generateQuestions',
  async (questionData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      if (!token) {
        return rejectWithValue('Oturum açmanız gerekiyor');
      }

      // HTTP başlığını ayarla
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // API'ye istek gönderme
      const response = await axios.post(
        `${API_URL}/generate-questions`,
        questionData,
        config
      );
      return {
        topic: questionData.topic,
        questions: response.data.data.questions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Öğrenci yanıtlarını değerlendirme
export const evaluateAnswer = createAsyncThunk(
  'ai/evaluateAnswer',
  async (answerData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      if (!token) {
        return rejectWithValue('Oturum açmanız gerekiyor');
      }

      // HTTP başlığını ayarla
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // API'ye istek gönderme
      const response = await axios.post(
        `${API_URL}/evaluate-answer`,
        answerData,
        config
      );
      return {
        question: answerData.question,
        answer: answerData.answer,
        evaluation: response.data.data.evaluation,
        teacherGender: response.data.data.teacherGender,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// Öğretmen karakteri seçimi
export const setTeacherCharacter = createAsyncThunk(
  'ai/setTeacherCharacter',
  async (genderData, { getState, rejectWithValue }) => {
    try {
      const token = getState().auth.token;

      if (!token) {
        return rejectWithValue('Oturum açmanız gerekiyor');
      }

      // HTTP başlığını ayarla
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // API'ye istek gönderme
      const response = await axios.post(
        `${API_URL}/set-teacher`,
        genderData,
        config
      );
      return {
        teacherGender: response.data.data.teacherGender,
      };
    } catch (error) {
      return rejectWithValue(
        error.response && error.response.data.message
          ? error.response.data.message
          : error.message
      );
    }
  }
);

// AI slice
const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    clearConversation: (state) => {
      state.conversation = [];
      state.currentAnswer = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // askQuestion
      .addCase(askQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(askQuestion.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAnswer = action.payload.answer;
        state.teacherGender = action.payload.teacherGender;
        state.conversation.unshift(action.payload); // En son soru en başa ekle
      })
      .addCase(askQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // explainTopic
      .addCase(explainTopic.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(explainTopic.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAnswer = action.payload.explanation;
        state.teacherGender = action.payload.teacherGender;
        state.conversation.unshift({
          question: `${action.payload.topic} konusunu anlat`,
          answer: action.payload.explanation,
          timestamp: action.payload.timestamp,
        });
      })
      .addCase(explainTopic.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // generateQuestions
      .addCase(generateQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateQuestions.fulfilled, (state, action) => {
        state.loading = false;
        // JSON olarak görüntülemek yerine formatlı metin olarak görüntüle
        let questionsText = `${action.payload.topic} konusuyla ilgili sorular:\n\n`;
        action.payload.questions.forEach((q, index) => {
          questionsText += `${index + 1}. ${q.question}\n`;
          q.options.forEach((option) => {
            questionsText += `   ${option}\n`;
          });
          questionsText += `   Doğru Cevap: ${q.correctAnswer}\n`;
          questionsText += `   Açıklama: ${q.explanation}\n\n`;
        });
        state.currentAnswer = questionsText;
      })
      .addCase(generateQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // evaluateAnswer
      .addCase(evaluateAnswer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(evaluateAnswer.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAnswer = action.payload.evaluation;
        state.teacherGender = action.payload.teacherGender;
      })
      .addCase(evaluateAnswer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // setTeacherCharacter
      .addCase(setTeacherCharacter.fulfilled, (state, action) => {
        state.teacherGender = action.payload.teacherGender;
      });
  },
});

export const { clearConversation, clearError } = aiSlice.actions;

export default aiSlice.reducer; 