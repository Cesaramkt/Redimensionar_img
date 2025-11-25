
import React, { useState, useEffect } from 'react';
import { ImageFormat } from '../types';
import { useTranslations } from '../contexts/LanguageContext';

interface FormatSelectorProps {
  onSelectionChange: (formats: ImageFormat[]) => void;
}

const AVAILABLE_FORMATS = [
  { id: ImageFormat.RATIO_1_1, label: '1:1', aspectClass: 'aspect-square' },
  { id: ImageFormat.RATIO_2_3, label: '2:3', aspectClass: 'aspect-[2/3]' },
  { id: ImageFormat.RATIO_3_2, label: '3:2', aspectClass: 'aspect-[3/2]' },
  { id: ImageFormat.RATIO_3_4, label: '3:4', aspectClass: 'aspect-[3/4]' },
  { id: ImageFormat.RATIO_4_3, label: '4:3', aspectClass: 'aspect-[4/3]' },
  { id: ImageFormat.RATIO_9_16, label: '9:16', aspectClass: 'aspect-[9/16]' },
  { id: ImageFormat.RATIO_16_9, label: '16:9', aspectClass: 'aspect-[16/9]' },
  { id: ImageFormat.RATIO_21_9, label: '21:9', aspectClass: 'aspect-[21/9]' },
];

const FormatSelector: React.FC<FormatSelectorProps> = ({ onSelectionChange }) => {
  const { t } = useTranslations();
  const [selectedFormats, setSelectedFormats] = useState<ImageFormat[]>([]);

  useEffect(() => {
    onSelectionChange(selectedFormats);
  }, [selectedFormats, onSelectionChange]);
  
  const toggleFormat = (format: ImageFormat) => {
    setSelectedFormats(prev => 
      prev.includes(format) ? prev.filter(f => f !== format) : [...prev, format]
    );
  };

  const selectAll = () => {
    if (selectedFormats.length === AVAILABLE_FORMATS.length) {
        setSelectedFormats([]);
    } else {
        setSelectedFormats(AVAILABLE_FORMATS.map(f => f.id));
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-300">{t('formatsTitle')}</h2>
        <button 
            onClick={selectAll}
            className="text-sm text-indigo-400 hover:text-indigo-300 underline"
        >
            {selectedFormats.length === AVAILABLE_FORMATS.length ? t('deselectAll') : t('selectAll')}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {AVAILABLE_FORMATS.map(({ id, label, aspectClass }) => {
            const isSelected = selectedFormats.includes(id);
            return (
              <button
                key={id}
                onClick={() => toggleFormat(id)}
                className={`group relative p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-gray-800 border-gray-700 hover:border-gray-500 hover:bg-gray-700'
                }`}
              >
                {/* Visual Representation of Aspect Ratio */}
                <div className={`w-12 bg-gray-600 rounded-sm border border-gray-500 ${aspectClass} ${isSelected ? 'bg-indigo-500 border-indigo-300' : ''}`}></div>
                
                <span className={`font-medium text-sm ${isSelected ? 'text-indigo-300' : 'text-gray-400 group-hover:text-gray-200'}`}>
                    {label}
                </span>

                {isSelected && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>
                )}
              </button>
            );
        })}
      </div>
    </div>
  );
};

export default FormatSelector;
