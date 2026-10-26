import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SiteNewsletter from "@/components/thedot/SiteNewsletter";
import { RouteDot } from "@/components/brand/dot";

const Layout = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <RouteDot />
    <main className="flex-1 pt-16 lg:pt-20">{children}</main>
    <SiteNewsletter />
    <Footer />
  </div>
);

export default Layout;
