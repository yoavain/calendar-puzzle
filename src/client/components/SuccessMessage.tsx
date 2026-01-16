import React from 'react';

interface SuccessMessageProps {
    isVisible: boolean;
}

export const SuccessMessage: React.FC<SuccessMessageProps> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div className="success-message">
            <div className="success-content">
                <h2>Puzzle Solved! 🎉</h2>
                <p>Congratulations! You've completed today's puzzle.</p>
            </div>
        </div>
    );
};