import React from 'react';
import Button from '@mui/material/Button';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useQueryParam } from '../hooks/useQueryParam';

interface SolutionButtonProps {
    onSolve: () => void;
    isLoading?: boolean;
}

export const SolutionButton: React.FC<SolutionButtonProps> = ({ onSolve, isLoading = false }) => {
    const showButton = useQueryParam('code');

    if (!showButton) {
        return null;
    }

    return (
        <Button
            variant="contained"
            color="success"
            onClick={onSolve}
            loading={isLoading}
            loadingPosition="start"
            startIcon={<AutoFixHighIcon />}
            size="small"
        >
            {isLoading ? 'Solving...' : 'Solution'}
        </Button>
    );
};
