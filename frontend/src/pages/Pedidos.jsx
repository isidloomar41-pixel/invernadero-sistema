import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import Buscador from "../components/Buscador";
import {
  alertaExito,
  alertaError,
  alertaAdvertencia,
  alertaInfo,
  confirmarEliminacion,
} from "../utils/alertas";

function Pedidos({ setPagina }) {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [productoId, setProductoId] = useState("");
  const [cantidad, setCantidad] = useState("");

  const [medioPago, setMedioPago] =
    useState("efectivo");

  const [tipoPago, setTipoPago] =
    useState("completo");

  const [pagado, setPagado] =
    useState("");

  const [clienteSeleccionado, setClienteSeleccionado] =
    useState(null);

  const [carrito, setCarrito] =
    useState([]);

  const [abonos, setAbonos] =
    useState({});

async function cargarDatos() {
  try {
    const [
      resClientes,
      resProductos,
      resPedidos,
    ] = await Promise.all([
      api.get("/clientes"),
      api.get("/productos"),
      api.get("/pedidos"),
    ]);

    setClientes(resClientes.data);
    setProductos(resProductos.data);
    setPedidos(resPedidos.data);
  } catch (error) {
    console.error(error);

    alertaError(
      "Error al actualizar datos"
    );
  }
}
  

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (clienteId) {
      const cliente = clientes.find(
        (c) => c.id === Number(clienteId)
      );

      setClienteSeleccionado(cliente);
    }
  }, [clienteId, clientes]);

  function agregarAlCarrito() {
    if (!productoId || !cantidad) {
     alertaAdvertencia(
  "Selecciona producto y cantidad"
);

      return;
    }

    const producto = productos.find(
      (p) => p.id === Number(productoId)
    );

    const cantidadSolicitada =
      Number(cantidad);

    if (
      cantidadSolicitada >
      Number(producto.stock)
    ) {
      alertaAdvertencia(
  `Solo hay ${producto.stock} disponibles`
);
      return;
    }

    const precioNormal =
      Number(producto.precio) *
      cantidadSolicitada;

    const descuento =
      cantidadSolicitada >= 30
        ? precioNormal * 0.1
        : 0;

    const subtotal =
      precioNormal - descuento;

    const nuevoItem = {
      producto_id: producto.id,
      nombre: producto.nombre,
      cantidad: cantidadSolicitada,
      precio: Number(producto.precio),
      descuento,
      subtotal,
    };

    setCarrito([
      ...carrito,
      nuevoItem,
    ]);

    console.log("NUEVO ITEM", nuevoItem);
    console.log("CARRITO ACTUAL", carrito);

    setProductoId("");
    setCantidad("");
  }

  async function eliminarDelCarrito(index) {
  const confirmar =
    await confirmarEliminacion(
      "¿Deseas quitar este producto del pedido?"
    );

  if (!confirmar) return;

  setCarrito(
    carrito.filter(
      (_, i) => i !== index
    )
  );

  alertaExito(
    "Producto eliminado del carrito"
  );
}

async function crearPedido(e) {
  e.preventDefault();

  alert("ENTRO A CREAR PEDIDO");

  console.log("ENTRO A CREAR PEDIDO");
  console.log("CLIENTE:", clienteId);
  console.log("CARRITO:", carrito);

  if (!clienteId) {
    alertaAdvertencia(
      "Selecciona un cliente"
    );
    return;
  }

  if (carrito.length === 0) {
    alertaAdvertencia(
      "Agrega productos al pedido"
    );
    return;
  }
console.log("ANTES DEL POST");
try {
  await api.post("/pedidos", {
    cliente_id: clienteId,
    medio_pago: medioPago,
    tipo_pago: tipoPago,
    pagado: Number(pagado) || 0,
    productos: carrito.map((item) => ({
      producto_id: item.producto_id,
      cantidad: item.cantidad,
    })),
  });

  console.log("POST EXITOSO");

  await cargarDatos();

  setClienteId("");
  setProductoId("");
  setCantidad("");
  setPagado("");
  setCarrito([]);
  setClienteSeleccionado(null);

  await alertaExito(
    "Pedido creado correctamente"
  );

} catch (error) {
  console.log("ERROR COMPLETO:", error);

  console.log(
    "RESPUESTA:",
    error.response?.data
  );

  alertaError(
    error.response?.data?.error ||
    error.response?.data?.mensaje ||
    "Error al crear pedido"
  );
}
}
  async function registrarAbono(
    pedidoId
  ) {
    try {
      const cantidad =
        Number(abonos[pedidoId]) || 0;

      if (cantidad <= 0) {
        alertaAdvertencia(
  "Ingresa una cantidad válida"
);

        return;
      }

      await api.put(
        `/pedidos/${pedidoId}/abonar`,
        {
          cantidad,
        }
      );
await alertaExito(
  "Abono registrado correctamente"
);
    setAbonos({
  ...abonos,
  [pedidoId]: "",
});

await cargarDatos();
    } catch (error) {
      alertaError(
  error.response?.data?.error ||
    "Error al registrar abono"
);
    }
  }

  const pedidosFiltrados = pedidos.filter((pedido) => {
  const texto = busqueda.toLowerCase();

  return (
    String(pedido.id).includes(texto) ||
    pedido.cliente?.toLowerCase().includes(texto) ||
    pedido.estado?.toLowerCase().includes(texto) ||
    pedido.medio_pago?.toLowerCase().includes(texto) ||
    pedido.tipo_pago?.toLowerCase().includes(texto) ||
    new Date(pedido.fecha)
      .toLocaleDateString()
      .includes(texto)
  );
});
  console.log("CARRITO", carrito);
 const total = carrito.reduce((suma, item) => {
  return suma + Number(item.subtotal || 0);
}, 0);

const cantidadPagada = Number(pagado) || 0;

const restante = Math.max(total - cantidadPagada, 0);

  return (
    <MainLayout setPagina={setPagina}>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={4}
      >
        Pedidos
      </Typography>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 4,
        }}
      >
        <form onSubmit={crearPedido}>
         <Grid
  container
  spacing={2}
  alignItems="stretch"
>
            {/* CLIENTE */}
                <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
  <Select
    value={clienteId}
    displayEmpty
    onChange={(e) => setClienteId(e.target.value)}
  >
    <MenuItem value="">
      Selecciona un cliente
    </MenuItem>
  
                  {clientes.map(
                    (cliente) => (
                      <MenuItem
                        key={cliente.id}
                        value={cliente.id}
                      >
                        {cliente.nombre}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* INFO CLIENTE */}
            {clienteSeleccionado && (
                  <Grid item xs={12} sm={6} md={3}>
                  <Alert severity="info">
                  Tipo:
                  {" "}
                  {
                    clienteSeleccionado.tipo_cliente
                  }
                  <br />
                  Deuda actual:
                  {" "}
                  $
                  {Number(
                    clienteSeleccionado.deuda_total
                  ).toFixed(2)}
                </Alert>
              </Grid>
            )}

            {/* MEDIO */}
                <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                <InputLabel>
                  Medio de pago
                </InputLabel>

                <Select
                  value={medioPago}
                  label="Medio de pago"
                  onChange={(e) =>
                    setMedioPago(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="efectivo">
                    Efectivo
                  </MenuItem>

                  <MenuItem value="transferencia">
                    Transferencia
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* TIPO */}
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>
                  Tipo
                </InputLabel>

                <Select
                  value={tipoPago}
                  label="Tipo"
                  onChange={(e) =>
                    setTipoPago(
                      e.target.value
                    )
                  }
                >
                  <MenuItem value="completo">
                    Completo
                  </MenuItem>

                  <MenuItem value="apartado">
                    Apartado
                  </MenuItem>

                  <MenuItem value="fiado">
                    Fiado
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* PRODUCTO */}
            <Grid item xs={12}>
              <FormControl fullWidth>
  <Select
    value={productoId}
    displayEmpty
    onChange={(e) => setProductoId(e.target.value)}
  >
    <MenuItem value="">
      Selecciona un producto
    </MenuItem>
 
                  {productos.map(
                    (producto) => (
                      <MenuItem
                        key={producto.id}
                        value={producto.id}
                      >
                        {producto.nombre}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Grid>

            {/* CANTIDAD */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad"
                value={cantidad}
                onChange={(e) =>
                  setCantidad(
                    e.target.value
                  )
                }
              />
            </Grid>

            {/* AGREGAR */}
            <Grid item xs={12} sm={4}>
  <Button
  type="button"
    fullWidth
    variant="contained"
    onClick={agregarAlCarrito}
    sx={{
      height: 56,
      borderRadius: 3,
      fontWeight: "bold",
      fontSize: "1rem",
      background:
        "linear-gradient(45deg,#1976d2,#42a5f5)",
      boxShadow: 4,
      "&:hover": {
        background:
          "linear-gradient(45deg,#1565c0,#1e88e5)",
      },
    }}
  >
    AGREGAR
  </Button>
</Grid>

            {/* PAGADO */}
              <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Cantidad pagada"
                value={pagado}
                onChange={(e) =>
                  setPagado(
                    e.target.value
                  )
                }
              />
            </Grid>
          </Grid>

          {/* TABLA */}
          <Typography
            variant="h5"
            mt={4}
            mb={2}
          >
            Productos del pedido
          </Typography>

          <TableContainer
            component={Paper}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    Producto
                  </TableCell>

                  <TableCell>
                    Cantidad
                  </TableCell>

                  <TableCell>
                    Precio
                  </TableCell>

                  <TableCell>
                    Descuento
                  </TableCell>

                  <TableCell>
                    Subtotal
                  </TableCell>

                  <TableCell>
                    Acción
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {carrito.map(
                  (item, index) => (
                    <TableRow
                      key={index}
                    >
                      <TableCell>
                        {item.nombre}
                      </TableCell>

                      <TableCell>
                        {item.cantidad}
                      </TableCell>

                      <TableCell>
                        $
                        {item.precio}
                      </TableCell>

                      <TableCell>
                        $
                        {item.descuento.toFixed(
                          2
                        )}
                      </TableCell>

                      <TableCell>
                        $
                        {item.subtotal.toFixed(
                          2
                        )}
                      </TableCell>

                      <TableCell>
                        <Button
                          color="error"
                          variant="contained"
                          onClick={() =>
                            eliminarDelCarrito(
                              index
                            )
                          }
                        >
                          QUITAR
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* TOTALES */}
          <Grid
            container
            spacing={2}
            mt={2}
          >
            <Grid item>
              <Paper
              elevation={4}
              sx={{
               p: 3,
               borderRadius: 3,
              textAlign: "center",
               height: "100%",
  }}
>
                <Typography>
                  Total:
                </Typography>

                <Typography variant="h4">
                  $
                  {total.toFixed(2)}
                </Typography>
              </Paper>
            </Grid>

            <Grid item>
              <Paper sx={{ p: 2 }}>
                <Typography>
                  Pagado:
                </Typography>

                <Typography variant="h4">
                  $
                  {(
                    Number(
                      pagado
                    ) || 0
                  ).toFixed(2)}
                </Typography>
              </Paper>
            </Grid>

            <Grid item>
              <Paper sx={{ p: 2 }}>
                <Typography>
                  Restante:
                </Typography>

                <Typography
                  variant="h4"
                  color={
                    restante > 0
                      ? "error"
                      : "green"
                  }
                >
                  $
                  {restante.toFixed(
                    2
                  )}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

       <Button
  type="submit"
  variant="contained"
  size="large"
  sx={{
    mt: 4,
    px: 5,
    py: 1.5,
    borderRadius: 3,
    fontWeight: "bold",
    fontSize: "1rem",
    background:
      "linear-gradient(45deg,#2e7d32,#4caf50)",
    boxShadow: 4,
    "&:hover": {
      background:
        "linear-gradient(45deg,#1b5e20,#43a047)",
    },
  }}
>
  CREAR PEDIDO
</Button>
        </form>
      </Paper>
            
      {/* PEDIDOS */}
      <Typography
        variant="h4"
        mb={2}
      >
        Pedidos registrados
      </Typography>
<Paper sx={{ p: 2, mb: 2, borderRadius: 4 }}>
  <Buscador
    value={busqueda}
    onChange={setBusqueda}
    label="Buscar por ID, cliente, estado, fecha o tipo de pago..."
  />
</Paper>
      <TableContainer
        component={Paper}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                Cliente
              </TableCell>

              <TableCell>
                Total
              </TableCell>

              <TableCell>
                Pagado
              </TableCell>

              <TableCell>
                Restante
              </TableCell>

              <TableCell>
                Estado
              </TableCell>

              <TableCell>
                Fecha
              </TableCell>

              <TableCell>
                Abonar
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {pedidosFiltrados.map(
              (pedido) => (
                <TableRow
                  key={pedido.id}
                >
                  <TableCell>
                    {pedido.cliente}
                  </TableCell>

                  <TableCell>
                    $
                    {pedido.total}
                  </TableCell>

                  <TableCell>
                    $
                    {pedido.pagado}
                  </TableCell>

                  <TableCell>
                    $
                    {pedido.restante}
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={
                        pedido.estado
                      }
                      color={
                        pedido.estado ===
                        "entregado"
                          ? "success"
                          : pedido.estado ===
                              "fiado"
                            ? "error"
                            : "warning"
                      }
                    />
                  </TableCell>

                  <TableCell>
                    {new Date(
                      pedido.fecha
                    ).toLocaleString()}
                  </TableCell>

                  <TableCell>
                    {Number(
                      pedido.restante
                    ) > 0 && (
                      <>
                        <TextField
                          size="small"
                          type="number"
                          placeholder="Abono"
                          value={
                            abonos[
                              pedido.id
                            ] || ""
                          }
                          onChange={(
                            e
                          ) =>
                            setAbonos({
                              ...abonos,
                              [pedido.id]:
                                e.target
                                  .value,
                            })
                          }
                        />

                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            mt: 1,
                          }}
                          onClick={() =>
                            registrarAbono(
                              pedido.id
                            )
                          }
                        >
                          PAGAR
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </MainLayout>
    );
}

export default Pedidos;