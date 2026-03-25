import React from 'react';

const PageLoader = ({ message = 'Loading...', fullscreen = false, compact = false }) => {
    const className = [
        fullscreen ? 'page-loader-screen' : 'page-loader-container',
        compact ? 'page-loader-compact' : ''
    ].join(' ').trim();

    return (
        <div className={className} role="status" aria-live="polite">
            <div className="page-loader-spinner" />
            <p className="page-loader-text">{message}</p>
        </div>
    );
};

export default PageLoader;
