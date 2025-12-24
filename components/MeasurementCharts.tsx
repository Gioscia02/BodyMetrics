import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Measurement } from '../types';

interface Props {
  data: Measurement[];
}

const MeasurementCharts: React.FC<Props> = ({ data }) => {
  // Raggruppa i dati per nome della misurazione in modo efficiente e Case-Insensitive
  const charts = useMemo(() => {
    // Map key (lowercase) -> { display: string, data: any[] }
    const groups: Record<string, { display: string; data: any[] }> = {};

    data.forEach((d) => {
      // Normalizza il nome (rimuove spazi e rende minuscolo per il raggruppamento)
      const rawName = d.name.trim();
      const key = rawName.toLowerCase();
      
      if (!groups[key]) {
        // Usa il nome originale capitalizzato come titolo di visualizzazione
        // Se abbiamo "peso" e poi "Peso", cerchiamo di mantenere una formattazione gradevole
        const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        groups[key] = {
          display: displayName,
          data: []
        };
      }

      groups[key].data.push({
        date: new Date(d.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        fullDate: d.timestamp, // Usato per l'ordinamento cronologico corretto
        value: d.value,
      });
    });

    // Ottieni le chiavi e ordinale
    const keys = Object.keys(groups).sort();
    
    // Priorità: sposta 'peso' (chiave normalizzata) come primo grafico se esiste
    const weightIndex = keys.findIndex((k) => k === 'peso' || k === 'weight');
    if (weightIndex > -1) {
      keys.unshift(keys.splice(weightIndex, 1)[0]);
    }

    // Restituisce un array di oggetti grafico pronti per il rendering
    return keys.map((key) => ({
      type: groups[key].display, // Titolo visualizzato (es. "Peso")
      data: groups[key].data.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    }));
  }, [data]);

  if (charts.length === 0) {
    return (
      <div className="col-span-full text-center py-16 bg-white rounded-2xl text-gray-500 shadow-sm border border-gray-100 text-lg">
        Nessun grafico disponibile. Inizia ad aggiungere misurazioni!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
      {charts.map(({ type, data: chartData }) => {
        const unit = type.toLowerCase().includes('peso') ? 'kg' : 'cm';

        return (
          <div key={type} className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 flex flex-col h-80 transition-shadow hover:shadow-lg">
            <h4 className="text-lg font-extrabold uppercase tracking-wider text-gray-800 mb-4">{type}</h4>
            <div className="flex-grow w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 30, right: 15, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 14, fill: '#64748b', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={12}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    domain={['dataMin', 'dataMax']} 
                    padding={{ top: 25, bottom: 15 }}
                    tick={false}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                    label={{ 
                      value: unit, 
                      angle: 0, 
                      position: 'insideLeft',
                      style: { fill: '#64748b', fontSize: '14px', fontWeight: 700 } 
                    }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '10px' }}
                    labelStyle={{ color: '#64748b', fontSize: '14px', fontWeight: 700 }}
                    itemStyle={{ fontSize: '14px', fontWeight: 'bold', color: '#4f46e5' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#4f46e5"
                    strokeWidth={4}
                    dot={{ r: 4, fill: '#fff', stroke: '#4f46e5', strokeWidth: 3 }}
                    activeDot={{ r: 7, fill: '#4f46e5' }}
                    isAnimationActive={true}
                    label={{ 
                      position: 'top', 
                      fill: '#1e293b', 
                      fontSize: 12, 
                      fontWeight: 700,
                      dy: -8
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MeasurementCharts;