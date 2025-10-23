import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './CourseList.css';

function CourseList() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Öğrenci sınıfını al
  const studentGrade = parseInt(localStorage.getItem('userGrade') || '5');

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGrade || selectedSubject) {
      filterCourses();
    }
  }, [selectedGrade, selectedSubject]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Öğrencinin sınıfını al (localStorage'dan en güncel)
      const userGrade = parseInt(localStorage.getItem('userGrade'));
      const grade = selectedGrade || userGrade || studentGrade;
      
      console.log('📚 Dersler yükleniyor...');
      console.log('🎓 Öğrenci sınıfı:', userGrade);
      console.log('📖 Yüklenecek sınıf:', grade);
      
      // Her zaman demo data'yı yükle (backend olmasa da çalışsın)
      loadDemoData(grade);
      
      // Eğer backend çalışıyorsa gerçek veriyi de dene
      try {
        const subjectsResponse = await api.get(`/curriculum/meb/grade/${grade}/subjects`);
        
        if (subjectsResponse && Array.isArray(subjectsResponse)) {
          setSubjects(subjectsResponse);
          console.log('✅ MEB dersleri yüklendi:', subjectsResponse.length);
          
          // Her ders için içerik oluştur
          await loadCoursesFromSubjects(subjectsResponse, grade);
        }
      } catch (apiError) {
        console.warn('⚠️ MEB API hatası, demo data kullanılıyor:', apiError);
        // Demo data zaten yüklendi, devam et
      }
      
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
      // Demo data zaten yüklendi
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesFromSubjects = async (subjectsList, grade) => {
    const coursesList = [];

    for (const subject of subjectsList) {
      try {
        // Her ders için detaylı müfredat al
        const detailResponse = await api.get(
          `/curriculum/meb/grade/${grade}/detailed?subject=${subject.key}`
        );

        if (detailResponse && detailResponse.learning_areas) {
          // Learning area'lardan kurslar oluştur
          detailResponse.learning_areas.forEach((area, areaIndex) => {
            area.units?.forEach((unit, unitIndex) => {
              coursesList.push({
                id: `${subject.key}_${areaIndex}_${unitIndex}`,
                title: `${grade}. Sınıf ${subject.name} - ${unit.title}`,
                subject: subject.name,
                subjectKey: subject.key,
                grade: grade,
                description: unit.description || area.name,
                estimatedHours: unit.estimated_hours || 4,
                topicsCount: unit.topics?.length || 0,
                difficulty: determineDifficulty(unit.estimated_hours),
                icon: getSubjectIcon(subject.key),
                progress: Math.floor(Math.random() * 100), // Demo progress
                enrolled: Math.random() > 0.5
              });
            });
          });
        }
      } catch (detailError) {
        console.warn(`${subject.name} detay alınamadı:`, detailError);
      }
    }

    setCourses(coursesList);
    console.log('✅ Kurslar oluşturuldu:', coursesList.length);
  };

  const filterCourses = () => {
    loadInitialData();
  };

  const loadDemoData = (grade = 6) => {
    console.log('📦 Demo data yükleniyor, sınıf:', grade);
    
    // Demo subjects
    const demoSubjects = [
      { key: 'matematik', name: 'Matematik', weekly_hours: 6 },
      { key: 'turkce', name: 'Türkçe', weekly_hours: 6 },
      { key: 'fen_bilimleri', name: 'Fen Bilimleri', weekly_hours: 4 },
      { key: 'sosyal_bilgiler', name: 'Sosyal Bilgiler', weekly_hours: 3 },
      { key: 'ingilizce', name: 'İngilizce', weekly_hours: 4 }
    ];
    setSubjects(demoSubjects);

    // Demo courses - sınıfa göre
    const demoCourses = [
      {
        id: 1,
        title: `${grade}. Sınıf Matematik - ${grade === 6 ? 'Tam Sayılar' : 'Doğal Sayılar'}`,
        subject: 'Matematik',
        subjectKey: 'matematik',
        grade: grade,
        description: grade === 6 ? 'Pozitif ve negatif tam sayılar, işlemler' : 'Doğal sayıları okuma, yazma ve işlemler yapma',
        estimatedHours: grade === 6 ? 14 : 12,
        topicsCount: 4,
        difficulty: 'Orta',
        icon: '📐',
        progress: 0,
        enrolled: true
      },
      {
        id: 2,
        title: `${grade}. Sınıf Matematik - Kesirlerle İşlemler`,
        subject: 'Matematik',
        subjectKey: 'matematik',
        grade: grade,
        description: grade === 6 ? 'Paydaları farklı kesirlerde toplama ve çıkarma, çarpma ve bölme' : 'Kesir kavramı ve kesirlerle işlemler',
        estimatedHours: 16,
        topicsCount: 6,
        difficulty: 'Orta',
        icon: '📐',
        progress: 0,
        enrolled: true
      },
      {
        id: 3,
        title: `${grade}. Sınıf Fen Bilimleri - ${grade === 6 ? 'Güneş Sistemi ve Tutulmalar' : 'Canlılar ve Çevre'}`,
        subject: 'Fen Bilimleri',
        subjectKey: 'fen_bilimleri',
        grade: grade,
        description: grade === 6 ? 'Gezegen hareketleri, Ay evreleri ve tutulma olayları' : 'İnsan ve çevre ilişkisi, ekosistem',
        estimatedHours: grade === 6 ? 12 : 10,
        topicsCount: grade === 6 ? 4 : 3,
        difficulty: 'Orta',
        icon: '🧪',
        progress: 0,
        enrolled: true
      },
      {
        id: 4,
        title: `${grade}. Sınıf Türkçe - ${grade === 6 ? 'Okuduğunu Anlama' : 'Yazılı Anlatım'}`,
        subject: 'Türkçe',
        subjectKey: 'turkce',
        grade: grade,
        description: grade === 6 ? 'Metin türleri ve anlama stratejileri' : 'Yaratıcı yazma ve kompozisyon teknikleri',
        estimatedHours: 18,
        topicsCount: grade === 6 ? 6 : 5,
        difficulty: 'Orta',
        icon: '📖',
        progress: 0,
        enrolled: true
      },
      {
        id: 5,
        title: `${grade}. Sınıf Sosyal Bilgiler - ${grade === 6 ? 'Yeryüzünde Yaşam' : 'Türkiye Coğrafyası'}`,
        subject: 'Sosyal Bilgiler',
        subjectKey: 'sosyal_bilgiler',
        grade: grade,
        description: grade === 6 ? 'Coğrafi bölgeler, kıtalar ve okyanuslar' : 'Türkiye\'nin coğrafi özellikleri ve iklim',
        estimatedHours: 12,
        topicsCount: 4,
        difficulty: 'Kolay',
        icon: '🌍',
        progress: 0,
        enrolled: true
      },
      {
        id: 6,
        title: `${grade}. Sınıf İngilizce - ${grade === 6 ? 'Present Continuous' : 'My Daily Routine'}`,
        subject: 'İngilizce',
        subjectKey: 'ingilizce',
        grade: grade,
        description: grade === 6 ? 'Şimdiki zamanda devam eden eylemler' : 'Günlük rutin ve aktiviteler',
        estimatedHours: 10,
        topicsCount: 3,
        difficulty: 'Kolay',
        icon: '🇬🇧',
        progress: 0,
        enrolled: true
      }
    ];

    setCourses(demoCourses);
    console.log('✅ Demo dersler yüklendi:', demoCourses.length);
  };

  const determineDifficulty = (hours) => {
    if (hours <= 8) return 'Kolay';
    if (hours <= 15) return 'Orta';
    return 'Zor';
  };

  const getSubjectIcon = (subjectKey) => {
    const icons = {
      'matematik': '📐',
      'turkce': '📖',
      'fen_bilimleri': '🧪',
      'sosyal_bilgiler': '🌍',
      'ingilizce': '🇬🇧',
      'gorsel_sanatlar': '🎨',
      'muzik': '🎵',
      'beden_egitimi': '⚽'
    };
    return icons[subjectKey] || '📚';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-animation">📚</div>
        <div>Dersler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="course-list">
      <div className="course-header">
        <button className="btn-back" onClick={() => navigate('/student/dashboard')}>
          ← Dashboard
        </button>
        <h1>📚 Derslerim ({studentGrade}. Sınıf)</h1>
      </div>

      <div className="filters">
        <select 
          value={selectedGrade || studentGrade} 
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="filter-select"
        >
          <option value="">Sınıf Seç</option>
          {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
            <option key={grade} value={grade}>{grade}. Sınıf</option>
          ))}
        </select>

        <select 
          value={selectedSubject} 
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="filter-select"
        >
          <option value="">Tüm Dersler</option>
          {subjects.map(subject => (
            <option key={subject.key} value={subject.key}>{subject.name}</option>
          ))}
        </select>
        
        <div className="course-count">
          {courses.length} ders bulundu
        </div>
      </div>

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="no-courses">
            <div className="no-courses-icon">📚</div>
            <div className="no-courses-text">Henüz ders bulunmuyor.</div>
            <button className="btn-refresh" onClick={loadInitialData}>
              🔄 Yenile
            </button>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-icon-large">{course.icon}</div>
              <div className="course-content">
                <div className="course-header-info">
                  <span className="course-subject-badge">{course.subject}</span>
                  <span className="course-difficulty-badge">{course.difficulty}</span>
                </div>
                
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.description}</p>
                
                <div className="course-meta-grid">
                  <div className="meta-item">
                    <span className="meta-icon">⏱️</span>
                    <span>{course.estimatedHours} saat</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-icon">📝</span>
                    <span>{course.topicsCount} konu</span>
                  </div>
                  {course.enrolled && (
                    <div className="meta-item enrolled-badge">
                      <span className="meta-icon">✅</span>
                      <span>Kayıtlı</span>
                    </div>
                  )}
                </div>

                {course.progress > 0 && (
                  <div className="course-progress-section">
                    <div className="progress-label">
                      <span>İlerleme</span>
                      <span className="progress-percent">%{course.progress}</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="course-actions">
                  {course.enrolled ? (
                    <button 
                      className="btn-continue"
                      onClick={() => navigate(`/student/lesson/${course.id}`)}
                    >
                      ▶️ Devam Et
                    </button>
                  ) : (
                    <button 
                      className="btn-enroll"
                      onClick={() => {
                        alert('✅ Derse kaydoldunuz!');
                        setCourses(courses.map(c => 
                          c.id === course.id ? { ...c, enrolled: true } : c
                        ));
                      }}
                    >
                      ➕ Kayıt Ol
                    </button>
                  )}
                  <button 
                    className="btn-preview"
                    onClick={() => navigate(`/student/lesson/${course.id}`)}
                  >
                    👁️ Önizle
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default CourseList; 