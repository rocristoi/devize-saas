import React from 'react';
import { QuoteData } from '../types';
import { generateWebDeviz } from '../utils/webDevizGenerator';

interface DevizPreviewProps {
  data: QuoteData;
}

const DevizPreview: React.FC<DevizPreviewProps> = ({ data }) => {
  const html = generateWebDeviz(data);

  return (
    <div 
      className="bg-white dark:bg-gray-900 shadow-lg rounded-none p-8"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default DevizPreview; 