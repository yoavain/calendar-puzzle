import React from 'react';
import Button from '@mui/material/Button';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useUser } from '../context/UserContext';

interface SolutionButtonProps {
    onSolve: () => void;
    isLoading?: boolean;
}

export const SolutionButton: React.FC<SolutionButtonProps> = ({ onSolve, isLoading = false }) => {
    const { user } = useUser();

    if (!user || !user.isAdmin) {
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
