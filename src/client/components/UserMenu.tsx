import React, { useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useUser } from "../context/UserContext";
import { hasCompletedAllDates } from "../../common/streakUtils";
import { HallOfFameModal } from "./HallOfFameModal";
import { CompletionBadge } from "./CompletionBadge";

/** Badge size on the avatar — small enough that it needs the simplified form. */
const AVATAR_BADGE_SIZE = 19;

export const UserMenu: React.FC = () => {
    const { user, logout, completedDates } = useUser();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [dashboardOpen, setDashboardOpen] = useState(false);
    const open = Boolean(anchorEl);

    if (!user) {
        return null;
    }

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleClose();
        await logout();
    };

    // Get initials from name or ID
    const nameOrId = user.name || user.id || "";
    const initials = nameOrId
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <>
            <Button
                onClick={handleClick}
                size="small"
                sx={{ minWidth: "auto", padding: "4px" }}
                aria-label="Open user menu"
            >
                <Badge
                    overlap="circular"
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    invisible={!hasCompletedAllDates(completedDates)}
                    badgeContent={
                        <CompletionBadge size={AVATAR_BADGE_SIZE} title="Solved every date" />
                    }
                    sx={(theme) => ({
                        "& .MuiBadge-badge": {
                            padding: 0,
                            minWidth: 0,
                            height: "auto",
                            backgroundColor: "transparent",
                            borderRadius: "50%",
                            border: `2px solid ${theme.palette.background.default}`
                        }
                    })}
                >
                    <Avatar
                        src={user.avatarUrl || undefined}
                        alt={user.name || "User avatar"}
                        sx={(theme) => ({ width: 32, height: 32, fontSize: theme.game.fontSize.sm })}
                    >
                        {initials}
                    </Avatar>
                </Badge>
            </Button>
            <Tooltip title="Hall of Fame">
                <span>
                    <IconButton 
                        onClick={() => setDashboardOpen(true)}
                        size="small"
                        aria-label="Hall of Fame"
                        sx={{ 
                            ml: 1,
                            backgroundColor: "primary.main",
                            color: "primary.contrastText",
                            "&:hover": {
                                backgroundColor: "primary.dark"
                            }
                        }}
                    >
                        <EmojiEventsIcon fontSize="small" />
                    </IconButton>
                </span>
            </Tooltip>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                {user.email && (
                    <MenuItem disabled>
                        {user.email}
                    </MenuItem>
                )}
                <MenuItem
                    onClick={() => {
                        handleLogout().catch(() => {});
                    }}
                >
                    Logout
                </MenuItem>
            </Menu>
            <HallOfFameModal 
                open={dashboardOpen} 
                onClose={() => setDashboardOpen(false)} 
            />
        </>
    );
};
