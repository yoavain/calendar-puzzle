# Saved Game (Local Storage)

Persist game state to localStorage so players can resume their progress after page reload. Only the player's own progress is saved - after a revealed solution, no saved game is kept.

The code still uses the word "session" for this feature (`SessionData`, `useGameSession`, the storage key). The glossary calls it the saved game, because "session" also means the login session.

## Saved Game Data Model

```typescript
interface SessionData {
  date: PuzzleDate;      // { month, day }
  pieces: Piece[];       // Piece state (position, rotation, flips, isLocked, placedSeq)
  isSolved: boolean;     // Whether the player solved the puzzle
}
```

LocalStorage key: `calendar-puzzle-session`

## Saved Game Flow

```mermaid
flowchart TD
    Start[Page Load] --> Load[Load saved game from localStorage]
    Load --> Check{Saved game exists?}
    Check -->|No| Fresh[Initialize fresh game]
    Check -->|Yes| DateMatch{Puzzle date matches today's?}
    DateMatch -->|No| Fresh
    DateMatch -->|Yes| Restore[Restore board state from saved game]
    Fresh --> Render[Render game]
    Restore --> Render
    
    Render --> UserAction{Player action}
    UserAction -->|Place/move piece| Save[Save game]
    UserAction -->|Solve puzzle| SaveSolved[Save game with isSolved=true]
    UserAction -->|Click Show Solution| Clear[Clear saved game]
    UserAction -->|Change puzzle date| ClearDate[Clear saved game + fresh game]
    
    Save --> Render
    SaveSolved --> Render
    Clear --> Render
    ClearDate --> Render
```

## Behavior Summary

| Action | Saved Game Behavior |
|--------|---------------------|
| Place/move piece | Save game |
| Player solves puzzle | Save with `isSolved: true` |
| Click "Show Solution" | Clear saved game |
| Change puzzle date | Clear saved game |
| Page reload (puzzle date matches today's) | Restore saved game |
| Page reload (puzzle date differs) | Fresh game |

## Edge Cases

- **localStorage disabled**: All operations wrapped in try/catch, gracefully degrade to no persistence
- **Corrupted data**: `JSON.parse` in try/catch, return null on failure
- **Revealed solution**: Clear saved game, don't persist - the player starts fresh on reload
- **Hint used**: Hint pieces have `isLocked: true`, this is preserved in the saved game
