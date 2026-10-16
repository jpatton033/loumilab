import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { RouteDot } from "@/components/brand/dot";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <RouteDot />
    <main className="flex-1 pt-16 lg:pt-20">{children}</main>
    <Footer />
  </div>
);

export default Layout;
