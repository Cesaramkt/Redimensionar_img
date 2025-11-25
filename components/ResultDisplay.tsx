
import React from 'react';
import { GeneratedImage, ImageFormat } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { EditIcon } from './icons/EditIcon';
import { useTranslations } from '../contexts/LanguageContext';

interface ResultDisplayProps {
  images: GeneratedImage[];
  onEdit: (image: GeneratedImage) => void;
}

const getAspectRatioClass = (format: ImageFormat): string => {
  switch (format) {
    case ImageFormat.RATIO_1_1: return 'aspect-square';
    case ImageFormat.RATIO_2_3: return 'aspect-[2/3]';
    case ImageFormat.RATIO_3_2: return 'aspect-[3/2]';
    case ImageFormat.RATIO_3_4: return 'aspect-[3/4]';
    case ImageFormat.RATIO_4_3: return 'aspect-[4/3]';
    case ImageFormat.RATIO_9_16: return 'aspect-[9/16]';
    case ImageFormat.RATIO_16_9: return 'aspect-[16/9]';
    case ImageFormat.RATIO_21_9: return 'aspect-[21/9]';
    default: return 'aspect-square';
  }
};


const ResultDisplay: React.FC<ResultDisplayProps> = ({ images, onEdit }) => {
  const { t } = useTranslations();

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-bold text-center mb-8 text-gray-200">{t('generatedTitle')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
        {images.map((image) => {
          const aspectRatioClass = getAspectRatioClass(image.format);
          return (
            <div key={image.id} className="group relative bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-700 flex flex-col">
              <div className="w-full relative">
                 <img 
                    src={image.dataUrl} 
                    alt={image.format} 
                    className={`w-full h-auto object-contain bg-black ${aspectRatioClass}`} 
                  />
              </div>
              
              <div className="p-4 bg-gray-800 border-t border-gray-700 flex justify-between items-center">
                 <span className="font-bold text-white text-sm">{image.format}</span>
                 <div className="flex space-x-2">
                    <button
                        onClick={() => onEdit(image)}
                        className="p-2 bg-gray-700 hover:bg-indigo-600 rounded-md text-white transition-colors"
                        aria-label={t('editAriaLabel')}
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <a
                        href={image.dataUrl}
                        download={`resized-${image.format}.png`}
                        className="p-2 bg-gray-700 hover:bg-green-600 rounded-md text-white transition-colors"
                        aria-label={t('downloadAriaLabel')}
                    >
                        <DownloadIcon className="w-4 h-4" />
                    </a>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultDisplay;
