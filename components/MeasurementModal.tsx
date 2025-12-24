import React, { useState, useEffect } from 'react';
import { Measurement } from '../types';
import { MEASUREMENT_TYPES } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (date: string, measurements: Record<string, string>, existingItems?: Measurement[]) => Promise<void>;
  editDate?: string;
  editItems?: Measurement[];
}

const MeasurementModal: React.FC<Props> = ({ isOpen, onClose, onSave, editDate, editItems }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editDate && editItems) {
        setDate(editDate);
        const newValues: Record<string, string> = {};
        editItems.forEach((item) => {
          newValues[item.name] = item.value.toString();
        });
        setValues(newValues);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setValues({});
      }
    }
  }, [isOpen, editDate, editItems]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(date, values, editItems);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Errore durante il salvataggio.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col border border-gray-100">
        <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-indigo-50 p-3 rounded-2xl">
              <i className={`fa-solid ${editDate ? 'fa-pen-to-square' : 'fa-plus'} text-indigo-600 text-xl`}></i>
            </div>
            {editDate ? 'Modifica Misurazione' : 'Nuova Misurazione'}
          </h2>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-full transition-all"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 bg-white space-y-8">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider ml-1">Data Rilevazione</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <i className="fa-regular fa-calendar text-gray-400 text-lg"></i>
              </div>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-xl text-lg text-gray-800 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-indigo-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            {MEASUREMENT_TYPES.map((type) => (
              <div key={type.key} className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide ml-1">{type.label}</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <i className={`fa-solid ${type.icon} text-gray-400 group-focus-within:text-indigo-500 transition-colors text-lg`}></i>
                  </div>
                  <input
                    type="number"
                    step={type.step}
                    min="0"
                    placeholder="0.0"
                    value={values[type.key] || ''}
                    onChange={(e) => handleChange(type.key, e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl text-lg text-gray-800 placeholder-gray-300 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm hover:border-indigo-300"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-50 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold text-base hover:bg-gray-50 hover:border-gray-300 transition-all"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-base hover:bg-indigo-700 transition-all flex items-center gap-3 disabled:opacity-70 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 active:scale-[0.98]"
            >
              {loading && <i className="fa-solid fa-circle-notch fa-spin"></i>}
              Salva Misurazione
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MeasurementModal;