import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Inter } from 'next/font/google';
import {
  calculateNextImpactTime,
  calculatePositionOnArc,
  calculateVelocity,
  colors,
  determineOpacity,
  settings,
} from '../utils';

const inter = Inter({ subsets: ['latin'] });

export default function Home() {
  const canvasRef = useRef<Nullable<HTMLCanvasElement>>(null);
  const [canvasObj, setCanvasObj] = useState<Nullable<HTMLCanvasElement>>(null);
  const [ctx, setCtx] = useState<Nullable<CanvasRenderingContext2D>>(null);
  const [arcs, setArcs] = useState<Arc[]>([]);
  const [keys, setKeys] = useState<Nullable<HTMLAudioElement[]>>(null);
  const [sound, setSound] = useState(false);
  const [startTime, setStartTime] = useState(new Date().getTime());

  const handleToggleSound = () => {
    setSound((prev) => !prev);
  };

  const drawArc = useCallback(
    (
      x: number,
      y: number,
      radius: number,
      start: number,
      end: number,
      action = 'stroke'
    ) => {
      if (ctx) {
        ctx.beginPath();
        ctx.arc(x, y, radius, start, end);
        if (action === 'stroke') ctx.stroke();
        else ctx.fill();
      }
    },
    [ctx]
  );

  const drawPointOnArc = useCallback(
    (center: any, arcRadius: any, pointRadius: any, angle: any) => {
      const position = calculatePositionOnArc(center, arcRadius, angle);

      drawArc(position.x, position.y, pointRadius, 0, 2 * Math.PI, 'fill');
    },
    [drawArc]
  );

  useEffect(() => {
    setStartTime(new Date().getTime());
  }, []);

  useEffect(() => {
    const canvasObj = canvasRef.current;
    if (canvasObj) {
      setCtx(canvasObj.getContext('2d'));
      setCanvasObj(canvasObj);
    }

    setArcs([
      ...colors.map((color, index) => {
        const velocity = calculateVelocity(index),
          lastImpactTime = 0,
          nextImpactTime = calculateNextImpactTime(startTime, velocity);

        return {
          color,
          velocity,
          lastImpactTime,
          nextImpactTime,
        };
      }),
    ]);

    if (ctx) {
      ctx.lineCap = 'round';
    }

    setKeys([
      ...colors.map((color, index) => {
        if (typeof Audio != undefined) {
          const audio = new Audio(`/audio/vibra_${index + 1}.wav`);
          audio.volume = 0.35;
          return audio;
        }
        return undefined;
      }),
    ]);
  }, [ctx, startTime]);

  const playKey = useCallback((index: number) => keys[index].play(), [keys]);

  useEffect(() => {
    const draw = () => {
      if (!ctx) return;

      const canvasWidth = canvasObj?.clientWidth as number;
      const canvasHeight = canvasObj?.clientHeight as number;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const currentTime = new Date().getTime(),
        elapsedTime = (currentTime - startTime) / 1000;

      const length = Math.min(canvasWidth, canvasHeight) * 0.9,
        offset = (canvasWidth - length) / 2;

      const start = {
        x: offset,
        y: canvasHeight / 2,
      };

      const end = {
        x: canvasWidth - offset,
        y: canvasHeight / 2,
      };

      const center = {
        x: canvasWidth / 2,
        y: canvasHeight / 2,
      };

      const base: Record<string, number> = {
        length: end.x - start.x,
        minAngle: 0,
        startAngle: 0,
        maxAngle: 2 * Math.PI,
      };

      base.initialRadius = base.length * 0.05;
      base.circleRadius = base.length * 0.006;
      base.clearance = base.length * 0.03;
      base.spacing =
        (base.length - base.initialRadius - base.clearance) / 2 / colors.length;

      arcs.forEach((arc, index) => {
        const radius = base.initialRadius + base.spacing * index;

        ctx.globalAlpha = determineOpacity(
          currentTime,
          arc.lastImpactTime,
          0.15,
          0.65,
          1000,
          sound
        );
        ctx.lineWidth = base.length * 0.002;
        ctx.strokeStyle = arc.color as string;

        const offset = (base.circleRadius * (5 / 3)) / radius;

        drawArc(
          center.x,
          center.y,
          radius,
          Math.PI + offset,
          2 * Math.PI - offset
        );

        drawArc(center.x, center.y, radius, offset, Math.PI - offset);

        ctx.globalAlpha = determineOpacity(
          currentTime,
          arc.lastImpactTime,
          0.15,
          0.85,
          1000,
          sound
        );
        ctx.fillStyle = arc.color as string;

        drawPointOnArc(center, radius, base.circleRadius * 0.75, Math.PI);
        drawPointOnArc(center, radius, base.circleRadius * 0.75, 2 * Math.PI);

        // Draw moving circles
        ctx.globalAlpha = 1;
        ctx.fillStyle = arc.color as string;

        if (currentTime >= arc.nextImpactTime) {
          if (sound) {
            playKey(index);
            arc.lastImpactTime = arc.nextImpactTime;
          }

          arc.nextImpactTime = calculateNextImpactTime(
            arc.nextImpactTime,
            arc.velocity
          );
        }

        const distance = elapsedTime >= 0 ? elapsedTime * arc.velocity : 0,
          angle = (Math.PI + distance) % base.maxAngle;

        drawPointOnArc(center, radius, base.circleRadius, angle);
      });
    };

    const id = setInterval(draw, 1000 / 60);

    return () => clearInterval(id);
  }, [
    arcs,
    canvasObj,
    ctx,
    drawArc,
    drawPointOnArc,
    playKey,
    sound,
    startTime,
  ]);

  return (
    <>
      <main
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100vw',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div id="background-image" />
        <div id="background-filter" />
        <div
          className={inter.className}
          style={{ fontSize: '5rem', fontWeight: 'bolder' }}
        >
          <p>POLYRHYTHMS</p>
        </div>
        <button
          onClick={handleToggleSound}
          style={{
            zIndex: 999,
            padding: '0.4rem',
            borderRadius: '10px',
            borderWidth: '1px',
            borderColor: 'black',
          }}
        >
          Toggle sound: {String(sound)}
        </button>
        <canvas
          ref={canvasRef}
          width="700px"
          height="700px"
          className="Button mauve"
        />
      </main>
    </>
  );
}
