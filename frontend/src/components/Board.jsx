// src/components/Board.jsx
import { useEffect, useRef, useState } from 'react';

const Board = ({ socket, roomId, isDrawer }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('black');
  const [brushSize, setBrushSize] = useState(5);
  const prevPos = useRef({ x: 0, y: 0 });

  // 1. Skribbl Colors (White is for Eraser)
  const colors = ['black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'brown', 'pink', 'white'];

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // 2. Dusre players ki drawing aur color receive karna
    const handleDrawData = (data) => {
      const { prevX, prevY, currX, currY, drawColor, size } = data;
      context.strokeStyle = drawColor;
      context.lineWidth = size;
      
      context.beginPath();
      context.moveTo(prevX, prevY);
      context.lineTo(currX, currY);
      context.stroke();
    };

    // 3. Clear canvas event handle karna
    const handleClearCanvas = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };

    socket.on('draw_data', handleDrawData);
    socket.on('clear_canvas', handleClearCanvas);

    return () => {
      socket.off('draw_data', handleDrawData);
      socket.off('clear_canvas', handleClearCanvas);
    };
  }, [socket]);

  const startDrawing = ({ nativeEvent }) => {
    if (!isDrawer) return; // Agar drawer nahi ho toh draw nahi kar sakte
    
    const { offsetX, offsetY } = nativeEvent;
    setIsDrawing(true);
    prevPos.current = { x: offsetX, y: offsetY };
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing || !isDrawer) return;
    
    const { offsetX, offsetY } = nativeEvent;
    const context = canvasRef.current.getContext('2d');
    
    // Apni drawing apply karna
    context.strokeStyle = color;
    context.lineWidth = brushSize;
    context.beginPath();
    context.moveTo(prevPos.current.x, prevPos.current.y);
    context.lineTo(offsetX, offsetY);
    context.stroke();

    // Server ko size aur color ke sath data bhejna
    socket.emit('draw_data', {
      roomId: roomId,
      prevX: prevPos.current.x,
      prevY: prevPos.current.y,
      currX: offsetX,
      currY: offsetY,
      drawColor: color, // Konsa color hai
      size: brushSize // Pen hai ya Eraser
    });

    prevPos.current = { x: offsetX, y: offsetY };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!isDrawer) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    socket.emit('clear_canvas', roomId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
      
      {/* TOOLBAR (Sirf Drawer ko active dikhega) */}
      <div style={{ 
        display: 'flex', gap: '15px', alignItems: 'center', 
        opacity: isDrawer ? 1 : 0.4, 
        pointerEvents: isDrawer ? 'auto' : 'none',
        backgroundColor: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '15px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {colors.map(c => (
            <button 
              key={c} 
              onClick={() => { 
                setColor(c); 
                setBrushSize(c === 'white' ? 20 : 5); // Eraser(white) ka size bada kar diya
              }} 
              style={{ 
                width: '35px', height: '35px', backgroundColor: c, 
                border: color === c ? '3px solid #00a8ff' : '2px solid white', 
                borderRadius: '50%', cursor: 'pointer',
                boxShadow: c === 'white' ? 'inset 0 0 5px rgba(0,0,0,0.3)' : 'none'
              }}
              title={c === 'white' ? 'Eraser' : c}
            >
              {c === 'white' && '🧼'} {/* Eraser icon */}
            </button>
          ))}
        </div>

        <button onClick={clearCanvas} style={{ padding: '8px 15px', background: '#ff4757', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          🗑️ Clear All
        </button>
      </div>

      {/* CANVAS */}
      <canvas
        ref={canvasRef}
        width={700}
        height={450}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{
          border: '4px solid #34495e',
          backgroundColor: 'white',
          cursor: isDrawer ? 'crosshair' : 'not-allowed',
          borderRadius: '10px',
          maxWidth: '100%'
        }}
      />
    </div>
  );
};

export default Board;