import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Label
} from 'recharts';
import { Measurement, UserProfile } from '../types';
import { COLOR_MAP, getRandomColor } from '../constants';
import { calculateFitnessMetrics } from '../utils/fitness';

interface Props {
  data: Measurement[];
  userProfile: UserProfile | null;
}

interface ChartDataPoint {
  date: string;
  fullDate: string;
  value: number;
}

const MeasurementCharts: React.FC<Props> = ({ data, userProfile }) => {
  // Stato per gestire la visibilità delle serie (Legend interattiva)
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set());

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
    const groups: Record<string, { display: string; data: ChartDataPoint[] }> = {};

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

  // 3. Calcolo delle Metriche Attuali (Basate sull'ultima rilevazione)
  const currentMetrics = useMemo(() => {
    if (data.length === 0 || !userProfile) return null;

    // Trova la data più recente
    const sortedDates = [...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestDate = sortedDates[0].timestamp;
    
    // Filtra gli elementi di quella data
    const latestItems = data.filter(d => d.timestamp === latestDate);
    
    // Mappa valori
    const valueMap: Record<string, number> = {};
    latestItems.forEach(i => valueMap[i.name] = i.value);

    return {
        date: latestDate,
        metrics: calculateFitnessMetrics(valueMap, userProfile.gender, userProfile.height)
    };
  }, [data, userProfile]);

  const toggleSeries = (name: string) => {
    setHiddenSeries(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

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
          {currentMetrics && (
            <span className="text-xs text-gray-400 font-semibold ml-auto border border-gray-100 bg-gray-50 px-2 py-1 rounded-lg">
                Ultimo Agg.: {new Date(currentMetrics.date).toLocaleDateString('it-IT')}
            </span>
          )}
        </div>

        {/* METRICS SUMMARY CARDS */}
        {currentMetrics && (currentMetrics.metrics.bmi || currentMetrics.metrics.bodyFat || currentMetrics.metrics.whtr) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {currentMetrics.metrics.bmi && (
                    <div className={`p-4 rounded-2xl border ${currentMetrics.metrics.bmi.color} bg-opacity-30 flex items-center gap-4`}>
                        <div className="w-12 h-12 rounded-full bg-white bg-opacity-60 flex items-center justify-center text-xl shadow-sm">
                            <i className="fa-solid fa-weight-scale"></i>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase opacity-70">BMI (Indice Massa Corporea)</div>
                            <div className="text-2xl font-extrabold flex items-baseline gap-2">
                                {currentMetrics.metrics.bmi.value}
                                <span className="text-sm font-semibold opacity-80">{currentMetrics.metrics.bmi.status}</span>
                            </div>
                        </div>
                    </div>
                )}
                
                {currentMetrics.metrics.bodyFat && (
                    <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50 text-purple-700 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-xl shadow-sm text-purple-600">
                            <i className="fa-solid fa-droplet"></i>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase opacity-70 text-purple-600">Massa Grassa (Stimata)</div>
                            <div className="text-2xl font-extrabold flex items-baseline gap-2">
                                {currentMetrics.metrics.bodyFat.value}%
                                <span className="text-xs font-normal opacity-70 bg-purple-100 px-1.5 py-0.5 rounded">Navy Method</span>
                            </div>
                        </div>
                    </div>
                )}

                {currentMetrics.metrics.whtr && (
                    <div className={`p-4 rounded-2xl border ${currentMetrics.metrics.whtr.color} bg-opacity-30 flex items-center gap-4`}>
                        <div className="w-12 h-12 rounded-full bg-white bg-opacity-60 flex items-center justify-center text-xl shadow-sm">
                            <i className="fa-solid fa-ruler"></i>
                        </div>
                        <div>
                            <div className="text-xs font-bold uppercase opacity-70">Rapporto Vita/Altezza</div>
                            <div className="text-2xl font-extrabold flex items-baseline gap-2">
                                {currentMetrics.metrics.whtr.value}
                                <span className="text-sm font-semibold opacity-80">{currentMetrics.metrics.whtr.status}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )}

        {/* CUSTOM LEGEND (HTML puro per responsiveness perfetta) */}
        <div className="flex flex-wrap gap-2 mb-6 select-none border-t border-gray-100 pt-6">
          {availableMeasurements.map((key) => {
            const isHidden = hiddenSeries.has(key);
            const color = COLOR_MAP[key] || '#64748b'; // Fallback color
            
            return (
              <button
                key={key}
                onClick={() => toggleSeries(key)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200
                  ${isHidden 
                    ? 'bg-gray-50 text-gray-400 border-gray-200 opacity-70 hover:opacity-100' 
                    : 'bg-white text-gray-700 border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transform hover:-translate-y-0.5'
                  }
                `}
              >
                <span 
                  className={`w-3 h-3 rounded-full transition-colors ${isHidden ? 'bg-gray-300' : ''}`}
                  style={!isHidden ? { backgroundColor: color } : {}}
                ></span>
                {key}
              </button>
            );
          })}
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={unifiedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                formatter={(value: number, name: string) => {
                    const unit = String(name).toLowerCase() === 'peso' ? 'kg' : 'cm';
                    return [`${value} ${unit}`, name];
                }}
              />
              
              {availableMeasurements.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  hide={hiddenSeries.has(key)}
                  stroke={COLOR_MAP[key] || getRandomColor()}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                  connectNulls
                  isAnimationActive={false}
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
            
            // Goal Logic & Domain Calculation
            const goalValue = userProfile?.goals?.[type];
            let progressElement = null;
            
            // Dati valori
            const dataValues = chartData.map(d => d.value);
            const dataMin = Math.min(...dataValues);
            const dataMax = Math.max(...dataValues);
            
            // Calcolo limiti base
            let yMin = dataMin;
            let yMax = dataMax;

            if (typeof goalValue === 'number') {
                yMin = Math.min(yMin, goalValue);
                yMax = Math.max(yMax, goalValue);
            }

            // Padding del 15% sul range totale
            const range = Math.max(yMax - yMin, 1); // Evita divisione per 0 o range nullo
            const padding = range * 0.15;
            
            // Assicuriamo che il minimo non sia mai negativo
            const domainMin = Math.max(0, Math.floor(yMin - padding));
            const domainMax = Math.ceil(yMax + padding);

            // --- NUOVA LOGICA: Ticks Basati Esattamente sui Dati e sul Target ---
            // 1. Raccogli tutti i valori unici delle misurazioni
            let finalTicks: number[] = Array.from(new Set(chartData.map(d => d.value)));
            
            // 2. Aggiungi il Target (se esiste)
            if (typeof goalValue === 'number') {
                finalTicks.push(goalValue);
            }
            
            // 3. Rimuovi duplicati (Set) e ordina
            finalTicks = Array.from(new Set(finalTicks)).sort((a: number, b: number) => a - b);

            // 4. Se ci sono troppi valori (es. > 12), il grafico diventa illeggibile.
            // In questo caso, filtriamo mantenendo sempre: Minimo, Massimo, Ultimo Valore, Target
            // e campionando gli altri.
            if (finalTicks.length > 12) {
                const prioritySet = new Set([
                     chartData.length > 0 ? Math.min(...chartData.map(d => d.value)) : 0,
                     chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) : 0,
                     chartData.length > 0 ? chartData[chartData.length - 1].value : 0
                ]);
                if (typeof goalValue === 'number') prioritySet.add(goalValue);

                finalTicks = finalTicks.filter((val, index) => {
                    // Mantieni sempre le priorità (Min, Max, Ultimo, Goal)
                    if (prioritySet.has(val)) return true;
                    
                    // Campionamento: tieni un valore ogni tot
                    const skipRate = Math.ceil(finalTicks.length / 8);
                    return index % skipRate === 0;
                });
            }
            // ------------------------------------------------------------------

            if (typeof goalValue === 'number' && chartData.length > 0) {
                const currentVal = chartData[chartData.length - 1].value;
                const diff = currentVal - goalValue;
                
                const diffFormatted = Math.abs(diff).toFixed(1);
                const reached = Math.abs(diff) < 0.1;
                
                progressElement = (
                    <div className="mt-1 flex items-center justify-between text-xs font-medium">
                       <span className={`flex items-center gap-1 ${reached ? 'text-emerald-600' : 'text-amber-600'}`}>
                            <i className={`fa-solid ${reached ? 'fa-check-circle' : 'fa-bullseye'}`}></i>
                            {reached ? 'Raggiunto!' : `Target: ${goalValue}`}
                       </span>
                       {!reached && (
                           <span className="text-gray-400">
                               {diff > 0 ? '-' : '+'}{diffFormatted}{unit}
                           </span>
                       )}
                    </div>
                );
            }

            return (
              <div key={type} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-72 transition-all hover:shadow-md hover:border-indigo-100 relative overflow-hidden">
                <div className="mb-2">
                    <h4 className="text-sm font-extrabold uppercase tracking-wider text-gray-700 flex justify-between items-center">
                    {type}
                    <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{unit}</span>
                    </h4>
                    {progressElement}
                </div>

                <div className="flex-grow w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 30, right: 10, left: 0, bottom: 0 }}>
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
                        domain={[domainMin, domainMax]} 
                        ticks={finalTicks}
                        tick={(props: any) => {
                            const { x, y, payload } = props;
                            // Controlla se questo tick è il goal (con una piccola tolleranza per float)
                            const val = Number(payload.value);
                            const goal = goalValue;
                            const isGoal = typeof goal === 'number' && Math.abs(val - goal) < 0.01;
                            
                            return (
                                <text 
                                    x={x} 
                                    y={y} 
                                    dy={4} 
                                    textAnchor="end" 
                                    fill={isGoal ? "#10b981" : "#64748b"} 
                                    fontSize={11}
                                    fontWeight={isGoal ? 700 : 500}
                                >
                                    {payload.value}
                                </text>
                            );
                        }}
                        axisLine={false}
                        tickLine={false}
                        width={35}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', fontSize: '12px' }}
                        formatter={(value: number) => [`${value} ${unit}`, '']}
                        separator=""
                      />
                      {/* Goal Line */}
                      {typeof goalValue === 'number' && (
                          <ReferenceLine 
                            y={goalValue} 
                            stroke="#10b981" 
                            strokeDasharray="4 2" 
                            strokeWidth={2} 
                          >
                             <Label 
                                value="TARGET" 
                                position="insideTopRight" 
                                fill="#10b981" 
                                fontSize={10} 
                                fontWeight={800}
                                offset={5}
                            />
                          </ReferenceLine>
                      )}
                      
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