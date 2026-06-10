import { useState } from "react";

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  AppBar,
  Button,
  IconButton,
  useMediaQuery,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import InventoryIcon from "@mui/icons-material/Inventory";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ReceiptIcon from "@mui/icons-material/Receipt";
import LogoutIcon from "@mui/icons-material/Logout";
import BarChartIcon from "@mui/icons-material/BarChart";
import WarningIcon from "@mui/icons-material/Warning";
import GroupIcon from "@mui/icons-material/Group";
import NotificationsIcon from "@mui/icons-material/Notifications";
import BackupIcon from "@mui/icons-material/Backup";

const drawerWidth = 260;

function MainLayout({ children, setPagina }) {
  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const esMovil = useMediaQuery("(max-width:1024px)");

  const [open, setOpen] = useState(false);

  function cerrarSesion() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.reload();
  }

  const menu = [];

  if (usuario?.rol === "cliente") {
    menu.push(
      {
        texto: "Inicio",
        icono: <DashboardIcon />,
        pagina: "dashboard",
      },
      {
        texto: "Catálogo",
        icono: <InventoryIcon />,
        pagina: "catalogo",
      },
      {
        texto: "Solicitar pedido",
        icono: <ShoppingCartIcon />,
        pagina: "catalogo",
      },
      {
        texto: "Mis notas",
        icono: <ReceiptIcon />,
        pagina: "notas",
      }
    );
  } else {
    menu.push(
      {
        texto: "Inicio",
        icono: <DashboardIcon />,
        pagina: "dashboard",
      },
      {
        texto: "Alertas",
        icono: <NotificationsIcon />,
        pagina: "alertas",
      },
      {
        texto: "Clientes",
        icono: <PeopleIcon />,
        pagina: "clientes",
      },
      {
        texto: "Flores / Productos",
        icono: <InventoryIcon />,
        pagina: "productos",
      },
      {
        texto: "Pedidos",
        icono: <ShoppingCartIcon />,
        pagina: "pedidos",
      },
      {
        texto: "Solicitudes",
        icono: <ShoppingCartIcon />,
        pagina: "solicitudes",
      },
      {
        texto: "Notas",
        icono: <ReceiptIcon />,
        pagina: "notas",
      }
    );

    if (
      usuario?.rol === "jefe" ||
      usuario?.rol === "encargado"
    ) {
      menu.push(
        {
          texto: "Inventario",
          icono: <InventoryIcon />,
          pagina: "inventario",
        },
        {
          texto: "Pérdidas",
          icono: <WarningIcon />,
          pagina: "perdidas",
        },
        {
          texto: "Reportes",
          icono: <BarChartIcon />,
          pagina: "reportes",
        }
      );
    }

    if (usuario?.rol === "jefe") {
      menu.push(
        {
          texto: "Usuarios",
          icono: <GroupIcon />,
          pagina: "usuarios",
        },
        {
          texto: "Respaldos",
          icono: <BackupIcon />,
          pagina: "respaldos",
        }
      );
    }
  }

  const drawer = (
    <>
      <Toolbar>
        <Typography
          variant="h5"
          fontWeight="bold"
          sx={{
            width: "100%",
            textAlign: "center",
          }}
        >
          🌿 Flora Nativa
        </Typography>
      </Toolbar>

      <List
        sx={{
          overflowY: "auto",
          height: "100%",
        }}
      >
        {menu.map((item, index) => (
          <ListItemButton
            key={index}
            onClick={() => {
              setPagina(item.pagina);

              if (esMovil) {
                setOpen(false);
              }
            }}
            sx={{
              color: "#FFF8F0",
              borderRadius: 2,
              mx: 1,
              mb: 0.5,

              "&:hover": {
                backgroundColor: "#8B5E4A",
              },
            }}
          >
            <ListItemIcon
              sx={{
                color: "#F2B8A0",
              }}
            >
              {item.icono}
            </ListItemIcon>

            <ListItemText primary={item.texto} />
          </ListItemButton>
        ))}
      </List>
    </>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: esMovil
            ? "100%"
            : `calc(100% - ${drawerWidth}px)`,

          ml: esMovil
            ? 0
            : `${drawerWidth}px`,

          backgroundColor: "#5A4438",
          color: "#FFF8F0",
        }}
      >
        <Toolbar>
          {esMovil && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            sx={{
              flexGrow: 1,
              fontWeight: "bold",
              fontSize: {
                xs: "0.95rem",
                sm: "1.1rem",
                md: "1.25rem",
              },
              textAlign: {
                xs: "center",
                md: "left",
              },
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Sistema Flora Nativa
          </Typography>

          <Typography
            sx={{
              mr: 2,
              display: {
                xs: "none",
                sm: "block",
              },
              fontSize: "0.9rem",
            }}
          >
            {usuario?.nombre?.split(" ")[0]} | {usuario?.rol}
          </Typography>

          <Button
            color="inherit"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={cerrarSesion}
            sx={{
              minWidth: "auto",
            }}
          >
            SALIR
          </Button>
        </Toolbar>
      </AppBar>

      {esMovil ? (
        <Drawer
          open={open}
          onClose={() => setOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: 240,
              backgroundColor: "#6F4E37",
              color: "#FFF8F0",
            },
          }}
        >
          {drawer}
        </Drawer>
      ) : (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#6F4E37",
              color: "#FFF8F0",
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100%",
          minHeight: "100vh",
          overflowX: "hidden",
          p: {
            xs: 1,
            sm: 2,
            md: 3,
          },
          backgroundColor: "#FFF8F0",
        }}
      >
        <Toolbar />

        <Box
          sx={{
            width: "100%",
            maxWidth: "1500px",
            mx: "auto",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default MainLayout;