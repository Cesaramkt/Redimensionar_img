import React, { useState, useCallback, useEffect } from 'react';
import { ImageFormat, GeneratedImage } from './types';
import { fileToDataUrl } from './utils/fileUtils';
import { generateImage, analyzeImage } from './services/geminiService';
import ImageUploader from './components/ImageUploader';
import FormatSelector from './components/FormatSelector';
import ResultDisplay from './components/ResultDisplay';
import EditModal from './components/EditModal';
import Spinner from './components/Spinner';
import { useTranslations } from './contexts/LanguageContext';
import LanguageSelector from './components/LanguageSelector';
import { createOutpaintingCanvas } from './utils/fileUtils';

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [originalImage, setOriginalImage] = useState<{ file: File; dataUrl: string; } | null>(null);
  const [imageDescription, setImageDescription] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [selectedFormats, setSelectedFormats] = useState<ImageFormat[]>([]);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<GeneratedImage | null>(null);
  const { t } = useTranslations();

  // Check for API Key on mount
  useEffect(() => {
    const checkApiKey = async () => {
      // Use type assertion to avoid conflict with existing global declarations
      if ((window as any).aistudio) {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } else {
        // Fallback for local dev or non-IDX environments where we assume API_KEY is set in .env
        setHasApiKey(true);
      }
    };
    checkApiKey();
  }, []);

  const handleApiKeySelect = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      // Assume success after the dialog flow closes (mitigate race condition)
      setHasApiKey(true);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const dataUrl = await fileToDataUrl(file);
      setOriginalImage({ file, dataUrl });
      setGeneratedImages([]);
      setError(null);
      setImageDescription('');
      
      // Trigger Analysis
      setIsAnalyzing(true);
      try {
        const description = await analyzeImage(dataUrl);
        setImageDescription(description);
      } catch (e) {
        console.error("Analysis failed", e);
      } finally {
        setIsAnalyzing(false);
      }

    } catch (err) {
      setError(t('error_failedToLoad'));
      console.error(err);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!originalImage || selectedFormats.length === 0) {
      setError(t('error_missingImageOrFormat'));
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGeneratedImages([]);

    const generationPromises = selectedFormats.map(async (format, index) => {
      try {
        // Step 1: Create the composite image with black areas for the AI to fill.
        const compositeImageDataUrl = await createOutpaintingCanvas(originalImage.dataUrl, format);

        // Step 2: Construct prompt based on analysis + requirement
        const basePrompt = t('prompt_outpainting_base');
        const visualContext = imageDescription ? `\n\nImage Context: ${imageDescription}` : '';
        const prompt = `${basePrompt}${visualContext}`;

        const finalImageUrl = await generateImage({
          imageDataUrl: compositeImageDataUrl,
          prompt: prompt,
          format: format,
        });

        return { id: `${format}-${Date.now()}-${index}`, format, dataUrl: finalImageUrl };

      } catch (err) {
        console.error(`Failed to generate for format ${format}:`, err);
        return null; 
      }
    });

    const results = await Promise.all(generationPromises);
    const successfulResults = results.filter((r): r is GeneratedImage => r !== null);
    
    if (successfulResults.length < selectedFormats.length) {
        setError(t('error_someFailed'));
    }

    setGeneratedImages(successfulResults);
    setIsLoading(false);
  }, [originalImage, selectedFormats, imageDescription, t]);

  const handleEditSubmit = async (editedImageDataUrl: string, prompt: string) => {
    if (!editingImage) return;

    setIsLoading(true);
    setError(null);
    setEditingImage(null);

    try {
        const newDataUrl = await generateImage({ 
          imageDataUrl: editedImageDataUrl, 
          prompt,
          format: editingImage.format 
        });
        setGeneratedImages(prev => prev.map(img => 
            img.id === editingImage.id ? { ...img, dataUrl: newDataUrl } : img
        ));
    } catch (err) {
        setError(t('error_editFailed'));
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  };

  // Render the API Key Selection screen if no key is selected
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex items-center justify-center p-4 relative">
        <LanguageSelector />
        <div className="max-w-md w-full bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-700 text-center relative z-0">
            <div className="mb-6 flex justify-center">
                <span className="material-symbols-outlined text-6xl text-indigo-500">lock_open</span>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-white">{t('apiKeyRequiredTitle')}</h1>
            <p className="text-gray-400 mb-8 leading-relaxed">
                {t('apiKeyRequiredBody')}
            </p>
            <button 
                onClick={handleApiKeySelect}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
                {t('selectKeyButton')}
            </button>
            <div className="mt-6 text-sm text-gray-500">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">
                    {t('billingInfo')}
                </a>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans relative">
      <LanguageSelector />
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-600">
            {t('appTitle')}
          </h1>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            {t('appSubtitle')}
          </p>
        </header>

        <div className="max-w-5xl mx-auto bg-gray-800/50 rounded-2xl shadow-lg p-6 md:p-8 backdrop-blur-sm border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
                <ImageUploader onImageUpload={handleImageUpload} currentImage={originalImage?.dataUrl ?? null} />
                
                {/* Analysis Result */}
                {(isAnalyzing || imageDescription) && (
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-sm">
                        <h3 className="font-semibold text-gray-300 mb-2 flex items-center gap-2">
                             <span className="material-symbols-outlined text-indigo-400">auto_awesome</span>
                             {t('aiAnalysisTitle')}
                        </h3>
                        {isAnalyzing ? (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Spinner /> {t('analyzing')}
                            </div>
                        ) : (
                            <p className="text-gray-400 italic leading-relaxed">"{imageDescription}"</p>
                        )}
                    </div>
                )}
            </div>
            
            <div className="flex flex-col space-y-6">
              <FormatSelector onSelectionChange={setSelectedFormats} />
              <button
                onClick={handleGenerate}
                disabled={!originalImage || selectedFormats.length === 0 || isLoading || isAnalyzing}
                className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center"
              >
                {isLoading ? <Spinner /> : t('generateButton')}
              </button>
            </div>
          </div>
        </div>

        {error && (
            <div className="text-center my-6 p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg max-w-4xl mx-auto">
                {error}
            </div>
        )}

        {isLoading && !generatedImages.length && (
            <div className="text-center my-10">
                <Spinner />
                <p className="mt-4 text-gray-400">{t('generatingStatus')}</p>
            </div>
        )}

        {generatedImages.length > 0 && (
          <ResultDisplay 
            images={generatedImages} 
            onEdit={(image) => setEditingImage(image)} 
          />
        )}
      </main>

      {editingImage && (
        <EditModal 
          image={editingImage}
          onClose={() => setEditingImage(null)}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
};

export default App;