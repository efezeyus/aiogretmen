import React, { useRef, useState, useEffect } from 'react';
import './AIWhiteboard.css';

/**
 * AI Öğretmen İnteraktif Tahta Bileşeni
 * - Canlı çizim ve yazma
 * - AI'ın adım adım çözüm gösterimi
 * - Real-time WebSocket senkronizasyonu
 * - Matematik formül desteği
 */
const AIWhiteboard = ({ lessonId, onComplete }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [tool, setTool] = useState('pen'); // pen, eraser, text, shape
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(0);
  const [aiIsTeaching, setAiIsTeaching] = useState(false);
  const [currentProblem, setCurrentProblem] = useState(null);
  const [ws, setWs] = useState(null);

  // Canvas initialization
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);

    // Tahta arka planını beyaz yap
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // İlk durumu history'ye ekle
    saveToHistory();
  }, []);

  // WebSocket bağlantısı
  useEffect(() => {
    const websocket = new WebSocket(`ws://localhost:8000/ws/whiteboard/${lessonId}`);
    
    websocket.onopen = () => {
      console.log('Whiteboard WebSocket bağlantısı kuruldu');
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket hatası:', error);
    };

    setWs(websocket);

    return () => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [lessonId]);

  // WebSocket mesajlarını işle
  const handleWebSocketMessage = (data) => {
    if (data.type === 'ai_draw') {
      // AI'ın çizim komutlarını uygula
      drawAIAction(data.action);
    } else if (data.type === 'ai_text') {
      // AI'ın yazdığı metni göster
      drawText(data.text, data.x, data.y, data.style);
    } else if (data.type === 'clear') {
      clearCanvas();
    }
  };

  // Tahtaya kaydet
  const saveToHistory = () => {
    if (!context) return;
    const canvas = canvasRef.current;
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // Çizime başla
  const startDrawing = (e) => {
    if (!context || aiIsTeaching) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    context.beginPath();
    context.moveTo(x, y);

    // WebSocket ile paylaş
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'draw_start',
        x, y
      }));
    }
  };

  // Çizim yap
  const draw = (e) => {
    if (!isDrawing || !context || aiIsTeaching) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
    context.lineWidth = tool === 'eraser' ? lineWidth * 4 : lineWidth;
    context.lineTo(x, y);
    context.stroke();

    // WebSocket ile paylaş
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'draw',
        x, y,
        tool,
        color,
        lineWidth
      }));
    }
  };

  // Çizimi bitir
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveToHistory();

    // WebSocket ile paylaş
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'draw_end'
      }));
    }
  };

  // Tahtayı temizle
  const clearCanvas = () => {
    if (!context) return;
    const canvas = canvasRef.current;
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  // Geri al
  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current;
      const newStep = historyStep - 1;
      context.putImageData(history[newStep], 0, 0);
      setHistoryStep(newStep);
    }
  };

  // İleri al
  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current;
      const newStep = historyStep + 1;
      context.putImageData(history[newStep], 0, 0);
      setHistoryStep(newStep);
    }
  };

  // AI'ın tahta üzerinde yazması
  const drawText = (text, x, y, style = {}) => {
    if (!context) return;
    
    context.font = style.fontSize || '24px Arial';
    context.fillStyle = style.color || '#000000';
    context.textAlign = style.align || 'left';
    context.fillText(text, x, y);
  };

  // AI'ın çizim aksiyonları
  const drawAIAction = async (action) => {
    if (!context) return;

    setAiIsTeaching(true);

    switch (action.type) {
      case 'line':
        await animateLine(action.from, action.to, action.color);
        break;
      case 'circle':
        await animateCircle(action.center, action.radius, action.color);
        break;
      case 'text':
        await animateText(action.text, action.position, action.style);
        break;
      case 'arrow':
        await drawArrow(action.from, action.to, action.color);
        break;
      default:
        break;
    }

    setAiIsTeaching(false);
    saveToHistory();
  };

  // Animasyonlu çizgi çizimi
  const animateLine = (from, to, color) => {
    return new Promise((resolve) => {
      const steps = 30;
      let currentStep = 0;

      const interval = setInterval(() => {
        const progress = currentStep / steps;
        const x = from.x + (to.x - from.x) * progress;
        const y = from.y + (to.y - from.y) * progress;

        if (currentStep === 0) {
          context.beginPath();
          context.moveTo(from.x, from.y);
        }

        context.strokeStyle = color || '#FF0000';
        context.lineWidth = 3;
        context.lineTo(x, y);
        context.stroke();

        currentStep++;

        if (currentStep > steps) {
          clearInterval(interval);
          resolve();
        }
      }, 20);
    });
  };

  // Animasyonlu çember çizimi
  const animateCircle = (center, radius, color) => {
    return new Promise((resolve) => {
      const steps = 60;
      let currentStep = 0;

      const interval = setInterval(() => {
        const angle = (currentStep / steps) * Math.PI * 2;

        context.beginPath();
        context.arc(center.x, center.y, radius, 0, angle);
        context.strokeStyle = color || '#0000FF';
        context.lineWidth = 3;
        context.stroke();

        currentStep++;

        if (currentStep > steps) {
          clearInterval(interval);
          resolve();
        }
      }, 15);
    });
  };

  // Animasyonlu metin yazımı
  const animateText = (text, position, style) => {
    return new Promise((resolve) => {
      let currentChar = 0;

      const interval = setInterval(() => {
        context.font = style?.fontSize || '24px Arial';
        context.fillStyle = style?.color || '#000000';
        context.fillText(text[currentChar], position.x + (currentChar * 15), position.y);

        currentChar++;

        if (currentChar >= text.length) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  };

  // Ok çizimi
  const drawArrow = (from, to, color) => {
    return new Promise(async (resolve) => {
      // Ana çizgi
      await animateLine(from, to, color);

      // Ok başı
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const arrowLength = 20;
      const arrowAngle = Math.PI / 6;

      context.beginPath();
      context.moveTo(to.x, to.y);
      context.lineTo(
        to.x - arrowLength * Math.cos(angle - arrowAngle),
        to.y - arrowLength * Math.sin(angle - arrowAngle)
      );
      context.moveTo(to.x, to.y);
      context.lineTo(
        to.x - arrowLength * Math.cos(angle + arrowAngle),
        to.y - arrowLength * Math.sin(angle + arrowAngle)
      );
      context.strokeStyle = color || '#FF0000';
      context.stroke();

      resolve();
    });
  };

  // AI'dan yardım iste
  const requestAIHelp = async (problemText) => {
    setAiIsTeaching(true);

    try {
      // Backend'e problem gönder
      const response = await fetch('/api/ai/whiteboard-solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          problem: problemText,
          lesson_id: lessonId
        })
      });

      const data = await response.json();
      
      // AI'ın çözüm adımlarını tahta üzerinde göster
      if (data.steps) {
        await demonstrateSolution(data.steps);
      }
    } catch (error) {
      console.error('AI yardım hatası:', error);
    } finally {
      setAiIsTeaching(false);
    }
  };

  // Çözümü adım adım göster
  const demonstrateSolution = async (steps) => {
    clearCanvas();
    
    let yPosition = 80;
    
    for (const step of steps) {
      // Adım numarasını yaz
      await drawText(`Adım ${step.number}:`, 50, yPosition, {
        fontSize: '20px Arial',
        color: '#0066CC'
      });

      yPosition += 40;

      // Açıklamayı yaz
      await animateText(step.explanation, { x: 70, y: yPosition }, {
        fontSize: '18px Arial',
        color: '#000000'
      });

      yPosition += 40;

      // Matematiksel ifadeyi yaz
      if (step.expression) {
        await animateText(step.expression, { x: 100, y: yPosition }, {
          fontSize: '22px Arial',
          color: '#CC0000'
        });
        yPosition += 50;
      }

      // Görsel gösterim varsa
      if (step.visual) {
        await drawVisual(step.visual, yPosition);
        yPosition += step.visual.height || 100;
      }

      yPosition += 30;

      // Bir sonraki adıma geçmeden önce bekle
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Sonuç
    await drawText('✓ Çözüm Tamamlandı!', 50, yPosition + 20, {
      fontSize: '24px Arial',
      color: '#00AA00'
    });
  };

  // Görsel çizim
  const drawVisual = async (visual, yPosition) => {
    switch (visual.type) {
      case 'graph':
        await drawGraph(visual.data, yPosition);
        break;
      case 'diagram':
        await drawDiagram(visual.data, yPosition);
        break;
      case 'number_line':
        await drawNumberLine(visual.data, yPosition);
        break;
      default:
        break;
    }
  };

  // Sayı doğrusu çiz
  const drawNumberLine = async (data, yPosition) => {
    const startX = 100;
    const endX = 700;
    const y = yPosition + 50;

    // Ana çizgi
    await animateLine(
      { x: startX, y: y },
      { x: endX, y: y },
      '#000000'
    );

    // İşaretler
    const range = data.max - data.min;
    const step = (endX - startX) / range;

    for (let i = data.min; i <= data.max; i++) {
      const x = startX + ((i - data.min) * step);
      
      context.beginPath();
      context.moveTo(x, y - 10);
      context.lineTo(x, y + 10);
      context.stroke();

      context.fillStyle = '#000000';
      context.font = '14px Arial';
      context.textAlign = 'center';
      context.fillText(i.toString(), x, y + 30);
    }

    // Vurgulanan sayı varsa
    if (data.highlight !== undefined) {
      const highlightX = startX + ((data.highlight - data.min) * step);
      await animateCircle({ x: highlightX, y: y }, 8, '#FF0000');
    }
  };

  // Basit grafik çiz
  const drawGraph = async (data, yPosition) => {
    // Basit bir koordinat sistemi
    const centerX = 400;
    const centerY = yPosition + 150;
    const scale = 30;

    // X ekseni
    await animateLine(
      { x: centerX - 200, y: centerY },
      { x: centerX + 200, y: centerY },
      '#000000'
    );

    // Y ekseni
    await animateLine(
      { x: centerX, y: centerY - 150 },
      { x: centerX, y: centerY + 150 },
      '#000000'
    );

    // Noktaları çiz
    if (data.points) {
      for (const point of data.points) {
        const x = centerX + (point.x * scale);
        const y = centerY - (point.y * scale);
        
        context.beginPath();
        context.arc(x, y, 5, 0, Math.PI * 2);
        context.fillStyle = '#0000FF';
        context.fill();
      }
    }
  };

  return (
    <div className="ai-whiteboard-container">
      {/* Araç çubuğu */}
      <div className="whiteboard-toolbar">
        <div className="tool-group">
          <button
            className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
            onClick={() => setTool('pen')}
            title="Kalem"
          >
            ✏️
          </button>
          <button
            className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
            onClick={() => setTool('eraser')}
            title="Silgi"
          >
            🧹
          </button>
          <button
            className="tool-btn"
            onClick={clearCanvas}
            title="Tahtayı Temizle"
          >
            🗑️
          </button>
        </div>

        <div className="tool-group">
          <button
            className="tool-btn"
            onClick={undo}
            disabled={historyStep === 0}
            title="Geri Al"
          >
            ↶
          </button>
          <button
            className="tool-btn"
            onClick={redo}
            disabled={historyStep === history.length - 1}
            title="İleri Al"
          >
            ↷
          </button>
        </div>

        <div className="tool-group">
          <label>Renk:</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>

        <div className="tool-group">
          <label>Kalınlık:</label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
          <span>{lineWidth}px</span>
        </div>

        <div className="tool-group">
          <button
            className="ai-help-btn"
            onClick={() => requestAIHelp(currentProblem)}
            disabled={aiIsTeaching}
          >
            {aiIsTeaching ? '🤖 AI Anlatıyor...' : '🤖 AI Öğretmen Yardımı'}
          </button>
        </div>
      </div>

      {/* Canvas tahta */}
      <canvas
        ref={canvasRef}
        className={`whiteboard-canvas ${aiIsTeaching ? 'ai-teaching' : ''}`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />

      {/* AI öğretmen durumu */}
      {aiIsTeaching && (
        <div className="ai-teaching-indicator">
          <div className="ai-avatar">🤖</div>
          <div className="ai-message">AI Öğretmen tahtada anlatıyor...</div>
        </div>
      )}

      {/* Problem girişi */}
      <div className="problem-input">
        <input
          type="text"
          placeholder="Çözmek istediğin problemi yaz (örn: 2x + 5 = 15)"
          value={currentProblem || ''}
          onChange={(e) => setCurrentProblem(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && currentProblem) {
              requestAIHelp(currentProblem);
            }
          }}
        />
        <button
          onClick={() => requestAIHelp(currentProblem)}
          disabled={!currentProblem || aiIsTeaching}
        >
          Çöz
        </button>
      </div>
    </div>
  );
};

export default AIWhiteboard;

