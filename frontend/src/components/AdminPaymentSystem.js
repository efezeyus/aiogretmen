import React, { useState, useEffect } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import './AdminPaymentSystem.css';

const AdminPaymentSystem = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [dateRange, setDateRange] = useState('month');

  const [paymentStats] = useState({
    totalRevenue: 1234567,
    monthlyRevenue: 125430,
    activeSubscriptions: 3456,
    pendingPayments: 23,
    refundedAmount: 12340,
    averageTransaction: 245
  });

  const [transactions] = useState([
    {
      id: 'TRX-001',
      user: 'Ahmet Yılmaz',
      userEmail: 'ahmet@email.com',
      amount: 299,
      currency: 'TRY',
      type: 'subscription',
      plan: 'Premium Aylık',
      method: 'credit_card',
      status: 'completed',
      date: '2024-12-21T10:30:00',
      cardLast4: '4242',
      invoiceUrl: '#'
    },
    {
      id: 'TRX-002',
      user: 'Ayşe Kaya',
      userEmail: 'ayse@email.com',
      amount: 2499,
      currency: 'TRY',
      type: 'subscription',
      plan: 'Premium Yıllık',
      method: 'bank_transfer',
      status: 'pending',
      date: '2024-12-21T09:15:00',
      bankName: 'Garanti BBVA'
    },
    {
      id: 'TRX-003',
      user: 'Mehmet Demir',
      userEmail: 'mehmet@email.com',
      amount: 99,
      currency: 'TRY',
      type: 'one_time',
      plan: 'Tek Ders',
      method: 'paypal',
      status: 'refunded',
      date: '2024-12-20T14:45:00',
      refundReason: 'Müşteri talebi',
      refundDate: '2024-12-21T08:00:00'
    }
  ]);

  const [subscriptionPlans] = useState([
    {
      id: 1,
      name: 'Ücretsiz',
      price: 0,
      currency: 'TRY',
      interval: 'month',
      features: ['5 Ders/Ay', 'Temel AI Desteği', 'Sınırlı İçerik'],
      activeUsers: 12450,
      color: '#9e9e9e'
    },
    {
      id: 2,
      name: 'Temel',
      price: 99,
      currency: 'TRY',
      interval: 'month',
      features: ['50 Ders/Ay', 'Gelişmiş AI', 'Sertifika', 'Email Destek'],
      activeUsers: 2340,
      color: '#2196f3'
    },
    {
      id: 3,
      name: 'Premium',
      price: 299,
      currency: 'TRY',
      interval: 'month',
      features: ['Sınırsız Ders', 'Tüm AI Özellikleri', 'Öncelikli Destek', 'API Erişimi'],
      activeUsers: 890,
      color: '#9c27b0'
    },
    {
      id: 4,
      name: 'Kurumsal',
      price: 'Özel',
      currency: 'TRY',
      interval: 'custom',
      features: ['Özel Çözümler', 'SLA Garantisi', 'Özel Eğitim', 'White Label'],
      activeUsers: 45,
      color: '#ff9800'
    }
  ]);

  const [paymentMethods] = useState([
    { id: 1, name: 'Kredi Kartı', icon: '💳', usage: 65, enabled: true },
    { id: 2, name: 'Banka Transferi', icon: '🏦', usage: 20, enabled: true },
    { id: 3, name: 'PayPal', icon: '💰', usage: 10, enabled: true },
    { id: 4, name: 'Apple Pay', icon: '🍎', usage: 3, enabled: false },
    { id: 5, name: 'Google Pay', icon: '🔵', usage: 2, enabled: false }
  ]);

  // Revenue chart data
  const [revenueData] = useState({
    labels: ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran'],
    datasets: [
      {
        label: 'Gelir (₺)',
        data: [85000, 92000, 88000, 95000, 112000, 125430],
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderColor: 'rgb(102, 126, 234)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }
    ]
  });

  // Subscription distribution data
  const [subscriptionData] = useState({
    labels: ['Ücretsiz', 'Temel', 'Premium', 'Kurumsal'],
    datasets: [
      {
        data: [12450, 2340, 890, 45],
        backgroundColor: ['#9e9e9e', '#2196f3', '#9c27b0', '#ff9800'],
        borderWidth: 0
      }
    ]
  });

  // Payment methods chart
  const [paymentMethodsData] = useState({
    labels: paymentMethods.map(m => m.name),
    datasets: [
      {
        label: 'Kullanım %',
        data: paymentMethods.map(m => m.usage),
        backgroundColor: 'rgba(75, 192, 192, 0.8)'
      }
    ]
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Update logic here
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'pending': return '#ff9800';
      case 'failed': return '#f44336';
      case 'refunded': return '#9e9e9e';
      default: return '#666';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'pending': return 'Beklemede';
      case 'failed': return 'Başarısız';
      case 'refunded': return 'İade Edildi';
      default: return '';
    }
  };

  const formatCurrency = (amount, currency = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefund = (transaction) => {
    setSelectedTransaction(transaction);
    setShowRefundModal(true);
  };

  const processRefund = (reason) => {
    alert(`${selectedTransaction.id} işlemi için iade başlatılıyor. Sebep: ${reason}`);
    setShowRefundModal(false);
  };

  return (
    <div className="admin-payment-system">
      {/* Header */}
      <div className="payment-header">
        <div className="header-left">
          <h2>💳 Ödeme Sistemi Yönetimi</h2>
          <p>Gelir takibi, abonelikler ve ödeme işlemleri</p>
        </div>
        <div className="header-actions">
          <select 
            className="date-range-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            <option value="today">Bugün</option>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="year">Bu Yıl</option>
          </select>
          <button className="btn-export">
            📊 Rapor İndir
          </button>
          <button className="btn-settings">
            ⚙️ Ödeme Ayarları
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="payment-stats">
        <div className="stat-card primary">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(paymentStats.totalRevenue)}</div>
            <div className="stat-label">Toplam Gelir</div>
            <div className="stat-trend positive">↑ %15</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(paymentStats.monthlyRevenue)}</div>
            <div className="stat-label">Aylık Gelir</div>
            <div className="stat-trend positive">↑ %8</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{paymentStats.activeSubscriptions.toLocaleString()}</div>
            <div className="stat-label">Aktif Abonelik</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{paymentStats.pendingPayments}</div>
            <div className="stat-label">Bekleyen Ödeme</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">↩️</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(paymentStats.refundedAmount)}</div>
            <div className="stat-label">İade Edilen</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(paymentStats.averageTransaction)}</div>
            <div className="stat-label">Ort. İşlem</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="payment-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Genel Bakış
        </button>
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          💸 İşlemler
        </button>
        <button
          className={`tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          🔄 Abonelikler
        </button>
        <button
          className={`tab ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          📄 Faturalar
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Ayarlar
        </button>
      </div>

      {/* Content */}
      <div className="payment-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <div className="charts-grid">
              <div className="chart-card large">
                <h3>📈 Gelir Trendi</h3>
                <div style={{ height: '300px' }}>
                  <Line 
                    data={revenueData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return '₺' + value.toLocaleString();
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-card">
                <h3>👥 Abonelik Dağılımı</h3>
                <div style={{ height: '250px' }}>
                  <Doughnut 
                    data={subscriptionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'bottom' }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-card">
                <h3>💳 Ödeme Yöntemleri</h3>
                <div style={{ height: '250px' }}>
                  <Bar 
                    data={paymentMethodsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          ticks: {
                            callback: function(value) {
                              return value + '%';
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="quick-stats">
              <div className="quick-stat-card">
                <h4>🔥 En Popüler Plan</h4>
                <div className="plan-info">
                  <span className="plan-name">Premium Aylık</span>
                  <span className="plan-users">890 kullanıcı</span>
                </div>
              </div>
              <div className="quick-stat-card">
                <h4>💔 Churn Rate</h4>
                <div className="churn-info">
                  <span className="churn-rate">%3.2</span>
                  <span className="churn-trend positive">↓ %0.5</span>
                </div>
              </div>
              <div className="quick-stat-card">
                <h4>🎯 Dönüşüm Oranı</h4>
                <div className="conversion-info">
                  <span className="conversion-rate">%12.8</span>
                  <span className="conversion-trend positive">↑ %2.1</span>
                </div>
              </div>
              <div className="quick-stat-card">
                <h4>📅 Ortalama Yaşam Süresi</h4>
                <div className="ltv-info">
                  <span className="ltv-value">8.5 ay</span>
                  <span className="ltv-amount">₺2,541</span>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h3>🕐 Son Aktiviteler</h3>
              <div className="activity-list">
                <div className="activity-item success">
                  <span className="activity-icon">✅</span>
                  <span className="activity-text">Yeni Premium abonelik - Zeynep Çelik</span>
                  <span className="activity-time">2 dakika önce</span>
                </div>
                <div className="activity-item warning">
                  <span className="activity-icon">⚠️</span>
                  <span className="activity-text">Ödeme başarısız - Mehmet Yılmaz</span>
                  <span className="activity-time">15 dakika önce</span>
                </div>
                <div className="activity-item info">
                  <span className="activity-icon">🔄</span>
                  <span className="activity-text">Abonelik yenilendi - 23 kullanıcı</span>
                  <span className="activity-time">1 saat önce</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="transactions-section">
            <div className="transactions-filters">
              <input
                type="text"
                placeholder="🔍 İşlem ara..."
                className="search-input"
              />
              <select className="filter-select">
                <option value="all">Tüm Durumlar</option>
                <option value="completed">Tamamlandı</option>
                <option value="pending">Beklemede</option>
                <option value="failed">Başarısız</option>
                <option value="refunded">İade Edildi</option>
              </select>
              <select className="filter-select">
                <option value="all">Tüm Tipler</option>
                <option value="subscription">Abonelik</option>
                <option value="one_time">Tek Seferlik</option>
              </select>
              <input type="date" className="date-filter" />
            </div>

            <div className="transactions-table">
              <table>
                <thead>
                  <tr>
                    <th>İşlem ID</th>
                    <th>Kullanıcı</th>
                    <th>Tutar</th>
                    <th>Plan</th>
                    <th>Yöntem</th>
                    <th>Durum</th>
                    <th>Tarih</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(transaction => (
                    <tr key={transaction.id}>
                      <td className="transaction-id">{transaction.id}</td>
                      <td>
                        <div className="user-info">
                          <span className="user-name">{transaction.user}</span>
                          <span className="user-email">{transaction.userEmail}</span>
                        </div>
                      </td>
                      <td className="amount">{formatCurrency(transaction.amount)}</td>
                      <td>{transaction.plan}</td>
                      <td>
                        <span className="payment-method">
                          {transaction.method === 'credit_card' && `💳 ****${transaction.cardLast4}`}
                          {transaction.method === 'bank_transfer' && `🏦 ${transaction.bankName}`}
                          {transaction.method === 'paypal' && '💰 PayPal'}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(transaction.status) }}
                        >
                          {getStatusLabel(transaction.status)}
                        </span>
                      </td>
                      <td>{formatDate(transaction.date)}</td>
                      <td>
                        <div className="table-actions">
                          <button className="btn-table-action" title="Detaylar">
                            👁️
                          </button>
                          {transaction.status === 'completed' && (
                            <>
                              <button className="btn-table-action" title="Fatura">
                                📄
                              </button>
                              <button 
                                className="btn-table-action" 
                                title="İade"
                                onClick={() => handleRefund(transaction)}
                              >
                                ↩️
                              </button>
                            </>
                          )}
                          {transaction.status === 'pending' && (
                            <button className="btn-table-action" title="İptal">
                              ❌
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="transactions-summary">
              <div className="summary-item">
                <span className="label">Toplam İşlem:</span>
                <span className="value">{transactions.length}</span>
              </div>
              <div className="summary-item">
                <span className="label">Başarılı:</span>
                <span className="value success">
                  {transactions.filter(t => t.status === 'completed').length}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Bekleyen:</span>
                <span className="value warning">
                  {transactions.filter(t => t.status === 'pending').length}
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Toplam Tutar:</span>
                <span className="value">
                  {formatCurrency(transactions.reduce((sum, t) => sum + t.amount, 0))}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="subscriptions-section">
            <h3>🔄 Abonelik Planları</h3>
            <div className="subscription-plans">
              {subscriptionPlans.map(plan => (
                <div key={plan.id} className="plan-card">
                  <div 
                    className="plan-header"
                    style={{ borderColor: plan.color }}
                  >
                    <h4>{plan.name}</h4>
                    <div className="plan-price">
                      {typeof plan.price === 'number' ? (
                        <>
                          <span className="currency">₺</span>
                          <span className="amount">{plan.price}</span>
                          <span className="interval">/{plan.interval === 'month' ? 'ay' : 'yıl'}</span>
                        </>
                      ) : (
                        <span className="custom-price">{plan.price}</span>
                      )}
                    </div>
                  </div>
                  <div className="plan-features">
                    <ul>
                      {plan.features.map((feature, index) => (
                        <li key={index}>
                          <span className="feature-icon">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="plan-stats">
                    <div className="stat">
                      <span className="stat-label">Aktif Kullanıcı</span>
                      <span className="stat-value">{plan.activeUsers.toLocaleString()}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Aylık Gelir</span>
                      <span className="stat-value">
                        {typeof plan.price === 'number' 
                          ? formatCurrency(plan.price * plan.activeUsers)
                          : 'Değişken'
                        }
                      </span>
                    </div>
                  </div>
                  <div className="plan-actions">
                    <button className="btn-edit">✏️ Düzenle</button>
                    <button className="btn-analytics">📊 Analiz</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="subscription-metrics">
              <h4>📊 Abonelik Metrikleri</h4>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h5>MRR (Aylık Tekrarlanan Gelir)</h5>
                  <p className="metric-value">{formatCurrency(456789)}</p>
                  <span className="metric-trend positive">↑ %12</span>
                </div>
                <div className="metric-card">
                  <h5>ARR (Yıllık Tekrarlanan Gelir)</h5>
                  <p className="metric-value">{formatCurrency(5481468)}</p>
                  <span className="metric-trend positive">↑ %15</span>
                </div>
                <div className="metric-card">
                  <h5>ARPU (Kullanıcı Başı Gelir)</h5>
                  <p className="metric-value">{formatCurrency(132)}</p>
                  <span className="metric-trend positive">↑ %5</span>
                </div>
                <div className="metric-card">
                  <h5>Müşteri Kaybı</h5>
                  <p className="metric-value">%3.2</p>
                  <span className="metric-trend positive">↓ %0.8</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="invoices-section">
            <div className="invoices-header">
              <h3>📄 Faturalar</h3>
              <button className="btn-create-invoice">
                ➕ Manuel Fatura Oluştur
              </button>
            </div>

            <div className="invoices-filters">
              <input
                type="text"
                placeholder="🔍 Fatura ara..."
                className="search-input"
              />
              <select className="filter-select">
                <option value="all">Tüm Durumlar</option>
                <option value="paid">Ödendi</option>
                <option value="unpaid">Ödenmedi</option>
                <option value="overdue">Gecikmiş</option>
              </select>
              <input type="date" className="date-filter" />
            </div>

            <div className="invoices-table">
              <table>
                <thead>
                  <tr>
                    <th>Fatura No</th>
                    <th>Müşteri</th>
                    <th>Tutar</th>
                    <th>Durum</th>
                    <th>Düzenlenme</th>
                    <th>Vade</th>
                    <th>İşlemler</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>INV-2024-001</td>
                    <td>Ahmet Yılmaz</td>
                    <td>{formatCurrency(299)}</td>
                    <td><span className="status-badge paid">Ödendi</span></td>
                    <td>15.12.2024</td>
                    <td>25.12.2024</td>
                    <td>
                      <button className="btn-table-action">👁️</button>
                      <button className="btn-table-action">📥</button>
                      <button className="btn-table-action">📧</button>
                    </td>
                  </tr>
                  <tr>
                    <td>INV-2024-002</td>
                    <td>ABC Şirketi</td>
                    <td>{formatCurrency(12500)}</td>
                    <td><span className="status-badge unpaid">Ödenmedi</span></td>
                    <td>18.12.2024</td>
                    <td>28.12.2024</td>
                    <td>
                      <button className="btn-table-action">👁️</button>
                      <button className="btn-table-action">📥</button>
                      <button className="btn-table-action">📧</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-section">
            <h3>⚙️ Ödeme Ayarları</h3>

            <div className="settings-grid">
              <div className="settings-card">
                <h4>💳 Ödeme Yöntemleri</h4>
                <div className="payment-methods-list">
                  {paymentMethods.map(method => (
                    <div key={method.id} className="method-item">
                      <div className="method-info">
                        <span className="method-icon">{method.icon}</span>
                        <span className="method-name">{method.name}</span>
                        <span className="method-usage">%{method.usage} kullanım</span>
                      </div>
                      <label className="switch">
                        <input 
                          type="checkbox" 
                          defaultChecked={method.enabled}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
                <button className="btn-add-method">
                  ➕ Yeni Yöntem Ekle
                </button>
              </div>

              <div className="settings-card">
                <h4>🔐 API Anahtarları</h4>
                <div className="api-keys">
                  <div className="api-key-item">
                    <label>Stripe Publishable Key</label>
                    <input 
                      type="text" 
                      value="pk_test_************"
                      readOnly
                    />
                  </div>
                  <div className="api-key-item">
                    <label>Stripe Secret Key</label>
                    <input 
                      type="password" 
                      value="sk_test_************"
                      readOnly
                    />
                  </div>
                  <div className="api-key-item">
                    <label>PayPal Client ID</label>
                    <input 
                      type="text" 
                      value="AYSq3RDGsmBLJE-otTkBtM"
                      readOnly
                    />
                  </div>
                </div>
                <button className="btn-update-keys">
                  🔄 Anahtarları Güncelle
                </button>
              </div>

              <div className="settings-card">
                <h4>📧 Fatura Ayarları</h4>
                <div className="invoice-settings">
                  <div className="setting-item">
                    <label>Şirket Adı</label>
                    <input 
                      type="text" 
                      defaultValue="Yapay Zeka Öğretmen Ltd. Şti."
                    />
                  </div>
                  <div className="setting-item">
                    <label>Vergi No</label>
                    <input 
                      type="text" 
                      defaultValue="1234567890"
                    />
                  </div>
                  <div className="setting-item">
                    <label>Adres</label>
                    <textarea 
                      rows="3"
                      defaultValue="Teknokent Mah. İnovasyon Cad. No:1 
Ankara, Türkiye"
                    />
                  </div>
                  <div className="setting-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Otomatik fatura gönder
                    </label>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <h4>⚠️ Ödeme Kuralları</h4>
                <div className="payment-rules">
                  <div className="rule-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      3D Secure zorunlu
                    </label>
                  </div>
                  <div className="rule-item">
                    <label>
                      <input type="checkbox" defaultChecked />
                      Şüpheli işlemleri engelle
                    </label>
                  </div>
                  <div className="rule-item">
                    <label>
                      <input type="checkbox" />
                      Uluslararası kartları kabul et
                    </label>
                  </div>
                  <div className="rule-item">
                    <label>Maksimum işlem limiti</label>
                    <input 
                      type="number" 
                      defaultValue="10000"
                      placeholder="TRY"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button className="btn-save">💾 Ayarları Kaydet</button>
              <button className="btn-test">🧪 Test Ödemesi Yap</button>
            </div>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && selectedTransaction && (
        <div className="modal-overlay" onClick={() => setShowRefundModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>↩️ İade İşlemi</h3>
              <button 
                className="modal-close"
                onClick={() => setShowRefundModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="refund-info">
                <div className="info-row">
                  <span className="label">İşlem ID:</span>
                  <span className="value">{selectedTransaction.id}</span>
                </div>
                <div className="info-row">
                  <span className="label">Müşteri:</span>
                  <span className="value">{selectedTransaction.user}</span>
                </div>
                <div className="info-row">
                  <span className="label">Tutar:</span>
                  <span className="value">{formatCurrency(selectedTransaction.amount)}</span>
                </div>
              </div>

              <div className="refund-form">
                <div className="form-group">
                  <label>İade Tutarı</label>
                  <input 
                    type="number" 
                    defaultValue={selectedTransaction.amount}
                    max={selectedTransaction.amount}
                  />
                </div>
                <div className="form-group">
                  <label>İade Sebebi</label>
                  <select>
                    <option value="">Seçiniz</option>
                    <option value="customer_request">Müşteri Talebi</option>
                    <option value="duplicate">Mükerrer Ödeme</option>
                    <option value="fraudulent">Şüpheli İşlem</option>
                    <option value="service_issue">Hizmet Sorunu</option>
                    <option value="other">Diğer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Açıklama</label>
                  <textarea 
                    rows="3"
                    placeholder="İade ile ilgili detayları yazın..."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn-confirm"
                  onClick={() => processRefund('Müşteri talebi')}
                >
                  ✅ İadeyi Onayla
                </button>
                <button 
                  className="btn-cancel"
                  onClick={() => setShowRefundModal(false)}
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPaymentSystem;
