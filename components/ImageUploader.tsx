
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { useTranslations } from '../contexts/LanguageContext';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
  currentImage: string | null;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, currentImage }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslations();

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onImageUpload(file);
      } else {
        alert("Please select an image file.");
      }
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold mb-3 text-gray-300">{t('uploadTitle')}</h2>
      <label
        htmlFor="file-upload"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative block w-full aspect-square rounded-lg border-2 border-dashed transition-colors duration-300 ${
          isDragging ? 'border-indigo-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'
        } cursor-pointer`}
      >
        {currentImage ? (
          <img src={currentImage} alt="Preview" className="w-full h-full object-contain rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <UploadIcon className="w-12 h-12 text-gray-500 mb-3" />
            <span className="font-semibold text-gray-300">{t('uploadPrompt')}</span>
            <span className="text-sm text-gray-500 mt-1">{t('uploadFormats')}</span>
          </div>
        )}
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </label>
    </div>
  );
};

export default ImageUploader;