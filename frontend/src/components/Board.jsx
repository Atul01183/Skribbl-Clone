import { useEffect, useRef, useState } from 'react';

const Board = ({ socket, roomId, isDrawer }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('black');
  const [paths, setPaths] = useState([]); 
  const currentPath = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = 600; 
    canvas.height = 400;
    ctx.lineCap = 'round'; 
    ctx.lineWidth = 5;

    // FIX YAHAN HAI: data.x1, data.y1 use karna hai (prevX, prevY nahi)
    socket.on('draw_data', (data) => {
      drawOnCanvas(ctx, data.x1, data.y1, data.x2, data.y2, data.clr);
    });

    socket.on('clear_canvas', () => {
      ctx.clearRect(0, 0, 600, 400);
      setPaths([]);
    });

    socket.on('draw_undo', () => {
      setPaths(prev => {
        const newPaths = prev.slice(0, -1);
        redrawAll(ctx, newPaths);
        return newPaths;
      });
    });

    return () => { 
      socket.off('draw_data'); 
      socket.off('clear_canvas'); 
      socket.off('draw_undo'); 
    };
  }, [socket]);

  const drawOnCanvas = (ctx, x1, y1, x2, y2, clr) => {
    ctx.strokeStyle = clr;
    ctx.beginPath(); 
    ctx.moveTo(x1, y1); 
    ctx.lineTo(x2, y2); 
    ctx.stroke();
  };

  const redrawAll = (ctx, allPaths) => {
    ctx.clearRect(0, 0, 600, 400);
    allPaths.forEach(path => {
      path.forEach(step => drawOnCanvas(ctx, step.x1, step.y1, step.x2, step.y2, step.clr));
    });
  };

  const startDraw = (e) => {
    if (!isDrawer) return;
    setIsDrawing(true);
    currentPath.current = [];
    const { offsetX, offsetY } = e.nativeEvent;
    currentPath.current.push({ x: offsetX, y: offsetY });
  };

  const draw = (e) => {
    if (!isDrawing || !isDrawer) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    const lastPos = currentPath.current[currentPath.current.length - 1];

    drawOnCanvas(ctx, lastPos.x, lastPos.y, offsetX, offsetY, color);
    
    const step = { x1: lastPos.x, y1: lastPos.y, x2: offsetX, y2: offsetY, clr: color };
    // Data server ko bheja ja raha hai
    socket.emit('draw_data', { roomId, ...step });
    
    currentPath.current.push({ x: offsetX, y: offsetY, step });
  };

  const stopDraw = () => {
    if (isDrawing) {
      const pathSteps = currentPath.current.filter(p => p.step).map(p => p.step);
      setPaths(prev => [...prev, pathSteps]);
    }
    setIsDrawing(false);
  };

  return (
    <div style={{ background: 'white', padding: '15px', borderRadius: '15px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
      {isDrawer && (
        <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
          <button onClick={() => setColor('black')} style={{ background: 'black', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Black</button>
          <button onClick={() => setColor('red')} style={{ background: 'red', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Red</button>
          <button onClick={() => setColor('blue')} style={{ background: 'blue', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Blue</button>
          <button onClick={() => {
            const ctx = canvasRef.current.getContext('2d');
            const newPaths = paths.slice(0, -1);
            setPaths(newPaths);
            redrawAll(ctx, newPaths);
            socket.emit('draw_undo', roomId);
          }} style={{ background: '#555', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Undo</button>
          <button onClick={() => {
            canvasRef.current.getContext('2d').clearRect(0, 0, 600, 400);
            setPaths([]);
            socket.emit('clear_canvas', roomId);
          }} style={{ background: '#f44336', color: 'white', padding: '5px 10px', borderRadius: '5px', border: 'none', cursor: 'pointer' }}>Clear</button>
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        onMouseDown={startDraw} 
        onMouseMove={draw} 
        onMouseUp={stopDraw} 
        onMouseOut={stopDraw}
        style={{ border: '1px solid #ddd', background: 'white', cursor: isDrawer ? 'crosshair' : 'not-allowed', borderRadius: '10px' }} 
      />
    </div>
  );
};

export default Board;