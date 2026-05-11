import { useState, useEffect, FormEvent } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import { 
  Menu, X, Laptop, Shield, MessageSquare, Mail, 
  Send, User, Lock, Trash2, CheckCircle, Clock,
  Code2, Phone, MapPin, Search, ChevronRight,
  Monitor, Globe, Rocket, Users, Target, Zap,
  Facebook, Twitter, Instagram, Linkedin, Github
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

// --- Maps Configuration ---
const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const HAS_VALID_MAPS_KEY = Boolean(GOOGLE_MAPS_API_KEY) && 
                          GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY' && 
                          GOOGLE_MAPS_API_KEY.length > 30 &&
                          GOOGLE_MAPS_API_KEY.startsWith('AIza');

const MapsKeySplashScreen = () => (
  <div className="flex items-center justify-center h-[400px] bg-gray-100 rounded-3xl border-2 border-dashed border-gray-300 p-8 text-center">
    <div className="max-w-md space-y-4">
      <div className="bg-white p-4 rounded-full w-fit mx-auto shadow-sm">
        <MapPin className="h-8 w-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-gray-900">Google Maps API Key Required</h3>
      <p className="text-gray-600 text-sm">
        To see the map, please add a valid Google Maps API key as a secret in AI Studio.
        Ensure that the <strong>Maps JavaScript API</strong> is enabled in your Google Cloud Console.
      </p>
      <div className="bg-white p-6 rounded-2xl shadow-sm text-left space-y-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Setup Instructions</p>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>Get an API Key from Google Cloud Console</li>
          <li>Open <strong>Settings</strong> (⚙️) → <strong>Secrets</strong></li>
          <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
          <li>Paste your key and save</li>
        </ol>
      </div>
      <p className="text-xs text-gray-500 italic">The app rebuilds automatically after adding the secret.</p>
    </div>
  </div>
);

// --- Types ---
interface UserData {
  name: string;
  email: string;
  role: string;
}

// --- API Helper ---
const API_BASE = "/api";

async function apiFetch(endpoint: string, options: any = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
      return data;
    } else {
      // Not JSON, likely an HTML 404/500 page from the server or proxy
      const text = await res.text();
      const snippet = text.substring(0, 300).replace(/<[^>]*>/g, ' ').trim();
      console.error(`Non-JSON response from ${url}:`, text.substring(0, 500));
      throw new Error(`Server Error (${res.status}): ${snippet || 'Non-JSON response'}. Please ensure your Vercel environment variables are set.`);
    }
  } catch (err: any) {
    console.error(`API Fetch Error (${url}):`, err.message);
    throw err;
  }
}

// --- Components ---

const Navbar = ({ user, onLogout, onOpenQuote }: { user: UserData | null; onLogout: () => void; onOpenQuote: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white transition-transform group-hover:scale-105">
              <Code2 className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">
              SW<span className="text-blue-600">Tech</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-sm font-medium transition-colors hover:text-blue-600 text-gray-600"
              >
                {link.label}
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-blue-600">Admin</Link>
            )}
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link to="/profile" className="flex items-center space-x-1 text-gray-900 font-medium">
                  <User className="h-4 w-4" />
                  <span>{user.name}</span>
                </Link>
                <button 
                  onClick={onLogout}
                  className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-6">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600">Login</Link>
                <Link to="/register" className="text-sm font-medium text-gray-600 hover:text-blue-600 underline decoration-blue-200 underline-offset-4 font-bold">Register</Link>
                <button 
                  onClick={onOpenQuote}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all font-medium text-sm"
                >
                  Get a Free Quote
                </button>
              </div>
            )}
          </div>

          <button
            className="md:hidden p-2 -mr-2 text-gray-600"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden bg-white border-b border-gray-100"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-3 px-4 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {user?.role === "admin" && (
                <Link to="/admin" onClick={() => setIsOpen(false)} className="block py-3 px-4 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-50 transition-colors">Admin</Link>
              )}
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setIsOpen(false)} className="block py-3 px-4 rounded-lg text-base font-medium text-blue-600 hover:bg-blue-50 transition-colors">Profile ({user.name})</Link>
                  <button onClick={() => { onLogout(); setIsOpen(false); }} className="block w-full text-left py-3 px-4 rounded-lg text-base font-medium text-red-600 hover:bg-red-50 transition-colors">Logout</button>
                </>
              ) : (
                <div className="pt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/login" onClick={() => setIsOpen(false)} className="block py-3 px-4 rounded-lg text-base font-medium text-gray-600 hover:bg-gray-50 text-center border border-gray-100">Login</Link>
                    <Link to="/register" onClick={() => setIsOpen(false)} className="block py-3 px-4 rounded-lg text-base font-medium text-blue-600 hover:bg-blue-50 text-center border border-blue-50">Register</Link>
                  </div>
                  <button 
                    onClick={() => { onOpenQuote(); setIsOpen(false); }} 
                    className="block w-full bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-center"
                  >
                    Get a Free Quote
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await apiFetch("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setStatus({ type: "success", msg: res.message });
      setEmail("");
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  const footerLinks = [
    {
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Our Services", href: "/services" },
        { label: "Contact", href: "/contact" },
      ],
    },
    {
      title: "Services",
      links: [
        { label: "Web Development", href: "/services" },
        { label: "Web Design", href: "/services" },
        { label: "SEO Optimization", href: "/services" },
        { label: "E-Commerce", href: "/services" },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Code2 className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                SW<span className="text-blue-500">Tech</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Building fast, modern, and responsive websites that help businesses establish a strong online presence.
            </p>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-white">{section.title}</h4>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="text-gray-400 hover:text-blue-400 transition-colors text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-white">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-gray-400 text-sm">
                <MapPin className="h-5 w-5 text-blue-500 shrink-0" />
                <span>123 Tech Street, Silicon Valley, CA 94025</span>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Phone className="h-5 w-5 text-blue-500 shrink-0" />
                <a href="tel:+1234567890" className="hover:text-blue-400">+1 (234) 567-890</a>
              </li>
              <li className="flex items-center gap-3 text-gray-400 text-sm">
                <Mail className="h-5 w-5 text-blue-500 shrink-0" />
                <a href="mailto:info@swtech.com" className="hover:text-blue-400">info@swtech.com</a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-1">
            <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-white">Newsletter</h4>
            <p className="text-gray-400 text-sm mb-6">Subscribe to get the latest news and updates from SWTech.</p>
            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-1 top-1 bottom-1 bg-blue-600 text-white px-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {loading ? <Clock className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              {status && (
                <p className={`text-xs font-medium px-1 ${status.type === "success" ? "text-green-500" : "text-red-500"}`}>
                  {status.msg}
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-gray-500 text-xs">
          <p>© {currentYear} SW Technologies. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const Home = ({ onOpenQuote }: { onOpenQuote: () => void }) => {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-1/2 space-y-8 text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-bold border border-blue-100">
                <Zap className="h-4 w-4 fill-current" />
                <span>Modern Web Solutions</span>
              </div>
              <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1]">
                We Build Websites That <span className="text-blue-600">Drive Results</span>
              </h1>
              <p className="text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                SW Technologies helps businesses, startups, and entrepreneurs establish a strong online presence with fast, modern, and responsive websites tailored to your needs.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button 
                  onClick={onOpenQuote}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 text-center"
                >
                  Get a Free Quote
                </button>
                <Link to="/services" className="w-full sm:w-auto px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all text-center">
                  Explore Services
                </Link>
              </div>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:w-1/2 relative"
            >
              <div className="absolute -inset-4 bg-blue-100/50 rounded-[2.5rem] blur-2xl -z-10" />
              <img 
                src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800"
                alt="Modern workspace"
                className="rounded-3xl shadow-2xl border border-gray-100 lg:rotate-2 hover:rotate-0 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Comprehensive Web Solutions</h2>
            <p className="text-gray-600 text-lg">From design to deployment, we provide end-to-end web services to help your business thrive online.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: <Monitor className="h-6 w-6" />, title: "Web Design", desc: "Crafting beautiful, intuitive interfaces that engage and convert visitors." },
              { icon: <Code2 className="h-6 w-6" />, title: "Web Development", desc: "Building robust, scalable applications using the latest technologies." },
              { icon: <Globe className="h-6 w-6" />, title: "E-Commerce", desc: "Creating powerful online stores with seamless payment and management." },
              { icon: <Search className="h-6 w-6" />, title: "SEO & Marketing", desc: "Optimizing your online presence to reach more customers effectively." },
            ].map((service, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="group bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">{service.desc}</p>
                <Link to="/services" className="text-blue-600 font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all">
                  Learn More <ChevronRight className="h-4 w-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400"
                  alt="Team collaboration"
                  className="rounded-2xl shadow-lg border border-gray-100 -rotate-3"
                  referrerPolicy="no-referrer"
                />
                <img 
                  src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=400"
                  alt="Meeting"
                  className="rounded-2xl shadow-lg border border-gray-100 translate-y-8 rotate-3"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div className="lg:w-1/2 order-1 lg:order-2 space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl font-bold text-gray-900 tracking-tight">Your Success Is Our Priority</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  We combine technical expertise with creative excellence to deliver websites that not only look great but also perform exceptionally. Our client-first approach ensures your vision becomes reality.
                </p>
              </div>
              <div className="space-y-6">
                {[
                  { icon: <Target className="h-5 w-5" />, title: "Results-Driven", desc: "We focus on outcomes that grow your business." },
                  { icon: <Rocket className="h-5 w-5" />, title: "Fast Delivery", desc: "Efficient processes that get you online quicker." },
                  { icon: <Shield className="h-5 w-5" />, title: "Secure & Reliable", desc: "Top-tier security for your data and users." },
                ].map((strength, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                      {strength.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{strength.title}</h4>
                      <p className="text-gray-600 text-sm">{strength.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/about" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:gap-4 transition-all pt-4">
                More About Us <ChevronRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-100">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-20" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl opacity-20" />
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">Ready to Transform Your Online Presence?</h2>
              <p className="text-xl text-blue-100">Let's discuss your project and create something amazing together. Get a free consultation today.</p>
              <button 
                onClick={onOpenQuote}
                className="inline-block bg-white text-blue-600 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all"
              >
                Get a Free Quote
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const About = () => {
  return (
    <div className="pt-20">
      <section className="py-20 lg:py-32 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Crafting Digital Experiences Since <span className="text-blue-600 decoration-blue-200 underline decoration-8 underline-offset-8">2021</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              We're a passionate team of designers, developers, and strategists dedicated to helping businesses establish a powerful online presence.
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2 space-y-8">
              <h2 className="text-4xl font-bold text-gray-900 relative">
                From Passion to Purpose
                <span className="absolute -bottom-4 left-0 w-20 h-1.5 bg-blue-600 rounded-full" />
              </h2>
              <div className="space-y-6 text-gray-600 leading-relaxed text-lg">
                <p>
                  SW Technologies was founded in 2021 with a simple mission: to help businesses of all sizes succeed in the digital world. What started as a small team of passionate developers has grown into a full-service web development agency.
                </p>
                <p>
                  We believe that every business deserves a website that truly represents their brand and connects with their audience. That's why we take a personalized approach to every project, working closely with our clients to understand their unique needs and goals.
                </p>
                <p>
                  Today, we've helped over 30 businesses establish their online presence, completing more than 50 projects across various industries. Our commitment to quality, innovation, and client satisfaction remains at the heart of everything we do.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-8 py-8 border-y border-gray-100">
                <div>
                  <h4 className="text-4xl font-black text-blue-600 tracking-tighter">30+</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Clients Helped</p>
                </div>
                <div>
                  <h4 className="text-4xl font-black text-blue-600 tracking-tighter">50+</h4>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">Projects Done</p>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="relative group">
                <div className="absolute -inset-2 bg-blue-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-500" />
                <img 
                  src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&q=80&w=800"
                  alt="Workspace discussions"
                  className="relative rounded-3xl shadow-2xl border border-gray-200"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 opacity-10 blur-3xl pointer-events-none">
          <div className="bg-blue-600 w-64 h-64 rounded-full" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
          <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 hover:shadow-xl transition-shadow cursor-default">
            <h3 className="text-3xl font-bold text-gray-900 border-l-8 border-blue-600 pl-6">Our Mission</h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              To empower businesses with cutting-edge web solutions that drive growth, enhance brand visibility, and create meaningful connections with their audience. We strive to deliver exceptional value through innovative design, robust development, and strategic thinking.
            </p>
          </div>
          <div className="bg-white p-12 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 hover:shadow-xl transition-shadow cursor-default">
            <h3 className="text-3xl font-bold text-gray-900 border-l-8 border-blue-600 pl-6">Our Vision</h3>
            <p className="text-gray-600 leading-relaxed text-lg">
              To be the most trusted web development partner for businesses seeking digital transformation. We envision a world where every business, regardless of size, has access to professional, high-quality web solutions that help them compete and succeed in the digital marketplace.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

const Services = ({ onOpenQuote }: { onOpenQuote: (service?: string) => void }) => {
  const serviceList = [
    {
      title: "Web Design",
      desc: "We create stunning, user-centric designs that not only look beautiful but also provide an exceptional user experience on every device.",
      features: ["Custom UI/UX Design", "Responsive Web Design", "Brand Identity Integration", "Prototype & Wireframing"],
      icon: <Monitor className="h-6 w-6" />,
    },
    {
      title: "Web Development",
      desc: "Our developers build fast, secure, and scalable web applications using modern frameworks and standard coding practices.",
      features: ["Full-Stack Development", "Custom CMS Solutions", "Progressive Web Apps", "API Development & Integration"],
      icon: <Code2 className="h-6 w-6" />,
    },
    {
      title: "E-Commerce",
      desc: "Boost your sales with a high-performing online store designed to provide a secure and seamless shopping experience for your customers.",
      features: ["Store Setup & Config", "Payment Gateway Integration", "Inventory Management", "Shopping Cart Optimization"],
      icon: <Shield className="h-6 w-6" />,
    },
    {
      title: "SEO Optimization",
      desc: "Improve your search engine rankings and track your website's performance with our advanced SEO and data analytics solutions.",
      features: ["On-Page & Off-Page SEO", "Key Content Tracking", "Performance Audits", "Analytics Dashboard"],
      icon: <Target className="h-6 w-6" />,
    },
  ];

  return (
    <div className="pt-20">
      <section className="py-20 lg:py-32 bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight">
            Comprehensive <span className="text-blue-500">Web Solutions</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            From design to deployment and beyond, we provide end-to-end web services that help your business grow and succeed in the digital landscape.
          </p>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-20">
          {serviceList.map((service, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group p-10 lg:p-12 rounded-[2.5rem] border border-gray-100 bg-white shadow-sm hover:shadow-2xl transition-all space-y-8 flex flex-col justify-between"
            >
              <div className="space-y-8">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                    {service.icon}
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">{service.title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed text-lg font-medium">
                  {service.desc}
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {service.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                      <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-6">
                <button 
                  onClick={() => onOpenQuote(service.title)}
                  className="w-full bg-gray-50 text-blue-600 font-black py-4 rounded-2xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2 group/btn"
                >
                  Get a Free Quote
                  <ChevronRight className="h-5 w-5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <button 
            onClick={onOpenQuote}
            className="inline-flex items-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-100"
          >
            Get Started With a Free Quote
            <Rocket className="h-6 w-6" />
          </button>
        </div>
      </section>

      <section className="py-24 bg-blue-600 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="lg:w-1/2 space-y-12">
              <div className="space-y-4">
                <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight italic">Our Development Process</h2>
                <div className="w-24 h-2 bg-blue-400 rounded-full" />
              </div>
              <div className="space-y-12">
                {[
                  { step: "01", title: "Discovery", desc: "We learn about your business, goals, and target audience." },
                  { step: "02", title: "Design", desc: "Creating visual mockups and user flows for your approval." },
                  { step: "03", title: "Build", desc: "Turning designs into functional, high-performance code." },
                  { step: "04", title: "Launch", desc: "Final testing and deploying your site to the world." },
                ].map((s, i) => (
                  <div key={i} className="flex gap-8 group">
                    <span className="text-6xl font-black text-blue-400/30 group-hover:text-blue-200 transition-colors duration-500 leading-none">{s.step}</span>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold leading-none">{s.title}</h4>
                      <p className="text-blue-100 text-lg">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="bg-gray-900 rounded-[3.5rem] p-12 lg:p-16 border border-white/10 shadow-2xl space-y-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl" />
                <h3 className="text-3xl font-bold text-center border-b border-gray-800 pb-8">Built With Modern Tech</h3>
                <div className="grid grid-cols-2 gap-4">
                  {["React", "Next.js", "Tailwind CSS", "TypeScript", "Node.js", "Vite", "Firebase", "Lucide"].map((tech) => (
                    <div key={tech} className="bg-gray-800/50 backdrop-blur-sm p-5 rounded-2xl text-center font-bold text-gray-300 border border-gray-700 hover:border-blue-500 hover:text-white transition-all cursor-default">
                      {tech}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const Contact = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await apiFetch("/contact", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setStatus({ type: "success", msg: res.message });
      e.currentTarget.reset();
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20">
      <section className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Get in <span className="text-blue-600 underline underline-offset-8 decoration-blue-200">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Have a project in mind? Let's discuss how we can help your business grow online.
          </p>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5 space-y-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Contact Information</h2>
              <p className="text-gray-600 text-lg">
                Fill out the form and our team will get back to you within 24 hours.
              </p>
            </div>

            <div className="space-y-8">
              {[
                { icon: <Phone className="h-6 w-6 text-blue-600" />, title: "Call Us", content: "+1 (234) 567-890" },
                { icon: <Mail className="h-6 w-6 text-blue-600" />, title: "Email Us", content: "info@swtech.com" },
                { icon: <MapPin className="h-6 w-6 text-blue-600" />, title: "Visit Us", content: "123 Tech Street, Silicon Valley, CA 94025" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-gray-100 group-hover:bg-blue-600 group-hover:text-white transition-all cursor-default">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 uppercase tracking-widest text-xs mb-1">{item.title}</h4>
                    <p className="text-gray-600 font-medium">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-8 border-t border-gray-100">
              <h4 className="font-bold text-gray-900 mb-6">Connect With Us</h4>
              <div className="flex gap-4">
                {[
                  { icon: <Facebook className="h-5 w-5" />, label: "Facebook" },
                  { icon: <Twitter className="h-5 w-5" />, label: "Twitter" },
                  { icon: <Instagram className="h-5 w-5" />, label: "Instagram" },
                  { icon: <Linkedin className="h-5 w-5" />, label: "LinkedIn" },
                  { icon: <Github className="h-5 w-5" />, label: "GitHub" }
                ].map((social, i) => (
                  <div 
                    key={i} 
                    className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white cursor-pointer transition-all hover:scale-110 active:scale-95"
                    title={social.label}
                  >
                    {social.icon}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white p-8 lg:p-12 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                  <input name="name" required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                  <input name="email" type="email" required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium" placeholder="john@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Message</label>
                <textarea name="message" required className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-blue-100 outline-none transition-all h-40 font-medium resize-none" placeholder="How can we help you?" />
              </div>

              {status && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl font-bold flex items-center gap-3 ${status.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                >
                  <CheckCircle className="h-5 w-5" />
                  {status.msg}
                </motion.div>
              )}

              <button 
                disabled={loading}
                className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <Clock className="animate-spin h-6 w-6" /> : <><Send className="h-6 w-6" /><span>Send Message</span></>}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Our Location</h2>
            <p className="text-gray-600 text-lg">Come visit us at our Silicon Valley headquarters.</p>
          </div>
          
          <div className="h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 relative group">
            {!HAS_VALID_MAPS_KEY ? (
              <MapsKeySplashScreen />
            ) : (
              <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly">
                <Map
                  defaultCenter={{ lat: 37.422, lng: -122.084 }}
                  defaultZoom={14}
                  mapId="DEMO_MAP_ID"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  className="w-full h-full"
                  gestureHandling={'greedy'}
                  disableDefaultUI={false}
                >
                  <AdvancedMarker position={{ lat: 37.422, lng: -122.084 }}>
                    <Pin background={'#2563eb'} borderColor={'#1d4ed8'} glyphColor={'#fff'} />
                  </AdvancedMarker>
                </Map>
              </APIProvider>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

const Login = ({ onSuccess }: { onSuccess: (u: UserData, t: string) => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      onSuccess(res.user, res.token);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="text-blue-600 h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
          <p className="text-gray-500 mt-2">Login to manage your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input name="email" type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input name="password" type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

          <button 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? <Clock className="animate-spin h-5 w-5" /> : <span>Sign In</span>}
          </button>
        </form>

        <p className="text-center mt-8 text-gray-600">
          Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  );
};

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="bg-green-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <User className="text-green-600 h-8 w-8" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="text-gray-500 mt-2">Join SW Technologies today</p>
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-green-600 font-bold">Registration successful! Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input name="name" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input name="email" type="email" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input name="password" type="password" required className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>

            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

            <button 
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? <Clock className="animate-spin h-5 w-5" /> : <span>Register Now</span>}
            </button>
          </form>
        )}

        <p className="text-center mt-8 text-gray-600">
          Already have an account? <Link to="/login" className="text-blue-600 font-bold hover:underline">Login</Link>
        </p>
      </motion.div>
    </div>
  );
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState<"contacts" | "users" | "quotes" | "newsletter">("contacts");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/admin/${activeTab}`);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await apiFetch(`/admin/${activeTab}/${id}`, { method: "DELETE" });
      fetchData();
    } catch (err) {
      alert(`Deletion failed for ${activeTab}`);
    }
  };

  return (
    <div className="pt-32 pb-24 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-12">Admin Dashboard</h1>
        
        <div className="flex space-x-2 mb-8 bg-white p-1.5 rounded-2xl w-fit shadow-sm border border-gray-100 overflow-x-auto">
          {(["contacts", "users", "quotes", "newsletter"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "text-gray-500 hover:text-gray-900"}`}
            >
              {tab.charAt(0) + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-20 text-center text-gray-400 capitalize flex flex-col items-center gap-4">
              <Clock className="animate-spin h-8 w-8 text-blue-600" />
              Loading {activeTab}...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-5 font-bold text-gray-900 text-sm">ID</th>
                    {activeTab === "quotes" ? (
                      <>
                        <th className="px-6 py-5 font-bold text-gray-900 text-sm">Client Info</th>
                        <th className="px-6 py-5 font-bold text-gray-900 text-sm">Service & Budget</th>
                        <th className="px-6 py-5 font-bold text-gray-900 text-sm">Message</th>
                      </>
                    ) : activeTab === "users" ? (
                      <>
                        <th className="px-6 py-5 font-bold text-gray-900 text-sm">User</th>
                        <th className="px-6 py-5 font-bold text-gray-900 text-sm">Role</th>
                      </>
                    ) : activeTab === "contacts" ? (
                      <>
                        <th className="px-6 py-5 font-bold text-gray-900 text-sm">Contact</th>
                        <th className="px-6 py-5 font-bold text-gray-900 text-sm">Subject/Message</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-5 font-bold text-gray-900 text-sm">Subscription Email</th>
                      </>
                    )}
                    <th className="px-6 py-5 font-bold text-gray-900 text-sm">Date</th>
                    <th className="px-6 py-5 font-bold text-gray-900 text-sm text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-6 text-xs text-gray-400 font-mono">
                        {item.id.substring(0, 8)}...
                      </td>
                      
                      {activeTab === "quotes" && (
                        <>
                          <td className="px-6 py-6">
                            <div className="font-bold text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.email}</div>
                            <div className="text-xs text-blue-600 font-medium">{item.phone}</div>
                          </td>
                          <td className="px-6 py-6">
                            <div className="text-sm font-bold text-gray-800">{item.service_required}</div>
                            <div className="inline-flex mt-1 px-2 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-black uppercase tracking-wider">
                              Budget: {item.budget}
                            </div>
                          </td>
                          <td className="px-6 py-6 font-medium text-gray-600 text-xs italic max-w-xs leading-relaxed">
                             {item.message || "No special requirements"}
                          </td>
                        </>
                      )}

                      {activeTab === "users" && (
                        <>
                          <td className="px-6 py-6">
                            <div className="font-bold text-gray-900">{item.name || "Unnamed User"}</div>
                            <div className="text-xs text-gray-500">{item.email}</div>
                          </td>
                          <td className="px-6 py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.role === "admin" ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"}`}>
                              {item.role}
                            </span>
                          </td>
                        </>
                      )}

                      {activeTab === "contacts" && (
                        <>
                          <td className="px-6 py-6">
                            <div className="font-bold text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-500">{item.email}</div>
                          </td>
                          <td className="px-6 py-6 text-xs text-gray-600 leading-relaxed max-w-xs">
                             {item.message}
                          </td>
                        </>
                      )}

                      {activeTab === "newsletter" && (
                        <td className="px-6 py-6">
                          <div className="font-bold text-gray-900">{item.email}</div>
                          <div className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-1">Confirmed Subscriber</div>
                        </td>
                      )}

                      <td className="px-6 py-6 text-gray-500 text-xs whitespace-nowrap">
                        {item.created_at || item.subscribed_at ? new Date(item.created_at || item.subscribed_at).toLocaleString() : "-"}
                      </td>
                      
                      <td className="px-6 py-6 text-center">
                        <button 
                          onClick={() => handleDelete(item.id)} 
                          className="inline-flex items-center justify-center text-red-400 hover:text-red-600 p-2 rounded-xl hover:bg-red-50 transition-all group"
                          title="Delete entry"
                        >
                          <Trash2 className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-8 py-24 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                             <Trash2 className="h-6 w-6 text-gray-200" />
                          </div>
                          <span className="font-bold text-gray-300 uppercase tracking-widest text-sm">No {activeTab} Records found</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Profile = ({ user }: { user: UserData | null }) => {
  if (!user) return null;
  return (
    <div className="pt-32 pb-24 min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-12 text-center border border-gray-100">
        <div className="bg-blue-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-blue-200">
          <span className="text-4xl font-bold text-white">{user.name[0]}</span>
        </div>
        <h2 className="text-4xl font-extrabold text-gray-900 mb-2">{user.name}</h2>
        <p className="text-blue-600 font-bold uppercase tracking-wider mb-8 italic">{user.role}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div className="p-6 bg-gray-50 rounded-2xl">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Email Address</p>
            <p className="font-bold text-gray-900">{user.email}</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-2xl">
            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Account Type</p>
            <p className="font-bold text-gray-900 capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuoteModal = ({ isOpen, onClose, initialService }: { isOpen: boolean; onClose: () => void; initialService: string }) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await apiFetch("/quote", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setStatus({ type: "success", msg: res.message });
      setTimeout(() => {
        onClose();
        setStatus(null);
      }, 3000);
    } catch (err: any) {
      setStatus({ type: "error", msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all z-10"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-8 sm:p-12">
          {status?.type === "success" ? (
            <div className="py-20 text-center space-y-6">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-3xl font-black text-gray-900">Request Sent!</h3>
              <p className="text-gray-600 text-lg font-medium">{status.msg}</p>
            </div>
          ) : (
            <>
              <div className="mb-10">
                <h3 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Get a Free Quote</h3>
                <p className="text-gray-500 font-medium">Tell us about your project requirements.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                    <input name="name" required className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all font-semibold" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                    <input name="email" type="email" required className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all font-semibold" placeholder="john@example.com" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                    <input name="phone" required className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all font-semibold" placeholder="+1 (234) 567-890" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Service Required</label>
                    <select 
                      name="serviceRequired" 
                      required 
                      defaultValue={initialService}
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all font-semibold appearance-none"
                    >
                      <option value="">Select a service</option>
                      <option value="Web Design">Web Design</option>
                      <option value="Web Development">Web Development</option>
                      <option value="E-Commerce">E-Commerce</option>
                      <option value="SEO Optimization">SEO Optimization</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Budget Range</label>
                  <select name="budget" required className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all font-semibold appearance-none">
                    <option value="">Select your budget</option>
                    <option value="Less than $1,000">Less than $1,000</option>
                    <option value="$1,000 - $5,000">$1,000 - $5,000</option>
                    <option value="$5,000 - $10,000">$5,000 - $10,000</option>
                    <option value="$10,000+">$10,000+</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Message (Optional)</label>
                  <textarea name="message" className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all h-28 font-semibold resize-none" placeholder="Tell us more..." />
                </div>

                <button
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Submit Quote Request"}
                </button>

                {status?.type === "error" && (
                  <p className="text-red-500 text-sm font-bold text-center">{status.msg}</p>
                )}
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const u = await apiFetch("/auth/profile");
          setUser(u);
        } catch {
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleLogin = (u: UserData, t: string) => {
    localStorage.setItem("token", t);
    setUser(u);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const openQuoteModal = (service?: string) => setSelectedService(service || "");
  const closeQuoteModal = () => setSelectedService(null);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center text-blue-600 font-bold">SW Tech...</div>;

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-white">
        <Navbar user={user} onLogout={handleLogout} onOpenQuote={() => openQuoteModal()} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home onOpenQuote={() => openQuoteModal()} />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services onOpenQuote={openQuoteModal} />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login onSuccess={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Login onSuccess={handleLogin} />} />
            <Route path="/admin" element={user?.role === "admin" ? <Admin /> : <Home onOpenQuote={() => openQuoteModal()} />} />
            <Route path="*" element={<div className="pt-32 text-center">404 - Not Found</div>} />
          </Routes>
        </main>
        <Footer />

        <AnimatePresence>
          {selectedService !== null && (
            <QuoteModal 
              isOpen={true} 
              onClose={closeQuoteModal} 
              initialService={selectedService}
            />
          )}
        </AnimatePresence>
      </div>
    </Router>
  );
}
