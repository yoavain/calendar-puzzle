import React from "react";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import { TokenCoin } from "./TokenCoin";
import { PlayerCell, RankList, RankMarker, Score } from "./HallOfFameModal.styled";
import { BalanceDivider, TokenBalance } from "./HintButton.styled";
import { FameHead, FamePreview, FameRow, HintPreview, MockHintButton } from "./FullSiteDialog.styled";
import { EMBED_COPY } from "../copy/embedCopy";
import { HINT_TOKEN_COPY } from "../copy/hintTokenCopy";

const copy = EMBED_COPY.dialog;

/**
 * Made-up rows. A signed-out player cannot read the Hall of Fame. The real one shows no names,
 * so these rows invent no people. `cells` is the left half and the middle column of a 5 x 5 identicon.
 */
const EXAMPLE_ROWS = [
    { days: 214, color: "#7b3fa0", cells: "011101110010101", isYou: false },
    { days: 158, color: "#2e7d5b", cells: "101010111110011", isYou: false },
    { days: 97, color: "#c2552d", cells: "010111101011100", isYou: true }
];

const EXAMPLE_TOKEN_BALANCE = 3;

/** Drawn here, so the preview asks no avatar service */
const Identicon: React.FC<{ cells: string; color: string }> = ({ cells, color }) => (
    <Avatar sx={{ width: 28, height: 28 }}>
        <svg viewBox="-1 -1 7 7" width="100%" height="100%" fill={color}>
            {Array.from({ length: 25 }, (_, index) => {
                const x = index % 5;
                const y = Math.floor(index / 5);
                return cells[y * 3 + Math.min(x, 4 - x)] === "1" && <rect key={index} x={x} y={y} width={1} height={1} />;
            })}
        </svg>
    </Avatar>
);

/** A picture of the Hall of Fame */
export const HallOfFamePreview: React.FC = () => (
    <FamePreview role="img" aria-label={copy.fameTitle}>
        <FameHead>
            <strong>{copy.fameTitle}</strong>
            <span>{copy.fameColumn}</span>
        </FameHead>
        <RankList>
            {EXAMPLE_ROWS.map((row, index) => (
                <FameRow key={row.days} isCurrentUser={row.isYou}>
                    <RankMarker rank={index + 1}>{index + 1}</RankMarker>
                    <Identicon cells={row.cells} color={row.color} />
                    <PlayerCell>{row.isYou && copy.fameYou}</PlayerCell>
                    <Score>{row.days}</Score>
                </FameRow>
            ))}
        </RankList>
    </FamePreview>
);

/** A picture of the Hint button with tokens on it, and how a player gets them */
export const HintButtonPreview: React.FC = () => (
    <HintPreview>
        <MockHintButton aria-hidden="true">
            <LightbulbIcon />
            {HINT_TOKEN_COPY.hintButton.token.label}
            <BalanceDivider />
            <TokenBalance>
                <TokenCoin />
                <span>{EXAMPLE_TOKEN_BALANCE}</span>
            </TokenBalance>
        </MockHintButton>
        {/* A new player starts with no token, so the number needs this line */}
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.35 }}>{copy.hintNote}</Typography>
    </HintPreview>
);
