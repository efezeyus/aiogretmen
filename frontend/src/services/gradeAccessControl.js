/**
 * Sınıf Bazlı Erişim Kontrolü
 * 
 * ÖNEMLİ KURAL:
 * - Öğrenci SADECE kendi sınıfının derslerini görebilir
 * - 5. sınıf öğrencisi → Sadece 5. sınıf dersleri
 * - 6. sınıf öğrencisi → Sadece 6. sınıf dersleri
 * - Diğer sınıfların derslerine ERİŞEMEZ!
 * 
 * GÜVENLİK:
 * - Frontend filtreleme
 * - Backend doğrulama
 * - URL manipülasyonuna karşı korumalı
 */

class GradeAccessControl {
  constructor() {
    this.studentGrade = null;
    this.studentId = null;
  }

  /**
   * Öğrenci bilgilerini yükle
   */
  initialize() {
    this.studentGrade = parseInt(localStorage.getItem('userGrade')) || null;
    this.studentId = localStorage.getItem('userId') || null;
    
    console.log(`🔐 Erişim kontrolü aktif: ${this.studentGrade}. sınıf öğrencisi`);
  }

  /**
   * Öğrenci bu derse erişebilir mi?
   */
  canAccessLesson(lesson) {
    if (!lesson) return false;
    
    // Sınıf kontrolü
    if (lesson.grade !== this.studentGrade) {
      console.warn(`❌ Erişim engellendi: ${lesson.grade}. sınıf dersi, öğrenci ${this.studentGrade}. sınıf`);
      return false;
    }

    return true;
  }

  /**
   * Dersleri filtrele - SADECE kendi sınıfı
   */
  filterLessons(lessons) {
    if (!lessons || !Array.isArray(lessons)) return [];
    
    const filtered = lessons.filter(lesson => {
      // Sınıf eşleşmesi kontrolü
      return lesson.grade === this.studentGrade;
    });

    console.log(`📚 ${filtered.length}/${lessons.length} ders erişilebilir (${this.studentGrade}. sınıf)`);
    
    return filtered;
  }

  /**
   * Müfredatı filtrele
   */
  filterCurriculum(curriculum) {
    if (!curriculum) return null;
    
    // Sadece kendi sınıfının müfredatı
    if (curriculum.grade !== this.studentGrade) {
      console.warn(`❌ Müfredat erişimi engellendi: ${curriculum.grade}. sınıf`);
      return null;
    }

    return curriculum;
  }

  /**
   * Üniteleri filtrele
   */
  filterUnits(units) {
    if (!units || !Array.isArray(units)) return [];
    
    // Tüm üniteler aynı sınıfa ait olmalı
    const filtered = units.filter(unit => {
      // Unit içindeki derslerin grade'ini kontrol et
      if (unit.lessons && unit.lessons.length > 0) {
        return unit.lessons[0].grade === this.studentGrade;
      }
      return true;
    });

    return filtered;
  }

  /**
   * Erişim engelleme mesajı
   */
  getAccessDeniedMessage(attemptedGrade) {
    return {
      title: '🔒 Erişim Engellendi',
      message: `Bu ${attemptedGrade}. sınıf dersidir. Sen ${this.studentGrade}. sınıf öğrencisisin, bu derse erişemezsin.`,
      suggestion: `${this.studentGrade}. sınıf derslerine dönmek için Dashboard'a git.`,
      code: 'GRADE_ACCESS_DENIED'
    };
  }

  /**
   * Öğrenci sınıfını değiştir (Admin onayı ile)
   */
  updateStudentGrade(newGrade, adminApproved = false) {
    if (!adminApproved) {
      console.warn('❌ Sınıf değişikliği admin onayı gerektirir!');
      return false;
    }

    const oldGrade = this.studentGrade;
    this.studentGrade = newGrade;
    localStorage.setItem('userGrade', newGrade.toString());
    
    console.log(`✅ Sınıf değişti: ${oldGrade} → ${newGrade} (Admin onaylı)`);
    return true;
  }

  /**
   * Güvenlik doğrulaması
   */
  validateAccess(resourceGrade, resourceType = 'ders') {
    if (resourceGrade !== this.studentGrade) {
      const denial = this.getAccessDeniedMessage(resourceGrade);
      
      // Güvenlik log'u
      console.error('🚨 GÜVENLIK: Yetkisiz erişim denemesi!', {
        studentId: this.studentId,
        studentGrade: this.studentGrade,
        attemptedGrade: resourceGrade,
        resourceType: resourceType,
        timestamp: new Date().toISOString()
      });

      return {
        allowed: false,
        denial: denial
      };
    }

    return {
      allowed: true
    };
  }

  /**
   * Sınıf bilgisini al
   */
  getStudentGrade() {
    return this.studentGrade;
  }

  /**
   * Sadece kendi sınıfının dersleri var mı kontrol et
   */
  hasAccessToGrade(grade) {
    return grade === this.studentGrade;
  }
}

// Singleton
const gradeAccessControl = new GradeAccessControl();

// Otomatik başlat
if (typeof window !== 'undefined') {
  gradeAccessControl.initialize();
}

export default gradeAccessControl;

