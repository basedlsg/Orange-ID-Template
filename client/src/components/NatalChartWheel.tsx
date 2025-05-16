import React, { useEffect, useRef, useState } from 'react';
import { NatalChartData, PlanetDetail, LongitudeDetail, AstrologicalAspect } from '../../../shared/types'; // Adjust path if necessary

interface NatalChartWheelProps {
  chartData: NatalChartData | null;
  width?: number;
  height?: number;
}

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const PLANET_SYMBOLS: { [key: string]: string } = {
  sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂', 
  jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇',
  ascendant: 'Asc', midheaven: 'MC'
};

const PLANET_COLORS: { [key: string]: string } = {
  sun: '#FFD700', moon: '#C0C0C0', mercury: '#87CEEB', venus: '#FFB6C1', mars: '#FF4500',
  jupiter: '#FFA500', saturn: '#A9A9A9', uranus: '#00FFFF', neptune: '#0000FF', pluto: '#708090',
  default: '#000000', // Default color for aspects or other elements
  Conjunction: '#4CAF50', // Green for Conjunction
  Sextile: '#2196F3',     // Blue for Sextile
  Square: '#F44336',       // Red for Square
  Trine: '#03A9F4',         // Light Blue for Trine
  Opposition: '#FF9800',   // Orange for Opposition
};

// Helper function to convert longitude to radians for canvas drawing
// 0 Aries = Math.PI (9 o'clock), clockwise progression
const longitudeToRadians = (longitude: number): number => {
  return Math.PI - (longitude * Math.PI / 180);
};

const drawZodiacWheel = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) / 2 * 0.9;
  const innerRadius = outerRadius * 0.8;
  const labelRadius = outerRadius * 0.9; 

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = '#AAA';
  ctx.fillStyle = '#333';
  ctx.lineWidth = 1;
  ctx.font = '10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
  ctx.stroke();

  for (let i = 0; i < 12; i++) {
    const startAngleRad = longitudeToRadians(i * 30); // Longitude for the start of the sign
    const midAngleRad = longitudeToRadians((i + 0.5) * 30);

    ctx.beginPath();
    ctx.moveTo(centerX + innerRadius * Math.cos(startAngleRad), centerY + innerRadius * Math.sin(startAngleRad));
    ctx.lineTo(centerX + outerRadius * Math.cos(startAngleRad), centerY + outerRadius * Math.sin(startAngleRad));
    ctx.stroke();

    const labelX = centerX + labelRadius * Math.cos(midAngleRad);
    const labelY = centerY + labelRadius * Math.sin(midAngleRad);
    
    ctx.save();
    ctx.translate(labelX, labelY);
    const rotationAngle = midAngleRad + Math.PI / 2; // Align with radius
    if (rotationAngle > Math.PI / 2 && rotationAngle < 3 * Math.PI / 2) { 
        ctx.rotate(rotationAngle + Math.PI);
    } else {
        ctx.rotate(rotationAngle);
    }
    ctx.fillText(ZODIAC_SIGNS[i], 0, 0);
    ctx.restore();
  }
};

interface PlanetCanvasPosition {
    x: number;
    y: number;
    name: string;
    longitude: number;
}

const drawPlanets = (
  ctx: CanvasRenderingContext2D, 
  chartData: NatalChartData, 
  centerX: number, 
  centerY: number, 
  planetRadius: number
): Record<string, PlanetCanvasPosition> => {
  const positionsOnWheel: Record<string, PlanetCanvasPosition> = {};
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const pointsToDraw: { key: string; data?: PlanetDetail | LongitudeDetail | null, isAngle?: boolean }[] = [
    { key: 'sun', data: chartData.sun }, { key: 'moon', data: chartData.moon }, 
    { key: 'mercury', data: chartData.mercury }, { key: 'venus', data: chartData.venus }, 
    { key: 'mars', data: chartData.mars }, { key: 'jupiter', data: chartData.jupiter }, 
    { key: 'saturn', data: chartData.saturn }, { key: 'uranus', data: chartData.uranus }, 
    { key: 'neptune', data: chartData.neptune }, { key: 'pluto', data: chartData.pluto },
    { key: 'ascendant', data: chartData.ascendant, isAngle: true }, 
    { key: 'midheaven', data: chartData.midheaven, isAngle: true },
  ];

  pointsToDraw.forEach(p => {
    if (p.data) {
      const pointData = p.data;
      const longitude = (p.isAngle ? (pointData as LongitudeDetail).fullLongitude : (pointData as PlanetDetail).longitude);
      const angleRad = longitudeToRadians(longitude);
      const x = centerX + planetRadius * Math.cos(angleRad);
      const y = centerY + planetRadius * Math.sin(angleRad);
      
      ctx.fillStyle = PLANET_COLORS[p.key] || PLANET_COLORS.default;
      ctx.fillText(PLANET_SYMBOLS[p.key] || '?', x, y);
      
      // Store position for aspects
      positionsOnWheel[p.key.charAt(0).toUpperCase() + p.key.slice(1)] = { x, y, name: p.key, longitude };

      if (!p.isAngle) {
          const planet = pointData as PlanetDetail;
          ctx.font = '9px Arial';
          ctx.fillStyle = '#555';
          const degreeText = `${Math.floor(planet.positionInSign)}°${planet.sign.substring(0,3)}`;
          ctx.fillText(degreeText, x, y + 12);
          ctx.font = '14px Arial';
      }
    }
  });
  return positionsOnWheel;
};

const drawHouseCusps = (
  ctx: CanvasRenderingContext2D, 
  chartData: NatalChartData, 
  centerX: number, 
  centerY: number, 
  innerWheelRadius: number, 
  outerWheelRadius: number // Can extend to chart edge
) => {
  if (!chartData.housesCusps || !chartData.ascendant || !chartData.midheaven) return;

  ctx.strokeStyle = '#777'; // Lighter color for house lines
  ctx.lineWidth = 0.5;
  ctx.font = '10px Arial';
  ctx.fillStyle = '#555';

  // Draw Ascendant and MC lines more prominently
  const ascAngleRad = longitudeToRadians(chartData.ascendant.fullLongitude);
  const mcAngleRad = longitudeToRadians(chartData.midheaven.fullLongitude);

  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#000';
  // Ascendant Line (from center to edge)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + outerWheelRadius * 1.1 * Math.cos(ascAngleRad), centerY + outerWheelRadius * 1.1 * Math.sin(ascAngleRad));
  ctx.stroke();
  // MC Line (from center to edge)
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(centerX + outerWheelRadius * 1.1 * Math.cos(mcAngleRad), centerY + outerWheelRadius * 1.1 * Math.sin(mcAngleRad));
  ctx.stroke();
  ctx.restore(); // Restore lineWidth and strokeStyle

  // Draw other house cusp lines (from inner wheel radius to outer wheel radius)
  chartData.housesCusps.forEach((cuspLongitude, index) => {
    // Skip Asc (1st house cusp) and MC (10th house cusp) if already drawn prominently, 
    // or draw all with standard lines if preferred. Here, drawing all for completeness.
    const angleRad = longitudeToRadians(cuspLongitude);
    ctx.beginPath();
    ctx.moveTo(centerX + innerWheelRadius * Math.cos(angleRad), centerY + innerWheelRadius * Math.sin(angleRad));
    ctx.lineTo(centerX + outerWheelRadius * Math.cos(angleRad), centerY + outerWheelRadius * Math.sin(angleRad));
    ctx.stroke();

    // Label house numbers (optional, can get cluttered)
    // Position label slightly inside the outer wheel
    const labelAngleRad = longitudeToRadians(cuspLongitude + 2); // Small offset into the house sector
    const labelRadius = outerWheelRadius * 0.95;
    const x = centerX + labelRadius * Math.cos(labelAngleRad);
    const y = centerY + labelRadius * Math.sin(labelAngleRad);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // ctx.fillText((index + 1).toString(), x, y);
  });

  // Label Asc and MC text
  ctx.font = '12px Arial Black';
  ctx.fillStyle = '#000';
  const ascLabelX = centerX + (outerWheelRadius * 1.05) * Math.cos(ascAngleRad + 0.05); // slight offset for clarity
  const ascLabelY = centerY + (outerWheelRadius * 1.05) * Math.sin(ascAngleRad + 0.05);
  ctx.fillText(PLANET_SYMBOLS.ascendant, ascLabelX, ascLabelY);

  const mcLabelX = centerX + (outerWheelRadius * 1.05) * Math.cos(mcAngleRad + 0.05);
  const mcLabelY = centerY + (outerWheelRadius * 1.05) * Math.sin(mcAngleRad + 0.05);
  ctx.fillText(PLANET_SYMBOLS.midheaven, mcLabelX, mcLabelY);
};

// New function to draw aspects
const drawAspects = (
  ctx: CanvasRenderingContext2D,
  aspects: AstrologicalAspect[],
  planetPositions: Record<string, PlanetCanvasPosition>,
  centerX: number,
  centerY: number,
  aspectLineRadius: number // Radius for aspect lines (e.g., center of the chart)
) => {
  if (!aspects || aspects.length === 0) return;

  ctx.lineWidth = 1;
  ctx.font = '10px Arial';

  aspects.forEach(aspect => {
    const p1Name = aspect.planet1; // e.g., "Sun"
    const p2Name = aspect.planet2; // e.g., "Mars"

    // Find the positions. Note: aspect.planet1/2 are capitalized from backend.
    const pos1 = planetPositions[p1Name]; 
    const pos2 = planetPositions[p2Name];

    if (pos1 && pos2) {
      ctx.beginPath();
      ctx.moveTo(pos1.x, pos1.y); // Start from the planet symbol itself
      ctx.lineTo(pos2.x, pos2.y); // End at the other planet symbol
      // Or, to draw from center for a cleaner look if many aspects:
      // ctx.moveTo(centerX, centerY);
      // ctx.lineTo(pos1.x, pos1.y);
      // ctx.moveTo(centerX, centerY);
      // ctx.lineTo(pos2.x, pos2.y);

      ctx.strokeStyle = PLANET_COLORS[aspect.type] || PLANET_COLORS.default;
      ctx.stroke();

      // Optional: Draw aspect symbol at the midpoint (can get cluttered)
      // const midX = (pos1.x + pos2.x) / 2;
      // const midY = (pos1.y + pos2.y) / 2;
      // ctx.fillStyle = PLANET_COLORS[aspect.type] || PLANET_COLORS.default;
      // ctx.fillText(aspect.symbol, midX, midY);
    } else {
      console.warn('Could not find positions for aspect:', aspect, p1Name, p2Name, planetPositions);
    }
  });
};

const NatalChartWheel: React.FC<NatalChartWheelProps> = ({
  chartData,
  width = 600,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && chartData) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const centerX = width / 2;
        const centerY = height / 2;
        const outerRadius = Math.min(width, height) / 2 * 0.9;
        const innerRadius = outerRadius * 0.8;
        const planetRadius = innerRadius * 0.85; // Place planets inside the inner zodiac circle
        const aspectLineRadius = innerRadius * 0.7; // Example, adjust as needed

        drawZodiacWheel(ctx, width, height);
        drawHouseCusps(ctx, chartData, centerX, centerY, innerRadius, outerRadius);
        const planetPositionsOnWheel = drawPlanets(ctx, chartData, centerX, centerY, planetRadius);
        
        if (chartData.aspects) {
          drawAspects(ctx, chartData.aspects, planetPositionsOnWheel, centerX, centerY, aspectLineRadius);
        }
      }
    }
  }, [chartData, width, height]);

  if (!chartData) {
    return <div>Loading chart data or data unavailable...</div>;
  }

  return (
    <div style={{ width: `${width}px`, height: `${height}px`, border: '1px solid #ccc', position: 'relative' }}>
      <canvas ref={canvasRef} width={width} height={height} />
      {/* Raw data display commented out for cleaner UI by default */}
      {/* <pre style={{ fontSize: '10px', maxHeight: '100px', overflow: 'auto', position: 'absolute', bottom: '0', background: 'rgba(255,255,255,0.8)' }}>
        {JSON.stringify(chartData, null, 2)}
      </pre> */}
    </div>
  );
};

export default NatalChartWheel; 