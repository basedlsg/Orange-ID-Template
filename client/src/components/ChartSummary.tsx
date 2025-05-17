import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { NatalChartData, PlanetDetail, LongitudeDetail } from '../../../shared/types'; // Adjust path as necessary

interface ChartSummaryProps {
  chartData: NatalChartData | null;
  getInterpretationFn: (elementType: string, key: string) => Promise<{ text_content: string } | null>;
}

const InterpretationDisplay: React.FC<{ elementType: string; elementKey: string | undefined; getInterpretationFn: ChartSummaryProps['getInterpretationFn']; label: string }> = ({ elementType, elementKey, getInterpretationFn, label }) => {
  const {
    data: interpretation,
    isLoading,
    isError,
    error,
  } = useQuery< { text_content: string } | null, Error >({
    queryKey: ['interpretation', elementType, elementKey],
    queryFn: () => elementKey ? getInterpretationFn(elementType, elementKey) : Promise.resolve(null),
    enabled: !!elementKey, // Only run query if key is available
  });

  if (!elementKey) return null; // Don't render if no key (e.g. ascendant is null)
  if (isLoading) return <div style={{ paddingLeft: '10px' }}><p>{label}: Loading interpretation...</p></div>;
  if (isError) return <div style={{ paddingLeft: '10px' }}><p>{label} Interpretation Error: {error.message}</p></div>;

  return (
    <div style={{ marginBottom: '15px' }}>
      <p style={{ fontWeight: 'bold', color: '#b0b0b0', fontSize: '1em' }}>{label} ({elementKey}):</p>
      <p style={{ color: '#cccccc', fontSize: '0.85em', paddingLeft: '10px', borderLeft: '2px solid #444', marginBottom: '15px' }}>{interpretation?.text_content || 'No interpretation text available.'}</p>
    </div>
  );
};

// Helper function (can be co-located or imported if used elsewhere)
const getClientAspectKey = (planet1Name: string, planet2Name: string, aspectName: string): string => {
  const sortedPlanets = [planet1Name, planet2Name].sort();
  const standardizedAspectName = aspectName.replace(/\s+/g, '_');
  return `${sortedPlanets[0]}_${standardizedAspectName}_${sortedPlanets[1]}`;
};

const ChartSummary: React.FC<ChartSummaryProps> = ({ chartData, getInterpretationFn }) => {
  // Immediately log the raw chartData to help with debugging
  console.log('CHART_SUMMARY_DEBUG - Raw chartData:', chartData);
  
  if (!chartData) {
    return <p style={{ color: '#E0E0E0' }}>No chart data available.</p>;
  }
  
  console.log('CHART_SUMMARY_DEBUG - Specific properties:', {
    ascendantType: typeof chartData.ascendant,
    midheavenType: typeof chartData.midheaven,
    ascendantValue: chartData.ascendant,
    midheavenValue: chartData.midheaven,
    ascendantSign: chartData.ascendant?.sign,
    midheavenSign: chartData.midheaven?.sign,
    ascendantDegree: chartData.ascendant?.degree
  });

  const formatDegrees = (value: number | undefined): string => {
    return value !== undefined ? value.toFixed(2) + '°' : 'N/A';
  };

  const planetEntries: Array<{ name: string; data: PlanetDetail | null | undefined; isMajorLuminaries?: boolean }> = [
    { name: 'Sun', data: chartData.sun, isMajorLuminaries: true },
    { name: 'Moon', data: chartData.moon, isMajorLuminaries: true },
    { name: 'Mercury', data: chartData.mercury },
    { name: 'Venus', data: chartData.venus },
    { name: 'Mars', data: chartData.mars },
    { name: 'Jupiter', data: chartData.jupiter },
    { name: 'Saturn', data: chartData.saturn },
    { name: 'Uranus', data: chartData.uranus },
    { name: 'Neptune', data: chartData.neptune },
    { name: 'Pluto', data: chartData.pluto },
  ];

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      padding: '20px',
      border: '1px solid #444',
      borderRadius: '8px',
      backgroundColor: '#2d2d2d',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
      maxHeight: '600px',
      overflowY: 'auto',
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
      color: '#E0E0E0',
      lineHeight: '1.6',
      fontSize: '0.9em',
    },
    heading: {
      textAlign: 'center',
      color: '#FFFFFF',
      marginBottom: '25px',
      fontSize: '1.2em',
      borderBottom: '1px solid #444',
      paddingBottom: '10px',
    },
    sectionHeading: {
        color: '#EAEAEA',
        fontSize: '1.1em',
        marginBottom: '15px',
        marginTop: '20px',
        borderBottom: '1px solid #444',
        paddingBottom: '8px',
    },
    section: {
      marginBottom: '20px',
    },
    label: {
      fontWeight: 'bold',
      color: '#b0b0b0',
    },
    value: {
      marginLeft: '8px',
      color: '#E0E0E0',
    },
    list: {
      listStyleType: 'none',
      paddingLeft: 0,
    },
    listItem: {
      padding: '6px 0',
      borderBottom: '1px dashed #3a3a3a',
    },
    listItemLast: {
        padding: '6px 0',
    },
    interpretationsSection: {
        marginTop: '20px',
        paddingTop: '15px',
    },
    interpretationText: {
        color: '#cccccc',
        fontSize: '0.85em',
        paddingLeft: '10px',
        borderLeft: '2px solid #444',
        marginBottom: '15px'
    },
    aspectsList: {
        listStyleType: 'none',
        paddingLeft: '10px',
        marginTop: '10px'
    },
    aspectListItem: {
        padding: '4px 0',
        fontSize: '0.85em'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Natal Chart Summary</h2>

      <div style={styles.section}>
        <p>
          <span style={styles.label}>Sun:</span>
          <span style={styles.value}>
            {chartData.sun?.sign || 'N/A'} at {formatDegrees(chartData.sun?.positionInSign)}
            {chartData.sun?.house && <span style={styles.value}> (House {chartData.sun.house})</span>}
          </span>
        </p>
        <p>
          <span style={styles.label}>Moon:</span>
          <span style={styles.value}>
            {chartData.moon?.sign || 'N/A'} at {formatDegrees(chartData.moon?.positionInSign)}
            {chartData.moon?.house && <span style={styles.value}> (House {chartData.moon.house})</span>}
          </span>
        </p>
      </div>

      <div style={styles.section}>
        <p>
          <span style={styles.label}>Ascendant (ASC):</span>
          <span style={styles.value}>
            {chartData.ascendant?.sign || 'N/A'} at {formatDegrees(chartData.ascendant?.degree)}
          </span>
        </p>
        <p>
          <span style={styles.label}>Midheaven (MC):</span>
          <span style={styles.value}>
            {chartData.midheaven?.sign || 'N/A'} at {formatDegrees(chartData.midheaven?.degree)}
          </span>
        </p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionHeading}>Planetary Positions</h3>
        <ul style={styles.list}>
          {planetEntries.map((planet, index) => (
            <li key={planet.name} style={index === planetEntries.length - 1 ? styles.listItemLast : styles.listItem}>
              <span style={styles.label}>{planet.name}:</span>
              <span style={styles.value}>
                {planet.data?.sign || 'N/A'} at {formatDegrees(planet.data?.positionInSign)}
                {planet.data?.house && <span style={styles.value}> (House {planet.data.house})</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>
      
      {chartData.aspects && chartData.aspects.length > 0 && (
        <div style={styles.section}>
          <h3 style={styles.sectionHeading}>Major Aspects</h3>
          <ul style={styles.aspectsList}>
            {chartData.aspects.map((aspect, index) => (
              <li key={index} style={styles.aspectListItem}>
                {aspect.point1Name} {aspect.aspectName} {aspect.point2Name} ({aspect.orb.toFixed(2)}° orb)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={styles.interpretationsSection}>
        <h3 style={styles.sectionHeading}>Interpretations</h3>
        <InterpretationDisplay 
          elementType="sun_sign" 
          elementKey={chartData.sun?.sign} 
          getInterpretationFn={getInterpretationFn} 
          label="Sun Sign"
        />
        {chartData.sun?.house && (
          <InterpretationDisplay
            elementType="planet_in_house"
            elementKey={`Sun_${chartData.sun.house}H`}
            getInterpretationFn={getInterpretationFn}
            label={`Sun in House ${chartData.sun.house}`}
          />
        )}
        <InterpretationDisplay 
          elementType="moon_sign" 
          elementKey={chartData.moon?.sign} 
          getInterpretationFn={getInterpretationFn} 
          label="Moon Sign"
        />
        {chartData.moon?.house && (
          <InterpretationDisplay
            elementType="planet_in_house"
            elementKey={`Moon_${chartData.moon.house}H`}
            getInterpretationFn={getInterpretationFn}
            label={`Moon in House ${chartData.moon.house}`}
          />
        )}
        <InterpretationDisplay 
          elementType="ascendant_sign" 
          elementKey={chartData.ascendant?.sign} 
          getInterpretationFn={getInterpretationFn} 
          label="Ascendant Sign"
        />
        
        {planetEntries.filter(p => !p.isMajorLuminaries).map(planet => (
          <React.Fragment key={`${planet.name}_interpretations`}>
            {planet.data?.sign && (
              <InterpretationDisplay
                elementType="planet_in_sign"
                elementKey={`${planet.name}_${planet.data.sign}`}
                getInterpretationFn={getInterpretationFn}
                label={`${planet.name} in ${planet.data.sign}`}
              />
            )}
            {planet.data?.house && (
              <InterpretationDisplay
                elementType="planet_in_house"
                elementKey={`${planet.name}_${planet.data.house}H`}
                getInterpretationFn={getInterpretationFn}
                label={`${planet.name} in House ${planet.data.house}`}
              />
            )}
          </React.Fragment>
        ))}

        {chartData.aspects && chartData.aspects.map((aspect, index) => (
          <InterpretationDisplay
            key={`aspect_${index}`}
            elementType="aspect"
            elementKey={getClientAspectKey(aspect.point1Name, aspect.point2Name, aspect.aspectName)}
            getInterpretationFn={getInterpretationFn}
            label={`${aspect.point1Name} ${aspect.aspectName} ${aspect.point2Name}`}
          />
        ))}
      </div>
    </div>
  );
};

export default ChartSummary; 