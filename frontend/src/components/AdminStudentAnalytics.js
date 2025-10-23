import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import './AdminStudentAnalytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend
);

const AdminStudentAnalytics = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentList, setStudentList] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('overview'); // overview, individual, comparison, predictions

  useEffect(() => {
    fetchStudentList();
  }, []);

  const fetchStudentList = async () => {
    try {
      // Simulated data - replace with actual API call
      setStudentList([
        { id: '1', name: 'Ahmet Yılmaz', grade: '5. Sınıf', performance: 85 },
        { id: '2', name: 'Ayşe Kaya', grade: '6. Sınıf', performance: 92 },
        { id: '3', name: 'Mehmet Demir', grade: '7. Sınıf', performance: 78 },
        { id: '4', name: 'Fatma Şahin', grade: '8. Sınıf', performance: 88 }
      ]);
    } catch (error) {
      console.error('Öğrenci listesi yüklenemedi:', error);
    }
  };

  const fetchStudentAnalytics = async (studentId) => {
    setLoading(true);
    try {
      const response = await api.post('/personalized/analyze-student', {
        student_id: studentId,
        include_predictions: true,
        include_recommendations: true
      });

      setAnalyticsData(response.data.analysis);
    } catch (error) {
      console.error('Analitik verisi yüklenemedi:', error);
      // Simulated data for demo
      setAnalyticsData(generateMockAnalytics(studentId));
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalytics = (studentId) => {
    return {
      student_id: studentId,
      holistic_profile: {
        cognitive: {
          bloom_level: 4,
          critical_thinking: 0.75,
          problem_solving: 0.82,
          creativity: 0.68,
          memory_retention: 0.85
        },
        affective: {
          motivation_type: 'intrinsic',
          engagement_level: 0.78,
          self_efficacy: 0.80,
          attitude_towards_learning: 0.85,
          emotional_stability: 0.72
        },
        social: {
          collaboration_skills: 0.76,
          communication: 0.82,
          leadership: 0.65,
          peer_interaction: 0.88
        },
        metacognitive: {
          self_awareness: 0.78,
          planning_skills: 0.72,
          monitoring: 0.80,
          evaluation: 0.75
        }
      },
      neurocognitive_profile: {
        attention_span: 0.75,
        working_memory_capacity: 7,
        processing_speed: 0.82,
        executive_function: 0.78,
        dopamine_level: 0.72,
        serotonin_level: 0.68
      },
      learning_modalities: [
        { type: 'visual_spatial', strength: 0.85 },
        { type: 'logical_mathematical', strength: 0.78 },
        { type: 'verbal_linguistic', strength: 0.65 }
      ],
      cognitive_state: 'flow',
      predictions: [
        {
          insight_type: 'success_probability',
          prediction: 0.85,
          confidence: 0.78,
          timeframe: '3_months',
          risk_level: 'low'
        },
        {
          insight_type: 'dropout_risk',
          prediction: 0.15,
          confidence: 0.82,
          timeframe: '1_month',
          risk_level: 'low'
        }
      ],
      learning_patterns: {
        patterns: {
          time: {
            preferred_hours: [10, 14, 19],
            average_session_duration: 45,
            consistency_score: 0.82
          },
          performance: {
            trend: 'improving',
            growth_rate: 0.12,
            peak_performance_times: ['morning', 'evening']
          }
        }
      }
    };
  };

  const performanceChartData = {
    labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
    datasets: [
      {
        label: 'Başarı Oranı',
        data: [65, 72, 78, 82, 85, 88],
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4
      },
      {
        label: 'Katılım Oranı',
        data: [70, 75, 80, 85, 87, 90],
        borderColor: 'rgb(72, 187, 120)',
        backgroundColor: 'rgba(72, 187, 120, 0.1)',
        tension: 0.4
      }
    ]
  };

  const learningModalitiesData = {
    labels: [
      'Görsel-Uzamsal',
      'İşitsel-Müzikal',
      'Sözel-Dilsel',
      'Mantıksal-Matematiksel',
      'Bedensel-Kinestetik',
      'Kişilerarası'
    ],
    datasets: [
      {
        label: 'Öğrenme Modaliteleri',
        data: [85, 65, 70, 90, 55, 75],
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
        borderColor: 'rgb(102, 126, 234)',
        pointBackgroundColor: 'rgb(102, 126, 234)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(102, 126, 234)'
      }
    ]
  };

  const subjectPerformanceData = {
    labels: ['Matematik', 'Fen', 'Türkçe', 'İngilizce', 'Sosyal'],
    datasets: [
      {
        label: 'Ders Başarısı',
        data: [85, 78, 92, 70, 80],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)'
        ]
      }
    ]
  };

  const cognitiveProfileData = {
    labels: ['Dikkat', 'Hafıza', 'İşleme Hızı', 'Problem Çözme', 'Yaratıcılık'],
    datasets: [
      {
        data: [75, 85, 82, 78, 68],
        backgroundColor: [
          'rgba(102, 126, 234, 0.8)',
          'rgba(72, 187, 120, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(236, 201, 75, 0.8)',
          'rgba(159, 122, 234, 0.8)'
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100
      }
    }
  };

  const renderOverview = () => (
    <div className="analytics-overview">
      <h2>📊 Genel Öğrenci Analitiği</h2>
      
      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>Toplam Öğrenci</h3>
            <p className="stat-value">1,247</p>
            <span className="stat-trend positive">+12% bu ay</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>Ortalama Başarı</h3>
            <p className="stat-value">%82</p>
            <span className="stat-trend positive">+5% artış</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>Risk Altındaki Öğrenciler</h3>
            <p className="stat-value">23</p>
            <span className="stat-trend negative">Müdahale gerekli</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🌟</div>
          <div className="stat-content">
            <h3>Üstün Başarılı</h3>
            <p className="stat-value">156</p>
            <span className="stat-trend positive">+8 öğrenci</span>
          </div>
        </div>
      </div>

      {/* Performance Trends */}
      <div className="chart-section">
        <h3>📈 Performans Trendleri</h3>
        <div className="chart-container">
          <Line data={performanceChartData} options={chartOptions} />
        </div>
      </div>

      {/* Subject Distribution */}
      <div className="charts-grid">
        <div className="chart-box">
          <h3>📚 Ders Bazlı Performans</h3>
          <Bar data={subjectPerformanceData} options={chartOptions} />
        </div>
        
        <div className="chart-box">
          <h3>🧠 Bilişsel Profil Dağılımı</h3>
          <Doughnut data={cognitiveProfileData} options={chartOptions} />
        </div>
      </div>
    </div>
  );

  const renderIndividualAnalytics = () => (
    <div className="individual-analytics">
      <h2>👤 Bireysel Öğrenci Analitiği</h2>
      
      {/* Student Selector */}
      <div className="student-selector">
        <select 
          value={selectedStudent?.id || ''}
          onChange={(e) => {
            const student = studentList.find(s => s.id === e.target.value);
            setSelectedStudent(student);
            if (student) fetchStudentAnalytics(student.id);
          }}
        >
          <option value="">Öğrenci Seçin</option>
          {studentList.map(student => (
            <option key={student.id} value={student.id}>
              {student.name} - {student.grade}
            </option>
          ))}
        </select>
      </div>

      {loading && <div className="loading">Analiz ediliyor...</div>}
      
      {analyticsData && !loading && (
        <div className="student-analytics-detail">
          {/* Holistic Profile */}
          <div className="profile-section">
            <h3>🎯 Bütünsel Profil</h3>
            <div className="profile-grid">
              <div className="profile-card">
                <h4>Bilişsel</h4>
                <div className="profile-metrics">
                  <div className="metric">
                    <span>Bloom Seviyesi:</span>
                    <strong>Seviye {analyticsData.holistic_profile.cognitive.bloom_level}</strong>
                  </div>
                  <div className="metric">
                    <span>Eleştirel Düşünme:</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{width: `${analyticsData.holistic_profile.cognitive.critical_thinking * 100}%`}}
                      />
                    </div>
                  </div>
                  <div className="metric">
                    <span>Problem Çözme:</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{width: `${analyticsData.holistic_profile.cognitive.problem_solving * 100}%`}}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="profile-card">
                <h4>Duyuşsal</h4>
                <div className="profile-metrics">
                  <div className="metric">
                    <span>Motivasyon:</span>
                    <strong>{analyticsData.holistic_profile.affective.motivation_type === 'intrinsic' ? 'İçsel' : 'Dışsal'}</strong>
                  </div>
                  <div className="metric">
                    <span>Katılım:</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{width: `${analyticsData.holistic_profile.affective.engagement_level * 100}%`}}
                      />
                    </div>
                  </div>
                  <div className="metric">
                    <span>Öz-yeterlik:</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{width: `${analyticsData.holistic_profile.affective.self_efficacy * 100}%`}}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Neurocognitive Profile */}
          <div className="neuro-section">
            <h3>🧠 Nöro-Bilişsel Profil</h3>
            <div className="neuro-grid">
              <div className="neuro-metric">
                <span className="label">Dikkat Süresi</span>
                <div className="circular-progress">
                  <span className="value">{Math.round(analyticsData.neurocognitive_profile.attention_span * 100)}%</span>
                </div>
              </div>
              <div className="neuro-metric">
                <span className="label">Çalışma Belleği</span>
                <div className="circular-progress">
                  <span className="value">{analyticsData.neurocognitive_profile.working_memory_capacity}</span>
                </div>
              </div>
              <div className="neuro-metric">
                <span className="label">İşleme Hızı</span>
                <div className="circular-progress">
                  <span className="value">{Math.round(analyticsData.neurocognitive_profile.processing_speed * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Modalities */}
          <div className="modalities-section">
            <h3>🎨 Öğrenme Modaliteleri</h3>
            <div className="radar-chart">
              <Radar data={learningModalitiesData} options={radarOptions} />
            </div>
          </div>

          {/* Predictions */}
          <div className="predictions-section">
            <h3>🔮 Tahminler ve Öneriler</h3>
            <div className="predictions-grid">
              {analyticsData.predictions.map((prediction, index) => (
                <div key={index} className={`prediction-card ${prediction.risk_level}`}>
                  <h4>{prediction.insight_type === 'success_probability' ? 'Başarı Olasılığı' : 'Bırakma Riski'}</h4>
                  <div className="prediction-value">
                    {Math.round(prediction.prediction * 100)}%
                  </div>
                  <div className="prediction-confidence">
                    Güven: {Math.round(prediction.confidence * 100)}%
                  </div>
                  <div className={`risk-badge ${prediction.risk_level}`}>
                    {prediction.risk_level === 'low' ? 'Düşük Risk' : 
                     prediction.risk_level === 'medium' ? 'Orta Risk' : 'Yüksek Risk'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderComparison = () => (
    <div className="comparison-analytics">
      <h2>📊 Karşılaştırmalı Analiz</h2>
      
      <div className="comparison-selector">
        <select multiple size="4">
          {studentList.map(student => (
            <option key={student.id} value={student.id}>
              {student.name} - {student.grade}
            </option>
          ))}
        </select>
        <button className="compare-btn">Karşılaştır</button>
      </div>

      <div className="comparison-results">
        <div className="chart-container">
          <Bar 
            data={{
              labels: ['Matematik', 'Fen', 'Türkçe', 'İngilizce'],
              datasets: [
                {
                  label: 'Ahmet Yılmaz',
                  data: [85, 78, 92, 70],
                  backgroundColor: 'rgba(102, 126, 234, 0.6)'
                },
                {
                  label: 'Ayşe Kaya',
                  data: [92, 85, 88, 85],
                  backgroundColor: 'rgba(72, 187, 120, 0.6)'
                }
              ]
            }}
            options={chartOptions}
          />
        </div>
      </div>
    </div>
  );

  const renderPredictions = () => (
    <div className="predictions-view">
      <h2>🔮 Tahmine Dayalı Analizler</h2>
      
      <div className="risk-students">
        <h3>⚠️ Risk Altındaki Öğrenciler</h3>
        <table className="risk-table">
          <thead>
            <tr>
              <th>Öğrenci</th>
              <th>Risk Tipi</th>
              <th>Risk Seviyesi</th>
              <th>Tahmini Süre</th>
              <th>Önerilen Müdahale</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mehmet Demir</td>
              <td>Bırakma Riski</td>
              <td className="risk-high">Yüksek</td>
              <td>2 hafta</td>
              <td>
                <button className="action-btn">Müdahale Planı</button>
              </td>
            </tr>
            <tr>
              <td>Zeynep Aktaş</td>
              <td>Performans Düşüşü</td>
              <td className="risk-medium">Orta</td>
              <td>1 ay</td>
              <td>
                <button className="action-btn">Destek Planı</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="success-predictions">
        <h3>🌟 Başarı Tahminleri</h3>
        <div className="success-grid">
          <div className="success-card">
            <h4>Yüksek Potansiyelli Öğrenciler</h4>
            <ul>
              <li>Ayşe Kaya - %92 başarı tahmini</li>
              <li>Ali Yıldız - %88 başarı tahmini</li>
              <li>Fatma Şahin - %85 başarı tahmini</li>
            </ul>
          </div>
          <div className="success-card">
            <h4>Gelişim Gösteren Öğrenciler</h4>
            <ul>
              <li>Hasan Öz - %15 performans artışı</li>
              <li>Elif Demir - %12 performans artışı</li>
              <li>Can Kaya - %10 performans artışı</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin-student-analytics">
      {/* Navigation */}
      <div className="analytics-nav">
        <button 
          className={activeView === 'overview' ? 'active' : ''}
          onClick={() => setActiveView('overview')}
        >
          📊 Genel Bakış
        </button>
        <button 
          className={activeView === 'individual' ? 'active' : ''}
          onClick={() => setActiveView('individual')}
        >
          👤 Bireysel Analiz
        </button>
        <button 
          className={activeView === 'comparison' ? 'active' : ''}
          onClick={() => setActiveView('comparison')}
        >
          📈 Karşılaştırma
        </button>
        <button 
          className={activeView === 'predictions' ? 'active' : ''}
          onClick={() => setActiveView('predictions')}
        >
          🔮 Tahminler
        </button>
      </div>

      {/* Content */}
      <div className="analytics-content">
        {activeView === 'overview' && renderOverview()}
        {activeView === 'individual' && renderIndividualAnalytics()}
        {activeView === 'comparison' && renderComparison()}
        {activeView === 'predictions' && renderPredictions()}
      </div>

      {/* Export Actions */}
      <div className="analytics-actions">
        <button className="export-btn">📊 Excel'e Aktar</button>
        <button className="export-btn">📄 PDF Raporu</button>
        <button className="export-btn">📧 Email Gönder</button>
        <button className="refresh-btn">🔄 Yenile</button>
      </div>
    </div>
  );
};

export default AdminStudentAnalytics;
