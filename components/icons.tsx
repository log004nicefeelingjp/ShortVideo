import React from 'react';

interface IconProps {
    className?: string;
}

export const PlayIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
    </svg>
);

export const PauseIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 00-.75.75v12c0 .414.336.75.75.75h2.25a.75.75 0 00.75-.75v-12a.75.75 0 00-.75-.75H6.75zm8.25 0a.75.75 0 00-.75.75v12c0 .414.336.75.75.75h2.25a.75.75 0 00.75-.75v-12a.75.75 0 00-.75-.75H15z" clipRule="evenodd" />
    </svg>
);

export const ChevronLeftIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
    </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
    </svg>
);

export const SparklesIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
        <path d="M5.26 17.242a.75.75 0 10-1.06-1.06 7.5 7.5 0 00-1.952 5.456.75.75 0 00.75.75h3a.75.75 0 00.75-.75 7.5 7.5 0 00-1.488-4.396z" />
    </svg>
);

export const SyncIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M15.312 5.085c-2.913-2.913-7.64-2.913-10.553 0s-2.913 7.64 0 10.553c2.812 2.812 7.3 2.903 10.222.282a.75.75 0 01.884 1.218A9.001 9.001 0 014.05 18.94a9.001 9.001 0 0112.24-13.064c1.23-1.18 2.92-1.855 4.71-1.855a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V3.79c-1.485 0-2.87.56-3.94 1.295zM19.95 5.06a9.001 9.001 0 01-12.24 13.064c-1.23 1.18-2.92 1.855-4.71 1.855a.75.75 0 01-.75-.75v-3a.75.75 0 011.5 0v2.015c1.485 0 2.87-.56 3.94-1.295 2.913-2.913 2.913-7.64 0-10.553c-2.812-2.812-7.3-2.903-10.222-.282a.75.75 0 01-.884-1.218A9.001 9.001 0 0119.95 5.06z" clipRule="evenodd" />
    </svg>
);