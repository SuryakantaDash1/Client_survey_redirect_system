import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemButton,
  Collapse
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as SurveyIcon,
  History as SessionIcon,
  CheckCircle as CompletedIcon,
  Cancel as TerminatedIcon,
  Block as QuotaIcon,
  ExpandLess,
  ExpandMore,
  AccountCircle,
  Logout,
  Menu as MenuIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(true);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSessionsClick = () => {
    setSessionsOpen(!sessionsOpen);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap>
          Survey Redirect
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {/* Dashboard */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname === '/dashboard'}
            onClick={() => navigate('/dashboard')}
          >
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        {/* Surveys */}
        <ListItem disablePadding>
          <ListItemButton
            selected={location.pathname.includes('/surveys')}
            onClick={() => navigate('/surveys')}
          >
            <ListItemIcon><SurveyIcon /></ListItemIcon>
            <ListItemText primary="Surveys" />
          </ListItemButton>
        </ListItem>

        {/* Sessions with submenu */}
        <ListItem disablePadding>
          <ListItemButton onClick={handleSessionsClick}>
            <ListItemIcon><SessionIcon /></ListItemIcon>
            <ListItemText primary="Sessions" />
            {sessionsOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={sessionsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === '/sessions'}
              onClick={() => navigate('/sessions')}
            >
              <ListItemIcon><SessionIcon /></ListItemIcon>
              <ListItemText primary="All Sessions" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === '/sessions/completed'}
              onClick={() => navigate('/sessions/completed')}
            >
              <ListItemIcon><CompletedIcon color="success" /></ListItemIcon>
              <ListItemText primary="Completed" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === '/sessions/terminated'}
              onClick={() => navigate('/sessions/terminated')}
            >
              <ListItemIcon><TerminatedIcon color="error" /></ListItemIcon>
              <ListItemText primary="Terminated" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={location.pathname === '/sessions/quota-full'}
              onClick={() => navigate('/sessions/quota-full')}
            >
              <ListItemIcon><QuotaIcon color="warning" /></ListItemIcon>
              <ListItemText primary="Quota Full" />
            </ListItemButton>
          </List>
        </Collapse>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {location.pathname.includes('dashboard') ? 'Dashboard' :
             location.pathname.includes('surveys') ? 'Surveys' :
             location.pathname.includes('sessions') ? 'Sessions' : 'Survey Redirect System'}
          </Typography>
          <div>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2">
                  {user?.name} ({user?.role})
                </Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;