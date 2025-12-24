import React, { useMemo } from 'react';
import { Measurement, UserProfile } from '../types';
import { COLOR_MAP } from '../constants';
import { calculateFitnessMetrics } from '../utils/fitness';

interface Props {
  data: Measurement[];
  userProfile: UserProfile | null;
  onEdit: (date: string, items: Measurement[]) => void;
  onDelete: (items: Measurement[]) => void;
}

const MeasurementTable: React.FC<Props> = ({ data, userProfile, onEdit, onDelete }) => {
  const groupedData = useMemo(() => {
    const groups: { [key: string]: Measurement[] } = {};
    data.forEach((item) => {
      if (!groups[item.timestamp]) groups[item.timestamp] = [];
      groups[item.timestamp].push(item);
    });

    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => {
        // Ordinamento item
        const sortedItems = groups[date].sort((a, b) => {
          const nameA = a.name.toLowerCase();
          const nameB = b.name.toLowerCase();
          if (nameA === 'peso') return -1;
          if (nameB === 'peso') return 1;
          return nameA.localeCompare(nameB);
        });

        // Preparazione oggetto chiave-valore per calcoli
        const valueMap: Record<string, number> = {};
        sortedItems.forEach(i => valueMap[i.name] = i.value);

        // Calcolo Metriche
        const metrics = calculateFitnessMetrics(
            valueMap, 
            userProfile?.gender, 
            userProfile?.height
        );

        return { date, items: sortedItems, metrics };
      });
  }, [data, userProfile]);

  const handleDeleteClick = (e: React.MouseEvent, dateStr: string, items: Measurement[]) => {
    e.stopPropagation();

    const formattedDate = new Date(dateStr).toLocaleDateString('it-IT');
    if (window.confirm(`Eliminare i dati del ${formattedDate}?`)) {
      onDelete(items);
    }
  };

  const handleEditClick = (e: React.MouseEvent, dateStr: string, items: Measurement[]) => {
    e.stopPropagation();
    onEdit(dateStr, items);
  };

  if (groupedData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-500 border border-gray-100 text-lg">
        Nessun dato. Inizia ad allenarti! 💪
      </div>
    );
  }

  return (
    <>
      {/* --- MOBILE VIEW: CARDS LAYOUT --- */}
      <div className="flex flex-col gap-4 sm:hidden">
        {groupedData.map(({ date, items, metrics }) => (
          <div key={date} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4 relative overflow-hidden">
            {/* Header Card: Data e Azioni */}
            <div className="flex justify-between items-center border-b border-gray-50 pb-3">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-xl text-indigo-500 shadow-sm">
                  <i className="fa-regular fa-calendar text-lg"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Data Rilevazione</span>
                  <span className="text-lg font-bold text-gray-800">
                    {new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={(e) => handleEditClick(e, date, items)}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 rounded-full transition-all active:scale-95"
                >
                  <i className="fa-solid fa-pen text-sm"></i>
                </button>
                <button
                  onClick={(e) => handleDeleteClick(e, date, items)}
                  className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-full transition-all active:scale-95"
                >
                  <i className="fa-solid fa-trash text-sm"></i>
                </button>
              </div>
            </div>
            
            {/* Statistiche Fisiche (se disponibili) */}
            {(metrics.bmi || metrics.bodyFat) && (
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                     <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Analisi Fisica</span>
                     <div className="flex flex-wrap gap-2">
                        {metrics.bmi && (
                            <div className={`px-2.5 py-1 rounded-md text-xs font-bold border ${metrics.bmi.color}`}>
                                BMI: {metrics.bmi.value} ({metrics.bmi.status})
                            </div>
                        )}
                        {metrics.bodyFat && (
                            <div className="px-2.5 py-1 rounded-md text-xs font-bold border text-purple-600 bg-purple-50 border-purple-200">
                                BF: {metrics.bodyFat.value}%
                            </div>
                        )}
                         {metrics.whtr && (
                             <div className={`px-2.5 py-1 rounded-md text-xs font-bold border ${metrics.whtr.color}`}>
                                 WHtR: {metrics.whtr.value}
                             </div>
                         )}
                     </div>
                </div>
            )}

            {/* Body Card: Lista Misurazioni */}
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Misurazioni</span>
              <div className="grid grid-cols-2 gap-3">
                {items.map((item) => {
                  const color = COLOR_MAP[item.name] || '#6366f1';
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col justify-center items-center text-center hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span 
                          className="w-2 h-2 rounded-full shadow-sm" 
                          style={{ backgroundColor: color }}
                        ></span>
                        <span className="text-xs font-semibold text-gray-500">
                          {item.name}
                        </span>
                      </div>
                      <span className="text-lg font-extrabold text-gray-800">
                        {item.value.toFixed(1)} <span className="text-xs font-medium text-gray-400">{item.name.toLowerCase() === 'peso' ? 'kg' : 'cm'}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- DESKTOP VIEW: TABLE LAYOUT --- */}
      <div className="hidden sm:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-sm uppercase text-gray-500 tracking-wider font-bold">
                <th className="px-6 py-5 w-40">Data</th>
                <th className="px-6 py-5 w-48">Analisi Fisica</th>
                <th className="px-6 py-5">Misurazioni</th>
                <th className="px-6 py-5 text-right w-32">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-base">
              {groupedData.map(({ date, items, metrics }) => (
                <tr key={date} className="hover:bg-slate-50 transition-colors group relative">
                  <td className="px-6 py-5 font-bold text-gray-800 whitespace-nowrap align-top">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 p-2 rounded-lg text-indigo-500">
                        <i className="fa-regular fa-calendar"></i>
                      </div>
                      {new Date(date).toLocaleDateString('it-IT')}
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    {/* Statistiche Desktop */}
                    <div className="flex flex-col gap-2 items-start">
                        {metrics.bmi ? (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${metrics.bmi.color}`}>
                                BMI {metrics.bmi.value} • {metrics.bmi.status}
                            </span>
                        ) : <span className="text-xs text-gray-400 italic">Dati insuff.</span>}
                        
                        {metrics.bodyFat && (
                            <span className="px-2 py-0.5 rounded text-xs font-bold border text-purple-600 bg-purple-50 border-purple-200">
                                Massa Grassa {metrics.bodyFat.value}%
                            </span>
                        )}

                        {metrics.whtr && (
                            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${metrics.whtr.color}`} title="Rapporto Vita/Altezza">
                                WHtR {metrics.whtr.value} • {metrics.whtr.status}
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-3">
                      {items.map((item) => {
                        const color = COLOR_MAP[item.name] || '#6366f1';
                        return (
                          <div
                            key={item.id}
                            className="bg-white border border-gray-200 px-3 py-1.5 rounded-full text-sm font-medium flex gap-2 items-center shadow-sm"
                          >
                            <span 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: color }}
                            ></span>
                            <span className="text-gray-600 font-semibold">{item.name}</span>
                            <span className="text-gray-900 font-bold border-l border-gray-200 pl-2 ml-1">
                              {item.value.toFixed(1)} <span className="text-gray-400 font-normal text-xs">{item.name.toLowerCase() === 'peso' ? 'kg' : 'cm'}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex justify-end gap-3 relative z-10">
                      <button
                        type="button"
                        onClick={(e) => handleEditClick(e, date, items)}
                        className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                        title="Modifica"
                      >
                        <i className="fa-solid fa-pen text-lg pointer-events-none"></i>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteClick(e, date, items)}
                        className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                        title="Elimina"
                      >
                        <i className="fa-solid fa-trash text-lg pointer-events-none"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default MeasurementTable;