// Yapay Zeka Öğretmen - Ana JavaScript Dosyası

document.addEventListener('DOMContentLoaded', function() {
    // Mobil Menü Düğmesi
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
        });
    }
    
    // Animasyonlar için görünüm tespiti
    const animatedElements = document.querySelectorAll('.animate');
    
    function checkViewport() {
        const triggerBottom = window.innerHeight * 0.8;
        
        animatedElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < triggerBottom) {
                element.classList.add('active');
            }
        });
    }
    
    // Sayfa yüklendiğinde ve kaydırma yapıldığında kontrol et
    if (animatedElements.length > 0) {
        checkViewport();
        window.addEventListener('scroll', checkViewport);
    }
    
    // Admin panel için tablo arama
    const tableSearch = document.getElementById('table-search');
    if (tableSearch) {
        tableSearch.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('.admin-table tbody tr');
            
            tableRows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Modal işlemleri
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const modalCloseButtons = document.querySelectorAll('[data-modal-close]');
    const modals = document.querySelectorAll('.modal');
    
    if (modalTriggers.length > 0) {
        modalTriggers.forEach(trigger => {
            trigger.addEventListener('click', () => {
                const modalId = trigger.getAttribute('data-modal-target');
                const modal = document.getElementById(modalId);
                if (modal) {
                    modal.classList.add('active');
                }
            });
        });
        
        modalCloseButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        window.addEventListener('click', (e) => {
            modals.forEach(modal => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
    }
    
    // Form doğrulama
    const forms = document.querySelectorAll('.validate-form');
    if (forms.length > 0) {
        forms.forEach(form => {
            form.addEventListener('submit', function(event) {
                let isValid = true;
                const requiredFields = form.querySelectorAll('[required]');
                
                requiredFields.forEach(field => {
                    if (!field.value.trim()) {
                        isValid = false;
                        field.classList.add('error');
                        
                        const errorElement = field.nextElementSibling;
                        if (errorElement && errorElement.classList.contains('error-message')) {
                            errorElement.textContent = 'Bu alan zorunludur.';
                        } else {
                            const errorMessage = document.createElement('div');
                            errorMessage.classList.add('error-message');
                            errorMessage.textContent = 'Bu alan zorunludur.';
                            field.insertAdjacentElement('afterend', errorMessage);
                        }
                    } else {
                        field.classList.remove('error');
                        
                        const errorElement = field.nextElementSibling;
                        if (errorElement && errorElement.classList.contains('error-message')) {
                            errorElement.textContent = '';
                        }
                    }
                });
                
                if (!isValid) {
                    event.preventDefault();
                }
            });
        });
    }
    
    // Admin Panel Grafikleri (eğer Chart.js yüklü ise)
    if (typeof Chart !== 'undefined') {
        // Kullanıcı istatistikleri grafiği
        const userStatsCanvas = document.getElementById('user-stats-chart');
        if (userStatsCanvas) {
            const userStatsChart = new Chart(userStatsCanvas, {
                type: 'line',
                data: {
                    labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
                    datasets: [{
                        label: 'Yeni Kullanıcılar',
                        data: [12, 19, 3, 5, 2, 3],
                        backgroundColor: 'rgba(78, 84, 200, 0.2)',
                        borderColor: 'rgba(78, 84, 200, 1)',
                        borderWidth: 2,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
        
        // Dersler istatistik grafiği
        const lessonStatsCanvas = document.getElementById('lesson-stats-chart');
        if (lessonStatsCanvas) {
            const lessonStatsChart = new Chart(lessonStatsCanvas, {
                type: 'bar',
                data: {
                    labels: ['Matematik', 'Fen Bilgisi', 'Türkçe', 'Sosyal Bilgiler', 'İngilizce'],
                    datasets: [{
                        label: 'Tamamlanan Dersler',
                        data: [125, 95, 80, 60, 45],
                        backgroundColor: [
                            'rgba(78, 84, 200, 0.6)',
                            'rgba(93, 170, 224, 0.6)',
                            'rgba(40, 167, 69, 0.6)',
                            'rgba(255, 193, 7, 0.6)',
                            'rgba(220, 53, 69, 0.6)'
                        ],
                        borderColor: [
                            'rgba(78, 84, 200, 1)',
                            'rgba(93, 170, 224, 1)',
                            'rgba(40, 167, 69, 1)',
                            'rgba(255, 193, 7, 1)',
                            'rgba(220, 53, 69, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }
});

// Admin Panel JavaScript Functions
document.addEventListener('DOMContentLoaded', function() {
    // Dropdown için tıklama dinleyicisi
    initDropdowns();
    
    // Sidebar menü dropdown'ları
    initSidebarDropdowns();
    
    // Modal işlevleri
    initModals();
    
    // Tablo için tüm satırları seçme
    initSelectAllCheckboxes();
    
    // Form doğrulama
    initFormValidation();
    
    // Etiket girişi için
    initTagInputs();
});

// Dropdown Menüler
function initDropdowns() {
    document.querySelectorAll('.dropdown-toggle').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const dropdown = this.closest('.dropdown');
            const isOpen = dropdown.classList.contains('show');
            
            // Tüm açık dropdown'ları kapat
            document.querySelectorAll('.dropdown.show').forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('show');
                }
            });
            
            // Bu dropdown'u aç/kapat
            dropdown.classList.toggle('show');
        });
    });
    
    // Dropdown dışında bir yere tıklandığında kapat
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            document.querySelectorAll('.dropdown.show').forEach(d => {
                d.classList.remove('show');
            });
        }
    });
}

// Sidebar Menü Dropdown'ları
function initSidebarDropdowns() {
    document.querySelectorAll('.menu-dropdown > a').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            const parent = this.parentElement;
            const isOpen = parent.classList.contains('open');
            
            // Diğer açık menüleri kapat
            document.querySelectorAll('.menu-dropdown.open').forEach(menu => {
                if (menu !== parent) {
                    menu.classList.remove('open');
                }
            });
            
            // Bu menüyü aç/kapat
            parent.classList.toggle('open');
        });
    });
    
    // Aktif sayfaya göre menüyü aç
    document.querySelectorAll('.submenu a.active').forEach(item => {
        const parent = item.closest('.menu-dropdown');
        if (parent) {
            parent.classList.add('open');
        }
    });
}

// Modallar
function initModals() {
    // Modal açma
    document.querySelectorAll('[data-modal-target]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.dataset.modalTarget;
            openModal(modalId);
        });
    });
    
    // Modal kapatma
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    // Arka plana tıklayarak kapatma
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // ESC tuşu ile kapatma
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.open');
            if (openModal) {
                closeModal(openModal.id);
            }
        }
    });
}

// Modal açma fonksiyonu
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden'; // Scroll'u devre dışı bırak
    }
}

// Modal kapatma fonksiyonu
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('open');
        document.body.style.overflow = ''; // Scroll'u yeniden etkinleştir
    }
}

// Tüm satırları seçme
function initSelectAllCheckboxes() {
    document.querySelectorAll('[id^="select-all-"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const tableId = this.id.replace('select-all-', '');
            const table = document.getElementById(`${tableId}-table`);
            
            if (table) {
                const checkboxes = table.querySelectorAll('tbody input[type="checkbox"]');
                checkboxes.forEach(cb => {
                    cb.checked = this.checked;
                });
            }
        });
    });
}

// Form Doğrulama
function initFormValidation() {
    document.querySelectorAll('.validate-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            let isValid = true;
            
            // Gerekli alanları kontrol et
            const requiredInputs = form.querySelectorAll('[required]');
            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    isValid = false;
                    input.classList.add('error');
                    
                    // Hata mesajı
                    const errorMsg = input.dataset.errorMsg || 'Bu alan zorunludur.';
                    let errorEl = input.nextElementSibling;
                    
                    if (!errorEl || !errorEl.classList.contains('error-message')) {
                        errorEl = document.createElement('div');
                        errorEl.className = 'error-message';
                        input.parentNode.insertBefore(errorEl, input.nextSibling);
                    }
                    
                    errorEl.textContent = errorMsg;
                } else {
                    input.classList.remove('error');
                    const errorEl = input.nextElementSibling;
                    if (errorEl && errorEl.classList.contains('error-message')) {
                        errorEl.remove();
                    }
                }
            });
            
            // Şifre eşleşme kontrolü
            const password = form.querySelector('input[name="password"]');
            const passwordConfirm = form.querySelector('input[name="password_confirm"]');
            
            if (password && passwordConfirm && password.value !== passwordConfirm.value) {
                isValid = false;
                passwordConfirm.classList.add('error');
                
                let errorEl = passwordConfirm.nextElementSibling;
                if (!errorEl || !errorEl.classList.contains('error-message')) {
                    errorEl = document.createElement('div');
                    errorEl.className = 'error-message';
                    passwordConfirm.parentNode.insertBefore(errorEl, passwordConfirm.nextSibling);
                }
                
                errorEl.textContent = 'Şifreler eşleşmiyor.';
            }
            
            if (!isValid) {
                e.preventDefault();
            }
        });
        
        // Hata gösterimini temizle
        form.querySelectorAll('input, select, textarea').forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                const errorEl = this.nextElementSibling;
                if (errorEl && errorEl.classList.contains('error-message')) {
                    errorEl.remove();
                }
            });
        });
    });
}

// Etiket Girişleri
function initTagInputs() {
    document.querySelectorAll('.tag-input').forEach(input => {
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && this.value.trim()) {
                e.preventDefault();
                
                const container = this.closest('.tag-input-container');
                const tagsContainer = container.querySelector('.tags-container');
                const hiddenInput = container.querySelector('input[type="hidden"]');
                
                // Yeni etiket oluştur
                const tag = document.createElement('span');
                tag.className = 'tag';
                tag.textContent = this.value.trim();
                
                // Kaldırma butonu
                const removeBtn = document.createElement('i');
                removeBtn.className = 'fas fa-times remove-tag';
                removeBtn.onclick = function() {
                    tag.remove();
                    updateHiddenTagInput(tagsContainer.id);
                };
                
                tag.appendChild(removeBtn);
                tagsContainer.appendChild(tag);
                
                // Giriş alanını temizle
                this.value = '';
                
                // Gizli input'u güncelle
                updateHiddenTagInput(tagsContainer.id);
            }
        });
    });
}

// Gizli etiket input'unu güncelle
function updateHiddenTagInput(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const tags = Array.from(container.querySelectorAll('.tag')).map(tag => {
        return tag.textContent.trim();
    });
    
    const hiddenInputId = containerId.replace('-tags', '');
    const hiddenInput = document.getElementById(hiddenInputId);
    
    if (hiddenInput) {
        hiddenInput.value = JSON.stringify(tags);
    }
}

// Tooltip
function initTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        const tooltipText = el.getAttribute('title');
        el.setAttribute('data-tooltip', tooltipText);
        el.setAttribute('title', '');
        
        el.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.getAttribute('data-tooltip');
            
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
            tooltip.style.left = (rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
            
            tooltip.classList.add('show');
            
            this.tooltip = tooltip;
        });
        
        el.addEventListener('mouseleave', function() {
            if (this.tooltip) {
                this.tooltip.remove();
                this.tooltip = null;
            }
        });
    });
}

// Tablo sıralama
function initTableSorting() {
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', function() {
            const sortBy = this.dataset.sort;
            const table = this.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            
            // Sıralama yönünü belirle
            const currentDirection = this.getAttribute('data-direction') || 'asc';
            const newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
            
            // Tüm başlıklardan direction attribute'ünü kaldır
            table.querySelectorAll('th').forEach(header => {
                header.removeAttribute('data-direction');
                header.classList.remove('sorted-asc', 'sorted-desc');
            });
            
            // Bu başlığa sıralama direction ve sınıfını ekle
            this.setAttribute('data-direction', newDirection);
            this.classList.add(newDirection === 'asc' ? 'sorted-asc' : 'sorted-desc');
            
            // Veriyi sırala
            rows.sort((a, b) => {
                const aValue = a.querySelector(`td[data-${sortBy}]`).getAttribute(`data-${sortBy}`);
                const bValue = b.querySelector(`td[data-${sortBy}]`).getAttribute(`data-${sortBy}`);
                
                if (newDirection === 'asc') {
                    return aValue.localeCompare(bValue);
                } else {
                    return bValue.localeCompare(aValue);
                }
            });
            
            // DOM'u güncelle
            tbody.innerHTML = '';
            rows.forEach(row => tbody.appendChild(row));
        });
    });
}

// Tablo Filtresi
function filterTable(tableId, filterValue) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const rows = table.querySelectorAll('tbody tr');
    const lowerFilter = filterValue.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(lowerFilter) ? '' : 'none';
    });
}

// Arama Kutusu Filtrelemesi
document.querySelectorAll('[id$="-search"]').forEach(input => {
    input.addEventListener('input', function() {
        const tableId = this.id.replace('-search', '-table');
        filterTable(tableId, this.value);
    });
});

// Sayfalama
function changePage(tableId, page) {
    const table = document.getElementById(tableId);
    if (!table) return;
    
    const itemsPerPage = parseInt(table.dataset.itemsPerPage || 10);
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach((row, index) => {
        const shouldShow = index >= (page - 1) * itemsPerPage && index < page * itemsPerPage;
        row.style.display = shouldShow ? '' : 'none';
    });
    
    // Aktif sayfa butonunu güncelle
    const pagination = document.querySelector(`[data-pagination="${tableId}"]`);
    if (pagination) {
        pagination.querySelectorAll('.page-item').forEach(item => {
            item.classList.remove('active');
        });
        
        pagination.querySelector(`.page-item[data-page="${page}"]`).classList.add('active');
    }
}

// Demo Veriler
const demoCharts = {
    // Çizgi Grafik
    createLineChart: function(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Yeni Kullanıcılar',
                        data: data.new_users,
                        backgroundColor: 'rgba(67, 97, 238, 0.1)',
                        borderColor: 'rgba(67, 97, 238, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 3,
                        fill: true
                    },
                    {
                        label: 'Aktif Kullanıcılar',
                        data: data.active_users,
                        backgroundColor: 'rgba(46, 147, 60, 0.1)',
                        borderColor: 'rgba(46, 147, 60, 1)',
                        borderWidth: 2,
                        tension: 0.4,
                        pointRadius: 3,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end'
                    }
                }
            }
        });
    },
    
    // Bar Grafik
    createBarChart: function(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Tamamlanan İçerikler',
                        data: data.completed,
                        backgroundColor: [
                            'rgba(67, 97, 238, 0.8)',
                            'rgba(46, 147, 60, 0.8)',
                            'rgba(249, 199, 79, 0.8)',
                            'rgba(249, 65, 68, 0.8)',
                            'rgba(76, 201, 240, 0.8)',
                        ],
                        borderWidth: 0,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
};

// Sayfa yüklendiğinde özel grafikleri başlat
document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı grafikleri
    const userStatsEl = document.getElementById('user-stats-chart');
    if (userStatsEl) {
        const userStatsData = JSON.parse(userStatsEl.dataset.stats);
        demoCharts.createLineChart('user-stats-chart', userStatsData);
    }
    
    // Ders grafikleri
    const lessonStatsEl = document.getElementById('lesson-stats-chart');
    if (lessonStatsEl) {
        const lessonStatsData = JSON.parse(lessonStatsEl.dataset.stats);
        demoCharts.createBarChart('lesson-stats-chart', lessonStatsData);
    }
    
    // Tooltips
    initTooltips();
    
    // Tablo sıralama
    initTableSorting();
}); 