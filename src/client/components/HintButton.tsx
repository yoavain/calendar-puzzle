import React from 'react';
import { useQueryParam } from '../hooks/useQueryParam';

interface HintButtonProps {
    onHint: () => void;
    isLoading?: boolean;
    disabled?: boolean;
}

export const HintButton: React.FC<HintButtonProps> = ({ onHint, isLoading = false, disabled = false }) => {
    const showButton = useQueryParam('code');

    if (!showButton) {
        return null;
    }

    return (
        <button
            onClick={onHint}
            className="control-button"
            disabled={isLoading || disabled}
        >
            {isLoading ? 'Getting hint...' : 'Hint'}
        </button>
    );
};
