import fetch from "node-fetch";

async function seed() {
  const adminData = {
    name: "Admin User",
    email: "admin@swtech.com",
    password: "adminpassword123"
  };

  try {
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminData)
    });
    const data = await res.json();
    console.log("Seed result:", data);
  } catch (err) {
    console.error("Seed failed (server might not be running yet):", err);
  }
}

seed();
