import React from 'react';
import { useQueryParam } from '../hooks/useQueryParam';

interface SolutionButtonProps {
    onSolve: () => void;
    isLoading?: boolean;
}

export const SolutionButton: React.FC<SolutionButtonProps> = ({ onSolve, isLoading = false }) => {
    const showButton = useQueryParam('code');
    console.log('SolutionButton - showButton:', showButton);

    if (!showButton) {
        console.log('SolutionButton - Not rendering button');
        return null;
    }

    console.log('SolutionButton - Rendering button');
    return (
        <button
            onClick={onSolve}
            className="control-button"
            disabled={isLoading}
        >
            {isLoading ? 'Solving...' : 'Solution'}
        </button>
    );
};
