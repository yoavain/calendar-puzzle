import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

// Pieces container (the grid that holds all unplaced pieces)
export const PiecesContainer = styled(Box)(({ theme }) => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: 8,
    justifyItems: 'center',
    maxWidth: 1080,
    marginLeft: 'auto',
    marginRight: 'auto',
}));

// Individual piece wrapper in the pool
export const PiecePoolWrapper = styled(Box)(({ theme }) => ({
    position: 'relative',
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderRadius: 8,
    width: 250,
    height: 280,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
}));
