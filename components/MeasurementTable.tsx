import React, { useMemo } from 'react';
import { Measurement } from '../types';

interface Props {
  data: Measurement[];
  onEdit: (date: string, items: Measurement[]) => void;
  onDelete: (items: Measurement[]) => void;
}

const MeasurementTable: React.FC<Props> = ({ data, onEdit, onDelete }) => {
  const groupedData = useMemo(() => {
    const groups: { [key: string]: Measurement[] } = {};
    data.forEach((item) => {
      if (!groups[item.timestamp]) groups[item.timestamp] = [];
      groups[item.timestamp].push(item);
    });
    return Object.keys(groups)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .map((date) => ({ date, items: groups[date] }));
  }, [data]);

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-200 text-sm uppercase text-gray-500 tracking-wider font-bold">
              <th className="px-6 py-5 w-40">Data</th>
              <th className="px-6 py-5">Misurazioni</th>
              <th className="px-6 py-5 text-right w-32">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-base">
            {groupedData.map(({ date, items }) => (
              <tr key={date} className="hover:bg-slate-50 transition-colors group relative">
                <td className="px-6 py-5 font-bold text-gray-800 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-500">
                      <i className="fa-regular fa-calendar"></i>
                    </div>
                    {new Date(date).toLocaleDateString('it-IT')}
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-wrap gap-3">
                    {items
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((item) => (
                        <div
                          key={item.id}
                          className="bg-indigo-50 border border-indigo-100 text-indigo-900 px-4 py-1.5 rounded-full text-sm font-medium flex gap-2 items-center shadow-sm"
                        >
                          <span className="text-indigo-600/80 font-semibold">{item.name}</span>
                          <span className="font-extrabold text-indigo-700">
                            {item.value.toFixed(1)} {item.name.toLowerCase() === 'peso' ? 'kg' : 'cm'}
                          </span>
                        </div>
                      ))}
                  </div>
                </td>
                <td className="px-6 py-5">
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
  );
};

export default MeasurementTable;