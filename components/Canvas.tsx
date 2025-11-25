
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface CanvasProps {
  imageUrl: string;
}

const Canvas = forwardRef((props: CanvasProps, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useImperativeHandle(ref, () => ({
    getImageDataUrl: (): string => {
      const canvas = canvasRef.current;
      if (!canvas) return '';
      return canvas.toDataURL('image/png');
    },
  }));
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    setContext(ctx);

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = props.imageUrl;
    image.onload = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      
      const { width: parentWidth, height: parentHeight } = parent.getBoundingClientRect();
      const imageAspectRatio = image.width / image.height;
      const parentAspectRatio = parentWidth / parentHeight;
      
      let canvasWidth, canvasHeight;
      if (imageAspectRatio > parentAspectRatio) {
          canvasWidth = parentWidth;
          canvasHeight = parentWidth / imageAspectRatio;
      } else {
          canvasHeight = parentHeight;
          canvasWidth = parentHeight * imageAspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      ctx?.drawImage(image, 0, 0, canvas.width, canvas.height);
    };

  }, [props.imageUrl]);

  const getCoords = (event: React.MouseEvent | React.TouchEvent): { x: number, y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in event.nativeEvent) {
        clientX = event.nativeEvent.touches[0].clientX;
        clientY = event.nativeEvent.touches[0].clientY;
    } else {
        clientX = event.nativeEvent.clientX;
        clientY = event.nativeEvent.clientY;
    }
    
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  }

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoords(event);
    if (!context || !coords) return;
    context.beginPath();
    context.moveTo(coords.x, coords.y);
    setIsDrawing(true);
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !context) return;
    const coords = getCoords(event);
    if (!coords) return;
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    context.lineTo(coords.x, coords.y);
    context.stroke();
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
        <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onMouseMove={draw}
            onTouchStart={startDrawing}
            onTouchEnd={stopDrawing}
            onTouchMove={draw}
            className="cursor-crosshair rounded-md"
        />
    </div>
  );
});

Canvas.displayName = "Canvas";

export default Canvas;
