import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import MapView from "@/components/MapView";

// shared shell: the map stays mounted while the panel changes between pages
export default function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>
        <Sidebar />
        <div id="panel">{children}</div>
        <MapView />
      </main>
    </>
  );
}
