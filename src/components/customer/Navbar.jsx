import { useState } from 'react'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Container,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  AccountCircle,
  Home,
  Business,
  BookOnline,
  Share,
  Login,
  PersonAdd,
} from '@mui/icons-material'
import { logout } from '../store/slices/authSlice'

const Navbar = () => {
  // Mobile-only app - no desktop navbar needed
  return null

}

export default Navbar
