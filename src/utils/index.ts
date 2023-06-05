export const colors: String[] = [
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

export const settings = {
  startTime: new Date().getTime(), // This can be in the future
  duration: 900, // Total time for all dots to realign at the starting point
  maxCycles: Math.max(colors.length, 100), // Must be above colors.length or else...
  instrument: 'vibraphone',
};

export const calculateVelocity = (index) => {
  const numberOfCycles = settings.maxCycles - index,
    distancePerCycle = 2 * Math.PI;

  return (numberOfCycles * distancePerCycle) / settings.duration;
};

export const calculateNextImpactTime = (currentImpactTime, velocity) => {
  return currentImpactTime + (Math.PI / velocity) * 1000;
};

export const calculateDynamicOpacity = (
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

export const determineOpacity = (
  currentTime,
  lastImpactTime,
  baseOpacity,
  maxOpacity,
  duration,
  pulseEnabled
) => {
  if (!pulseEnabled) return baseOpacity;

  return calculateDynamicOpacity(
    currentTime,
    lastImpactTime,
    baseOpacity,
    maxOpacity,
    duration
  );
};

export const calculatePositionOnArc = (center, radius, angle) => ({
  x: center.x + radius * Math.cos(angle),
  y: center.y + radius * Math.sin(angle),
});
