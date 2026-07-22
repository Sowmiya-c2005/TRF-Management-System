/**
 * PaginationBar.jsx — Reusable Enterprise Pagination Control Component
 * Features: Page size selector (10, 15, 20, 50, 100), record summary counter,
 *           and MUI page navigation controls.
 */
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Pagination from "@mui/material/Pagination";

export default function PaginationBar({
  page = 1,
  pages = 1,
  total = 0,
  limit = 10,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 15, 20, 50, 100],
  isDark,
}) {
  const theme = useTheme();
  const dark = isDark !== undefined ? isDark : theme.palette.mode === "dark";

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  if (total === 0 && pages <= 1) return null;

  return (
    <Box
      sx={{
        display: "flex",
        justify: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
        mt: 3,
        pt: 2.5,
        borderTop: `1px solid ${dark ? "rgba(148,163,184,0.12)" : "rgba(148,163,184,0.20)"}`,
      }}
    >
      {/* ── Left: Page Size Selector & Summary ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ fontSize: "0.80rem", color: "text.secondary", fontWeight: 600 }}>
            Rows per page:
          </Typography>
          <FormControl size="small" variant="outlined">
            <Select
              value={limit}
              onChange={(e) => {
                const newLimit = Number(e.target.value);
                if (onLimitChange) onLimitChange(newLimit);
              }}
              sx={{
                fontSize: "0.80rem",
                fontWeight: 700,
                height: 32,
                borderRadius: "8px",
                background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
                },
              }}
            >
              {pageSizeOptions.map((opt) => (
                <MenuItem key={opt} value={opt} sx={{ fontSize: "0.80rem", fontWeight: 600 }}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Typography variant="body2" sx={{ fontSize: "0.80rem", color: "text.secondary", fontWeight: 500 }}>
          Showing <span style={{ fontWeight: 700, color: dark ? "#f1f5f9" : "#0f172a" }}>{start}–{end}</span> of{" "}
          <span style={{ fontWeight: 700, color: dark ? "#f1f5f9" : "#0f172a" }}>{total}</span> items
        </Typography>
      </Box>

      {/* ── Right: MUI Pagination Controls ── */}
      {pages > 1 && (
        <Pagination
          count={pages}
          page={page}
          onChange={(_, p) => {
            if (onPageChange) onPageChange(p);
          }}
          shape="rounded"
          size="medium"
          showFirstButton
          showLastButton
          sx={{
            "& .MuiPaginationItem-root": {
              fontSize: "0.82rem",
              fontWeight: 700,
              borderRadius: "8px",
              color: dark ? "#94a3b8" : "#475569",
              "&.Mui-selected": {
                background: "linear-gradient(135deg,#6366f1,#06b6d4)",
                color: "#ffffff",
                boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              },
            },
          }}
        />
      )}
    </Box>
  );
}
