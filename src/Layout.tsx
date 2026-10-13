import { Outlet } from "react-router";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/Brand";

export default function Layout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <SiteFooter />
    </>
  );
}
