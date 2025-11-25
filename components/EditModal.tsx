
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GeneratedImage } from '../types';
import Canvas from './Canvas';
import { PencilIcon } from './icons/PencilIcon';
import Spinner from './Spinner';
import { useTranslations } from '../contexts/LanguageContext';

interface EditModalProps {
  image: GeneratedImage;
  onClose: () => void;
  onSubmit: (editedImageDataUrl: string, prompt: string) => void;
}

const EditModal: React.FC<EditModalProps> = ({ image, onClose, onSubmit }) => {
  const [prompt, setPrompt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef<{ getImageDataUrl: () => string }>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslations();

  const handleSubmit = async () => {
    if (!prompt.trim() || !canvasRef.current) return;
    setIsSubmitting(true);
    const editedImageDataUrl = canvasRef.current.getImageDataUrl();
    const fullPrompt = `${t('edit_prompt_prefix')}: "${prompt}"`;
    await onSubmit(editedImageDataUrl, fullPrompt);
    setIsSubmitting(false);
  };

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700"
      >
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PencilIcon className="w-6 h-6 text-indigo-400" />
            {t('editModalTitle')}: <span className="text-gray-400">{t(image.format)}</span>
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </header>
        
        <div className="flex-grow p-4 md:p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="w-full h-full min-h-[300px]">
                <Canvas ref={canvasRef} imageUrl={image.dataUrl} />
            </div>
            <div className="flex flex-col">
                <label htmlFor="edit-prompt" className="font-semibold mb-2 text-gray-300">
                    {t('editDescribeChanges')}
                </label>
                <textarea
                    id="edit-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('editPlaceholder')}
                    className="w-full flex-grow bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                    rows={8}
                />
            </div>
        </div>

        <footer className="p-4 border-t border-gray-700 flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white transition">
            {t('cancelButton')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isSubmitting}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
          >
            {isSubmitting ? <Spinner /> : t('applyEditsButton')}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default EditModal;