import React, { useState } from "react";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import SsidChartIcon from "@mui/icons-material/SsidChart";
import { useUser } from "../context/UserContext";
import { AdminDashboardModal } from "./AdminDashboardModal";

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

    // Get initials from name
    const initials = user.name
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
            >
                <Avatar 
                    src={user.avatarUrl || undefined} 
                    sx={{ width: 32, height: 32, fontSize: "0.875rem" }}
                >
                    {initials}
                </Avatar>
            </Button>
            {user.isAdmin && (
                <Tooltip title="Users statistics">
                    <IconButton 
                        onClick={() => setDashboardOpen(true)}
                        size="small"
                        sx={{ 
                            ml: 1,
                            backgroundColor: "primary.main",
                            color: "primary.contrastText",
                            "&:hover": {
                                backgroundColor: "primary.dark"
                            }
                        }}
                    >
                        <SsidChartIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            )}
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
            >
                <MenuItem disabled>
                    {user.email}
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                    Logout
                </MenuItem>
            </Menu>
            <AdminDashboardModal 
                open={dashboardOpen} 
                onClose={() => setDashboardOpen(false)} 
            />
        </>
    );
};
