import styles from '@/styles/Home.module.css';
import { useCallback, useEffect, useRef, useState } from 'react';

const colors = [
  '#D0E7F5',
  '#D9E7F4',
  '#D6E3F4',
  '#BCDFF5',
  '#B7D9F4',
  '#C3D4F0',
  '#9DC1F3',
  '#9AA9F4',
  '#8D83EF',
  '#AE69F0',
  '#D46FF1',
  '#DB5AE7',
  '#D911DA',
  '#D601CB',
  '#E713BF',
  '#F24CAE',
  '#FB79AB',
  '#FFB6C1',
  '#FED2CF',
  '#FDDFD5',
  '#FEDCD1',
];

const settings = {
  startTime: new Date().getTime(), // This can be in the future
  duration: 900, // Total time for all dots to realign at the starting point
  maxCycles: Math.max(colors.length, 100), // Must be above colors.length or else...
  soundEnabled: false, // User still must interact with screen first
  pulseEnabled: true, // Pulse will only show if sound is enabled as well
  instrument: 'vibraphone', // "default" | "wave" | "vibraphone"
};

const calculateVelocity = (index) => {
  const numberOfCycles = settings.maxCycles - index,
    distancePerCycle = 2 * Math.PI;

  return (numberOfCycles * distancePerCycle) / settings.duration;
};

const calculateNextImpactTime = (currentImpactTime, velocity) => {
  return currentImpactTime + (Math.PI / velocity) * 1000;
};

const calculateDynamicOpacity = (
  currentTime,
  lastImpactTime,
  baseOpacity,
  maxOpacity,
  duration
) => {
  const timeSinceImpact = currentTime - lastImpactTime,
    percentage = Math.min(timeSinceImpact / duration, 1),
    opacityDelta = maxOpacity - baseOpacity;

  return maxOpacity - opacityDelta * percentage;
};

const determineOpacity = (
  currentTime,
  lastImpactTime,
  baseOpacity,
  maxOpacity,
  duration
) => {
  if (!settings.pulseEnabled) return baseOpacity;

  return calculateDynamicOpacity(
    currentTime,
    lastImpactTime,
    baseOpacity,
    maxOpacity,
    duration
  );
};

export default function Home() {
  const canvasRef = useRef(null);
  const [arcs, setArcs] = useState([]);
  const [ctx, setCtx] = useState(null);
  const [canvasObj, setCanvasObj] = useState(null);

  const drawArc = useCallback(
    (x, y, radius, start, end, action = 'stroke') => {
      ctx.beginPath();
      ctx.arc(x, y, radius, start, end);
      if (action === 'stroke') ctx.stroke();
      else ctx.fill();
    },
    [ctx]
  );

  const calculatePositionOnArc = (center, radius, angle) => ({
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  });

  const drawPointOnArc = useCallback(
    (center, arcRadius, pointRadius, angle) => {
      const position = calculatePositionOnArc(center, arcRadius, angle);

      drawArc(position.x, position.y, pointRadius, 0, 2 * Math.PI, 'fill');
    },
    [drawArc]
  );

  useEffect(() => {
    const canvasObj = canvasRef.current;
    const ctx = canvasObj?.getContext('2d');
    setCtx(ctx);
    setCanvasObj(canvasObj);

    setArcs([
      ...colors.map((color, index) => {
        const velocity = calculateVelocity(index),
          lastImpactTime = 0,
          nextImpactTime = calculateNextImpactTime(
            settings.startTime,
            velocity
          );

        return {
          color,
          velocity,
          lastImpactTime,
          nextImpactTime,
        };
      }),
    ]);

    ctx.lineCap = 'round';
  }, []);

  const draw = useCallback(() => {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasObj.clientWidth, canvasObj.clientHeight);

    const currentTime = new Date().getTime(),
      elapsedTime = (currentTime - settings.startTime) / 1000;

    const length = Math.min(canvasObj?.width, canvasObj?.height) * 0.9,
      offset = (canvasObj?.width - length) / 2;

    const start = {
      x: offset,
      y: canvasObj?.height / 2,
    };

    const end = {
      x: canvasObj?.width - offset,
      y: canvasObj?.height / 2,
    };

    const center = {
      x: canvasObj?.width / 2,
      y: canvasObj?.height / 2,
    };

    const base = {
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
        1000
      );
      ctx.lineWidth = base.length * 0.002;
      ctx.strokeStyle = arc.color;

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
        1000
      );
      ctx.fillStyle = arc.color;

      drawPointOnArc(center, radius, base.circleRadius * 0.75, Math.PI);
      drawPointOnArc(center, radius, base.circleRadius * 0.75, 2 * Math.PI);

      // Draw moving circles
      ctx.globalAlpha = 1;
      ctx.fillStyle = arc.color;

      if (currentTime >= arc.nextImpactTime) {
        // if (settings.soundEnabled) {
        //   playKey(index);
        arc.lastImpactTime = arc.nextImpactTime;
        // }

        arc.nextImpactTime = calculateNextImpactTime(
          arc.nextImpactTime,
          arc.velocity
        );
      }

      const distance = elapsedTime >= 0 ? elapsedTime * arc.velocity : 0,
        angle = (Math.PI + distance) % base.maxAngle;

      drawPointOnArc(center, radius, base.circleRadius, angle);
    });

    requestAnimationFrame(draw);
  }, [arcs, canvasObj, ctx, drawArc, drawPointOnArc]);

  useEffect(() => {
    draw();
  }, [draw]);

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
        <div style={{ fontSize: '5rem', fontWeight: 'bolder' }}>
          POLYRYHTHMIC
        </div>
        <canvas ref={canvasRef} width="800px" height="800px" />
      </main>
    </>
  );
}
