import React from 'react';

interface LicenseWrapperProps {
  children: React.ReactNode;
}

const LicenseWrapper: React.FC<LicenseWrapperProps> = ({ children }) => {
  // License is always valid - no verification needed, just render children directly
  return <>{children}</>;
};

export default LicenseWrapper;
