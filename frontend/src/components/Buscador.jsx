import { TextField } from "@mui/material";

function Buscador({ value, onChange, label = "Buscar..." }) {
  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      sx={{ mb: 3 }}
    />
  );
}

export default Buscador;