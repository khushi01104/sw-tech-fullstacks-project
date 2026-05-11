import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Lazy initialization of Supabase
let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required. Please set them in the settings menu.");
    }
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

const JWT_SECRET = process.env.JWT_SECRET || "sw-tech-secret-key-2026";
const PORT = 3000;

const app = express();
app.use(cors());
app.use(express.json());

// --- Schemas ---
const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10),
});

const NewsletterSchema = z.object({
  email: z.string().email(),
});

const QuoteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  serviceRequired: z.string(),
  budget: z.string(),
  message: z.string().optional(),
});

// --- Auth Middleware ---
const logger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`${new Date().toISOString()} - [${req.method}] ${req.url}`);
  next();
};

app.use(logger);

const apiRouter = express.Router();

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// --- Seed Admin User ---
async function seedAdmin() {
  try {
    const supabase = getSupabase();
    const { data: existingAdmin, error: checkError } = await supabase
      .from("users")
      .select("*")
      .eq("email", "admin@swtech.com")
      .single();

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("adminpassword123", 10);
      const { error: insertError } = await supabase.from("users").insert({
        name: "Admin User",
        email: "admin@swtech.com",
        password: hashedPassword,
        role: "admin"
      });
      
      if (insertError) {
        console.error("Failed to insert admin user:", insertError);
      } else {
        console.log("Admin user seeded successfully");
      }
    }
  } catch (error: any) {
    if (error.message.includes("environment variables are required")) {
       console.log("Admin seeding skipped: Supabase credentials not set.");
    } else {
       console.error("Failed to seed admin user:", error);
    }
  }
}

// --- Routes ---
// 1. Auth ---
apiRouter.post("/auth/register", async (req, res) => {
  console.log("Registering user:", req.body.email);
  try {
    const supabase = getSupabase();
    const { name, email, password } = RegisterSchema.parse(req.body);
    
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = email === "admin@swtech.com" ? "admin" : "user";

    const { data, error } = await supabase.from("users").insert({
      name,
      email,
      password: hashedPassword,
      role
    }).select().single();

    if (error) throw error;
    res.status(201).json({ id: data.id, message: "User registered successfully" });
  } catch (error: any) {
    res.status(error.message.includes("environment variables") ? 500 : 400).json({ error: error.message });
  }
});

apiRouter.post("/auth/login", async (req, res) => {
  console.log("Login attempt:", req.body.email);
  try {
    const supabase = getSupabase();
    const { email, password } = req.body;
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !userData) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, userData.password);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: userData.id, name: userData.name, email: userData.email, role: userData.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { name: userData.name, email: userData.email, role: userData.role } });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/auth/profile", authenticateToken, (req: any, res) => {
  res.json(req.user);
});

// 2. Contact Form ---
apiRouter.post("/contact", async (req, res) => {
  console.log("Contact form submission:", req.body.email);
  try {
    const supabase = getSupabase();
    const data = ContactSchema.parse(req.body);
    const { error } = await supabase.from("contacts").insert(data);
    if (error) throw error;
    res.json({ message: "Message sent successfully!" });
  } catch (error: any) {
    res.status(error.message.includes("environment variables") ? 500 : 400).json({ error: error.message });
  }
});

// 3. Newsletter ---
apiRouter.post("/newsletter/subscribe", async (req, res) => {
  try {
    const supabase = getSupabase();
    const { email } = NewsletterSchema.parse(req.body);
    const { data: existing } = await supabase
      .from("newsletter")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return res.status(400).json({ message: "You are already subscribed" });
    }

    const { error } = await supabase.from("newsletter").insert({ email });
    if (error) throw error;
    res.json({ message: "Successfully subscribed to newsletter!" });
  } catch (error: any) {
    res.status(error.message.includes("environment variables") ? 500 : 400).json({ error: error.message });
  }
});

// 4. Quotes ---
apiRouter.post("/quote", async (req, res) => {
  try {
    const supabase = getSupabase();
    const data = QuoteSchema.parse(req.body);
    const { error } = await supabase.from("quotes").insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      service_required: data.serviceRequired,
      budget: data.budget,
      message: data.message
    });
    if (error) throw error;
    res.json({ message: "Quote request submitted successfully!" });
  } catch (error: any) {
    res.status(error.message.includes("environment variables") ? 500 : 400).json({ error: error.message });
  }
});

// 5. Admin Routes ---
apiRouter.get("/admin/contacts", authenticateToken, isAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/admin/contacts/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("contacts").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Contact deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/admin/users/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    // Prevent self-deletion
    if (req.params.id === (req as any).user.id) {
      return res.status(400).json({ error: "Cannot delete your own admin account" });
    }
    const { error } = await supabase.from("users").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "User deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/admin/users", authenticateToken, isAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, role, created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/admin/quotes", authenticateToken, isAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/admin/quotes/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("quotes").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Quote deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/admin/newsletter", authenticateToken, isAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("newsletter")
      .select("*")
      .order("subscribed_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.delete("/admin/newsletter/:id", authenticateToken, isAdmin, async (req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("newsletter").delete().eq("id", req.params.id);
    if (error) throw error;
    res.json({ message: "Subscription deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    env: process.env.NODE_ENV || "development",
    time: new Date().toISOString()
  });
});

// --- Middleware Setup ---
// Register API routes
app.use("/api", apiRouter);
// Also mount at / to handle cases where the /api prefix might be stripped by the deployment platform
app.use("/", apiRouter);

// API 404 handler
app.all("/api/*", (req, res) => {
  console.error(`API 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: "API endpoint not found", 
    method: req.method, 
    path: req.originalUrl 
  });
});

// --- Frontend Integration ---
async function testConnection() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      console.warn("Supabase connection check warning (tables might not exist):", error.message);
    } else {
      console.log("Supabase connection verified successfully.");
    }
  } catch (error: any) {
    if (error.message.includes("environment variables are required")) {
      console.log("Supabase connection check skipped: credentials not set.");
    } else {
      console.error("Supabase connection test failed:", error);
    }
  }
}

async function startServer() {
  console.log(`Starting server in ${process.env.NODE_ENV || 'development'} mode`);
  await testConnection();
  await seedAdmin();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;

// Only start the server and listen on a port if we're NOT on Vercel
if (!process.env.VERCEL) {
  startServer().catch(err => {
    console.error("CRITICAL: Failed to start server:", err);
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  });
}

