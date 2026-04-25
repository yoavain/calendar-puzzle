import React, { useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useUser } from "../context/UserContext";
import { HallOfFameModal } from "./HallOfFameModal";

export const UserMenu: React.FC = () => {
    const { user, logout } = useUser();
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
                <Avatar
                    src={user.avatarUrl || undefined}
                    alt={user.name || "User avatar"}
                    sx={(theme) => ({ width: 32, height: 32, fontSize: theme.game.fontSize.sm })}
                >
                    {initials}
                </Avatar>
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
                <MenuItem onClick={handleLogout}>
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
