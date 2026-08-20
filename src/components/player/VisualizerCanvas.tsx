import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../../lib/audioEngine';
import { usePlayerStore } from '../../stores/usePlayerStore';

interface VisualizerCanvasProps {
  className?: string;
  mode?: 'oscilloscope' | 'bars' | 'led_matrix';
  barCount?: number;
  color?: 'green' | 'cyan' | 'amber';
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  className = '',
  mode = 'oscilloscope',
  barCount = 28,
  color = 'green'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { playbackState } = usePlayerStore();
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mainColor = color === 'green' ? '#00ff66' : color === 'cyan' ? '#00f0ff' : '#ffaa00';
    const glowColor = color === 'green' ? 'rgba(0,255,102,0.4)' : color === 'cyan' ? 'rgba(0,240,255,0.4)' : 'rgba(255,170,0,0.4)';

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const freqData = audioEngine.getFrequencyData();
      const isPlaying = playbackState === 'playing';

      if (mode === 'oscilloscope') {
        // High-precision green phosphor oscilloscope waveform line
        ctx.beginPath();
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 1.8;
        ctx.shadowBlur = isPlaying ? 8 : 2;
        ctx.shadowColor = glowColor;

        const sliceWidth = width / (freqData.length - 1);
        let x = 0;

        for (let i = 0; i < freqData.length; i++) {
          const raw = freqData[i] || 0;
          let v = raw / 128.0; // center around 1.0

          if (!isPlaying) {
            // Subtle idle sine wave
            v = Math.sin(Date.now() * 0.003 + i * 0.15) * 0.15 + 1.0;
          }

          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
      } else {
        // Hardware LED Bar Segments
        const barWidth = (width / barCount) * 0.65;
        const gap = (width / barCount) * 0.35;

        for (let i = 0; i < barCount; i++) {
          const freqIndex = Math.floor((i / barCount) * freqData.length);
          const rawValue = isPlaying ? freqData[freqIndex] || 0 : 0;
          
          const barHeight = isPlaying 
            ? Math.max(3, (rawValue / 255) * height * 0.88)
            : Math.max(3, Math.sin(Date.now() * 0.004 + i * 0.35) * 5 + 5);

          const x = i * (barWidth + gap);
          const y = height - barHeight;

          ctx.fillStyle = mainColor;
          ctx.shadowBlur = 4;
          ctx.shadowColor = glowColor;
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [playbackState, mode, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      width={240}
      height={36}
      className={`w-full max-w-[240px] h-9 ${className}`}
    />
  );
};
