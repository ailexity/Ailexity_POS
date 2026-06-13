import React from 'react';

const PageHeader = ({ icon: Icon, title, subtitle, children, className = '', actionsClassName = '' }) => {
  return (
    <>
      {/* Mobile-only branding line */}
      <div className="mobile-branding-bar">
        <span>Ailexity POS Powered by Ailexity</span>
      </div>
      
      {/* Standard header */}
      <div className={`header-section ${className}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {Icon && (
            <div className="w-8 h-8 flex items-center justify-center bg-indigo-600 shadow-sm flex-shrink-0">
              <Icon color="white" size={18} />
            </div>
          )}
          <div className="page-title min-w-0">
            <h1>{title}</h1>
            {subtitle && <p className="text-xs text-muted mt-1">{subtitle}</p>}
          </div>
        </div>
        {children && <div className={`flex items-center gap-2 flex-shrink-0 ${actionsClassName}`}>{children}</div>}
      </div>
    </>
  );
};

export default PageHeader;
