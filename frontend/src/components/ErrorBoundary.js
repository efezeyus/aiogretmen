import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    const errorId = Date.now().toString();
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorId: errorId
    });
    
    // Enhanced error logging
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: errorId
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Full Details:', errorDetails);
      console.groupEnd();
    }
    
    // Store error details for debugging
    try {
      localStorage.setItem(`error_${errorId}`, JSON.stringify(errorDetails));
    } catch (e) {
      console.warn('Could not store error details:', e);
    }
    
    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(errorDetails);
    }
  }

  reportError = async (errorDetails) => {
    try {
      // Send to error reporting service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorDetails)
      });
    } catch (reportingError) {
      console.warn('Failed to report error:', reportingError);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <h2>Bir şeyler yanlış gitti!</h2>
            <p>Beklenmeyen bir hata oluştu. Lütfen aşağıdaki seçeneklerden birini deneyin.</p>
            
            <div className="error-actions">
              <button 
                className="btn-retry primary"
                onClick={this.handleRetry}
              >
                🔄 Tekrar Dene
              </button>
              <button 
                className="btn-reload secondary"
                onClick={this.handleReload}
              >
                🔄 Sayfayı Yenile
              </button>
              <button 
                className="btn-home tertiary"
                onClick={this.handleGoHome}
              >
                🏠 Ana Sayfaya Dön
              </button>
            </div>

            {this.state.errorId && (
              <div className="error-id">
                <p>Hata Kodu: {this.state.errorId}</p>
                <small>Destek ekibiyle iletişime geçerken bu kodu belirtin.</small>
              </div>
            )}

            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Geliştirici Detayları (Sadece Development)</summary>
                <div className="error-info">
                  <h4>Hata Mesajı:</h4>
                  <pre className="error-message">{this.state.error ? (typeof this.state.error === 'string' ? this.state.error : this.state.error.toString()) : 'Bilinmeyen hata'}</pre>
                  
                  <h4>Hata Stack:</h4>
                  <pre className="error-stack">{this.state.error && this.state.error.stack ? (typeof this.state.error.stack === 'string' ? this.state.error.stack : JSON.stringify(this.state.error.stack)) : 'Stack trace yok'}</pre>
                  
                  <h4>Component Stack:</h4>
                  <pre className="component-stack">{this.state.errorInfo && this.state.errorInfo.componentStack ? (typeof this.state.errorInfo.componentStack === 'string' ? this.state.errorInfo.componentStack : JSON.stringify(this.state.errorInfo.componentStack)) : 'Component stack yok'}</pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 