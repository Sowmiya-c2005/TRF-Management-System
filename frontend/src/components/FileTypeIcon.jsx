import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";

// PDF
import PictureAsPdfRoundedIcon    from "@mui/icons-material/PictureAsPdfRounded";
// Images
import ImageRoundedIcon           from "@mui/icons-material/ImageRounded";
// Spreadsheets / CSV
import TableChartRoundedIcon      from "@mui/icons-material/TableChartRounded";
// Word docs
import DescriptionRoundedIcon     from "@mui/icons-material/DescriptionRounded";
// CAD / drawings
import ArchitectureRoundedIcon    from "@mui/icons-material/ArchitectureRounded";
// Zip
import FolderZipRoundedIcon       from "@mui/icons-material/FolderZipRounded";
// Code
import CodeRoundedIcon            from "@mui/icons-material/CodeRounded";
// Text
import ArticleRoundedIcon         from "@mui/icons-material/ArticleRounded";
// Video
import VideocamRoundedIcon        from "@mui/icons-material/VideocamRounded";
// Audio
import AudiotrackRoundedIcon      from "@mui/icons-material/AudiotrackRounded";
// Presentation
import SlideshowRoundedIcon       from "@mui/icons-material/SlideshowRounded";
// Default
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFileRounded";

const FILE_MAP = {
  // PDFs
  pdf:  { icon: PictureAsPdfRoundedIcon, color: "#ef4444", bg: "#ef444415", label: "PDF" },
  // Images
  jpg:  { icon: ImageRoundedIcon, color: "#10b981", bg: "#10b98115", label: "JPEG" },
  jpeg: { icon: ImageRoundedIcon, color: "#10b981", bg: "#10b98115", label: "JPEG" },
  png:  { icon: ImageRoundedIcon, color: "#10b981", bg: "#10b98115", label: "PNG" },
  gif:  { icon: ImageRoundedIcon, color: "#10b981", bg: "#10b98115", label: "GIF" },
  svg:  { icon: ImageRoundedIcon, color: "#10b981", bg: "#10b98115", label: "SVG" },
  webp: { icon: ImageRoundedIcon, color: "#10b981", bg: "#10b98115", label: "WEBP" },
  // Spreadsheets
  xlsx: { icon: TableChartRoundedIcon, color: "#10b981", bg: "#10b98115", label: "Excel" },
  xls:  { icon: TableChartRoundedIcon, color: "#10b981", bg: "#10b98115", label: "Excel" },
  csv:  { icon: TableChartRoundedIcon, color: "#06b6d4", bg: "#06b6d415", label: "CSV" },
  // Word
  docx: { icon: DescriptionRoundedIcon, color: "#3b82f6", bg: "#3b82f615", label: "Word" },
  doc:  { icon: DescriptionRoundedIcon, color: "#3b82f6", bg: "#3b82f615", label: "Word" },
  // CAD
  dwg:  { icon: ArchitectureRoundedIcon, color: "#f59e0b", bg: "#f59e0b15", label: "CAD" },
  dxf:  { icon: ArchitectureRoundedIcon, color: "#f59e0b", bg: "#f59e0b15", label: "CAD" },
  // Zip
  zip:  { icon: FolderZipRoundedIcon, color: "#a855f7", bg: "#a855f715", label: "ZIP" },
  rar:  { icon: FolderZipRoundedIcon, color: "#a855f7", bg: "#a855f715", label: "RAR" },
  "7z": { icon: FolderZipRoundedIcon, color: "#a855f7", bg: "#a855f715", label: "7Z" },
  // Code
  js:   { icon: CodeRoundedIcon, color: "#f59e0b", bg: "#f59e0b15", label: "JS" },
  ts:   { icon: CodeRoundedIcon, color: "#3b82f6", bg: "#3b82f615", label: "TS" },
  py:   { icon: CodeRoundedIcon, color: "#10b981", bg: "#10b98115", label: "Python" },
  json: { icon: CodeRoundedIcon, color: "#06b6d4", bg: "#06b6d415", label: "JSON" },
  // Text
  txt:  { icon: ArticleRoundedIcon, color: "#94a3b8", bg: "#94a3b815", label: "TXT" },
  md:   { icon: ArticleRoundedIcon, color: "#94a3b8", bg: "#94a3b815", label: "MD" },
  // Video
  mp4:  { icon: VideocamRoundedIcon, color: "#ef4444", bg: "#ef444415", label: "MP4" },
  // Audio
  mp3:  { icon: AudiotrackRoundedIcon, color: "#a855f7", bg: "#a855f715", label: "MP3" },
  // Presentation
  pptx: { icon: SlideshowRoundedIcon, color: "#f59e0b", bg: "#f59e0b15", label: "PPT" },
  ppt:  { icon: SlideshowRoundedIcon, color: "#f59e0b", bg: "#f59e0b15", label: "PPT" },
};

/**
 * FileTypeIcon — renders a colored icon based on file extension
 *
 * Props:
 *   filename  — string (e.g. "document.pdf")
 *   size      — number (icon container size, default 36)
 *   fontSize  — number (icon svg size, default 18)
 *   showLabel — boolean (show extension label, default false)
 */
export default function FileTypeIcon({ filename = "", size = 36, fontSize = 18, showLabel = false }) {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const config = FILE_MAP[ext] || {
    icon: InsertDriveFileRoundedIcon, color: "#6366f1", bg: "#6366f115", label: ext.toUpperCase() || "FILE",
  };
  const IconComponent = config.icon;

  return (
    <Tooltip title={config.label} placement="top" arrow>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
        <Box sx={{
          width: size, height: size, borderRadius: `${size * 0.28}px`,
          background: config.bg,
          border: `1px solid ${config.color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <IconComponent sx={{ fontSize, color: config.color }} />
        </Box>
        {showLabel && (
          <Box sx={{
            fontSize: "0.55rem", fontWeight: 700, color: config.color,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {config.label}
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}
