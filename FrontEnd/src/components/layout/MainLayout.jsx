import { useState } from 'react'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { ROUTES } from '../../app/routes'

const navActionSx = {
  position: 'relative',
  px: 0.5,
  minWidth: 'auto',
  textTransform: 'none',
  fontSize: '0.98rem',
  fontWeight: 600,
  marginLeft: 1,
  marginRight: 3,
  color: '#374151',
  '&:hover': {
    backgroundColor: 'transparent',
    color: '#111827',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    left: '50%',
    bottom: '4px',
    width: 0,
    height: '2px',
    bgcolor: '#111827',
    transform: 'translateX(-50%)',
    transition: 'width .2s ease',
  },
  '&:hover::after': {
    width: '100%',
  },
}

const navActionActiveSx = {
  color: '#111827',
  '&::after': {
    width: '100%',
  },
}

const userButtonSx = {
  textTransform: 'none',
  color: '#111827',
  fontWeight: 700,
  marginLeft: 3,
}

export function MainLayout({
  children,
  onNavigate,
  onLogout,
  onDeleteAccount,
  currentRoute,
  currentUser,
  variant = 'default',
}) {
  const [anchorEl, setAnchorEl] = useState(null)
  const menuOpen = Boolean(anchorEl)

  function handleOpenMenu(event) {
    setAnchorEl(event.currentTarget)
  }

  function handleCloseMenu() {
    setAnchorEl(null)
  }

  function handleLogout() {
    handleCloseMenu()
    onLogout?.()
  }

  function handleDeleteAccount() {
    handleCloseMenu()
    onDeleteAccount?.()
  }

  return (
    <div className={`layout ${variant === 'register' ? 'layout--register' : ''}`}>
      <header className='navbar'>
        <Button
          variant='text'
          className='navbar__brand'
          onClick={() => onNavigate?.(ROUTES.home)}
          disableRipple
          sx={{
            textTransform: 'none',
            fontSize: '1.5rem',
            fontWeight: 1000,
            color: '#111827',
            '&:hover': {
              backgroundColor: 'transparent',
              color: '#031949',
            },
          }}
        >
          NetWifi
        </Button>

        <div className='navbar__center'>
          <Button
            variant='text'
            disableRipple
            onClick={() => onNavigate?.(ROUTES.home)}
            sx={[navActionSx, currentRoute === ROUTES.home && navActionActiveSx]}
          >
            Home
          </Button>

          <Button
            variant='text'
            disableRipple
            onClick={() => onNavigate?.(ROUTES.wifiTest)}
            sx={[navActionSx, currentRoute === ROUTES.wifiTest && navActionActiveSx]}
          >
            Test Wifi
          </Button>
        </div>

        <div className='navbar__right'>
          {currentUser ? (
            <>
              <Button
                variant='text'
                onClick={handleOpenMenu}
                endIcon={<KeyboardArrowDownIcon />}
                sx={userButtonSx}
              >
                {currentUser.username}
              </Button>
              <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleCloseMenu}>
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
                <MenuItem onClick={handleDeleteAccount} sx={{ color: '#b91c1c' }}>
                  Borrar cuenta
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                variant='text'
                disableRipple
                onClick={() => onNavigate?.(ROUTES.login)}
                sx={[navActionSx, currentRoute === ROUTES.login && navActionActiveSx]}
              >
                Log In
              </Button>
              <Button
                variant='text'
                disableRipple
                onClick={() => onNavigate?.(ROUTES.register)}
                sx={[navActionSx, currentRoute === ROUTES.register && navActionActiveSx]}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </header>

      <main>{children}</main>
    </div>
  )
}
