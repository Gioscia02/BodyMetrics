import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Measurement } from '../types';

interface Props {
  data: Measurement[];
}

// Mappa colori fissa per garantire coerenza visiva
const COLOR_MAP: Record<string, string> = {
  'Peso': '#4f46e5',      // Indigo
  'Petto': '#0891b2',     // Cyan
  'Vita': '#e11d48',      // Rose
  'Fianchi': '#d97706',   // Amber
  'Coscia': '#16a34a',    // Green
  'Bicipite SX': '#8b5cf6', // Violet
  'Bicipite DX': '#7c3aed', // Darker Violet
  'Polpaccio': '#ea580c', // Orange
  'Collo': '#475569',     // Slate
};

const getRandomColor = () => '#' + Math.floor(Math.random()*16777215).toString(16);

const MeasurementCharts: React.FC<Props> = ({ data }) => {
  
  // 1. Preparazione dati per il Grafico Combinato (Unified Chart)
  const unifiedData = useMemo(() => {
    const map = new Map<string, any>();

    data.forEach((d) => {
      if (!map.has(d.timestamp)) {
        map.set(d.timestamp, {
          dateStr: d.timestamp,
          displayDate: new Date(d.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
          fullDate: new Date(d.timestamp).getTime(),
        });
      }
      const entry = map.get(d.timestamp);
      // Normalizziamo il nome per sicurezza, ma usiamo il nome originale come chiave
      entry[d.name] = d.value;
    });

    return Array.from(map.values()).sort((a, b) => a.fullDate - b.fullDate);
  }, [data]);

  // Ottieni tutte le chiavi (nomi misurazioni) presenti nei dati
  const availableMeasurements = useMemo(() => {
    const keys = new Set<string>();
    data.forEach(d => keys.add(d.name));
    return Array.from(keys).sort(); // Ordine alfabetico
  }, [data]);

  // 2. Preparazione dati per i Piccoli Grafici (Small Multiples) - Logica esistente mantenuta e ottimizzata
  const smallCharts = useMemo(() => {
    const groups: Record<string, { display: string; data: any[] }> = {};

    data.forEach((d) => {
      const rawName = d.name.trim();
      const key = rawName.toLowerCase();
      
      if (!groups[key]) {
        const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);
        groups[key] = {
          display: displayName,
          data: []
        };
      }

      groups[key].data.push({
        date: new Date(d.timestamp).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        fullDate: d.timestamp,
        value: d.value,
      });
    });

    const keys = Object.keys(groups).sort();
    
    const weightIndex = keys.findIndex((k) => k === 'peso' || k === 'weight');
    if (weightIndex > -1) {
      keys.unshift(keys.splice(weightIndex, 1)[0]);
    }

    return keys.map((key) => ({
      type: groups[key].display,
      data: groups[key].data.sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
    }));
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="col-span-full text-center py-16 bg-white rounded-2xl text-gray-500 shadow-sm border border-gray-100 text-lg">
        Nessun grafico disponibile. Inizia ad aggiungere misurazioni!
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-8">
      
      {/* SEZIONE 1: GRANDE GRAFICO UNIFICATO */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg border border-indigo-50 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 p-2.5 rounded-xl text-indigo-600">
            <i className="fa-solid fa-chart-line text-xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800">Andamento Complessivo</h3>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={unifiedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                width={40}
              />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', padding: '12px' }}
                labelStyle={{ color: '#64748b', fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}
                itemStyle={{ fontSize: '14px', fontWeight: 'bold', padding: '2px 0' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '20px', fontSize: '14px', fontWeight: 500 }}
              />
              
              {availableMeasurements.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={COLOR_MAP[key] || getRandomColor()}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SEZIONE 2: GRIGLIA GRAFICI SINGOLI */}
      <div>
        <h4 className="text-sm font-bold uppercase text-gray-400 tracking-wider mb-4 px-2">Dettaglio per Misurazione</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {smallCharts.map(({ type, data: chartData }) => {
            const unit = type.toLowerCase().includes('peso') ? 'kg' : 'cm';
            const color = COLOR_MAP[type] || '#4f46e5';

            return (
              <div key={type} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-64 transition-all hover:shadow-md hover:border-indigo-100">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 mb-2 flex justify-between items-center">
                  {type}
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{unit}</span>
                </h4>
                <div className="flex-grow w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} 
                        axisLine={false} 
                        tickLine={false} 
                        dy={5}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        domain={['dataMin - 2', 'dataMax + 2']} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={3}
                        dot={false}
                        activeDot={{ r: 5, fill: color }}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MeasurementCharts;