import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Services from "./pages/Services";
import HowWeWork from "./pages/HowWeWork";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import OrdersGetStarted from "./pages/orders/GetStarted";
import OrdersDashboard from "./pages/orders/Dashboard";
import OrdersStorefront from "./pages/orders/Storefront";

import Insights from "./pages/Insights";
import Resources from "./pages/resources/Index";
import ResourcesSection from "./pages/resources/Section";
import ResourceArticle from "./pages/resources/Article";
import AdminKnowledgeCenter from "./pages/admin/KnowledgeCenter";
import AdminArticleEditor from "./pages/admin/ArticleEditor";

import Work from "./pages/Work";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import BackToTop from "./components/BackToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/services" element={<Services />} />
          <Route path="/how-we-work" element={<HowWeWork />} />
          <Route path="/products" element={<Products />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/get-started" element={<OrdersGetStarted />} />
          <Route path="/orders/dashboard" element={<OrdersDashboard />} />
          <Route path="/orders/store/:slug" element={<OrdersStorefront />} />

          <Route path="/insights" element={<Insights />} />

          <Route path="/work" element={<Work />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BackToTop />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
