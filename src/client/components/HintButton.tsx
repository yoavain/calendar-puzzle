import React from 'react';
import Button from '@mui/material/Button';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
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
        <Button
            variant="contained"
            color="secondary"
            onClick={onHint}
            disabled={disabled}
            loading={isLoading}
            loadingPosition="start"
            startIcon={<LightbulbIcon />}
            size="small"
        >
            {isLoading ? 'Getting hint...' : 'Hint'}
        </Button>
    );
};
