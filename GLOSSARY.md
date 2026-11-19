# Calendar Puzzle

A web version of the physical calendar puzzle: the player arranges a fixed set of pieces on a board so that only the month and day of a chosen date stay uncovered. Logged-in players get hints, progress tracking and streaks.

## Language

### The puzzle

**Puzzle date**:
A month-and-day slot, such as Mar 14, with no year. There are 366 of them, and Feb 29 is always one. Any puzzle date can be played, not only today's.
_Avoid_: Daily puzzle, calendar date, day

**Board**:
The grid of labelled month cells and day cells on which pieces are placed. Some grid cells are unusable.

**Date cells**:
The month cell and the day cell of the current puzzle date. The pieces must leave exactly these two cells uncovered.
_Avoid_: Highlighted cells

**Piece**:
One of the fixed set of shapes the player places on the board. A piece can be rotated and flipped.

**Placement**:
A piece lying on the board at a position and orientation. The order in which pieces were placed is kept.

**Solved**:
A state of the board in which the pieces cover every usable cell except the date cells. Hint pieces count towards it.
_Avoid_: Completed, finished

**Solution**:
The one stored arrangement of all pieces that solves a puzzle date.

**Revealed solution**:
The solution shown to the player on request. It ends the attempt, and it is never recorded as a solve, so it earns no hint token and counts for no streak.
_Avoid_: Solved by solution button

### Hints

**Hint**:
One piece placed and locked on the board by the game, taken from the solution. Hints for a puzzle date come in a fixed order and are numbered from 1 to 7. The first hint on a puzzle date is free.
_Avoid_: Clue, tip

**Hint piece**:
A piece placed on the board by a hint. The player cannot move or undo it.
_Avoid_: Locked piece

**Hint token**:
The currency that pays for hints. A player earns one token for the first solve of each puzzle date and spends one for every hint after the first on a puzzle date. The balance is always derived, never stored.
_Avoid_: Credit, coin

### Progress and standing

**Played date**:
A puzzle date the player has started.

**Solved date**:
A puzzle date the player has solved at least once. Solving it again is a **replay**, which earns no further token.

**Streak**:
A run of consecutive solved dates, counted by puzzle date and not by the day the player solved them. Dec 31 is followed by Jan 1, and Feb 28 is followed by Mar 1. The **current streak** is the run that reaches today's or yesterday's date, and the **max streak** is the longest run ever.

**Year complete**:
The state in which all 366 puzzle dates are solved.

**Hall of Fame**:
The ranking of players by their activity: dates played, dates solved, and how many of each used a hint.

### Players and play

**Player**:
Anyone using the game.

**Logged-in player**:
A player who has signed in. Only logged-in players get hints, the revealed solution, tracked progress, streaks and a place in the Hall of Fame.
_Avoid_: Authenticated user, member

**Saved game**:
The in-progress board that the browser restores when the player returns. A revealed solution is never saved.
_Avoid_: Session (clashes with the login session)

**Layout**:
One of the three page arrangements of the game: desktop, mobile landscape and mobile portrait.
