import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "@/lib/router-shim";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "./pages/Home";
import About from "./pages/About";

import Projects from "./pages/Projects";
import Publications from "./pages/Publications";
import Insights from "./pages/Insights";
import PillarPage from "./pages/PillarPage";
import BlogPostPage from "./pages/BlogPostPage";
import ServiceLanding from "./pages/ServiceLanding";
import Solutions from "./pages/Solutions";
import Research from "./pages/Research";
import Contact from "./pages/Contact";
import AIContributors from "./pages/AIContributors";
import AIContributorProfilePage from "./pages/AIContributorProfilePage";
import Notebook from "./pages/Notebook";
import BusinessNotebook from "./pages/BusinessNotebook";
import AIUpdatesIndex from "./pages/AIUpdates";
import AIUpdateDetail from "./pages/AIUpdateDetail";
import Experience from "./pages/Experience";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          
          <Route path="/projects" element={<Projects />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/insights/:slug" element={<PillarPage />} />
          <Route path="/insights/:pillarSlug/:postSlug" element={<BlogPostPage />} />
          <Route path="/solutions" element={<Solutions />} />
          <Route path="/solutions/:slug" element={<ServiceLanding />} />
          <Route path="/research" element={<Research />} />
          <Route path="/notebook" element={<Notebook />} />
          <Route path="/notebook/ai" element={<AIContributors />} />
          <Route path="/notebook/ai/roadmap" element={<AIContributors />} />
          <Route path="/notebook/ai/encyclopedia" element={<AIContributors />} />
          <Route path="/notebook/business" element={<BusinessNotebook />} />
          <Route path="/ai-updates" element={<AIUpdatesIndex />} />
          <Route path="/ai-updates/:slug" element={<AIUpdateDetail />} />
          <Route path="/ai-contributors" element={<AIContributors />} />
          <Route path="/ai-contributors/:id" element={<AIContributorProfilePage />} />
          <Route path="/experience" element={<Experience />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
