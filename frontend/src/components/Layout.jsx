import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div>
      <Navbar />

      <div style={{ display: "flex" }}>
        <Sidebar />

        <div
          style={{
            padding: "20px",
            flex: 1
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default Layout;