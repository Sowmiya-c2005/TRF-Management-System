import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div style={{
      width: "250px",
      height: "100vh",
      background: "#1e293b",
      color: "white",
      padding: "20px"
    }}>
      <h2>TRF Portal</h2>

      <p><Link to="/">Dashboard</Link></p>
      <p><Link to="/create">Create TRF</Link></p>
      <p><Link to="/search">Search TRF</Link></p>
      <p><Link to="/all">All TRFs</Link></p>
      <p><Link to="/upload">Upload Files</Link></p>
    <p><Link to="/files">File Manager</Link></p>
    <p>
  <Link to="/update">
    Update TRF
  </Link>
</p>
</div>
  );
}

export default Sidebar;