require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Import models
const User = require("../src/models/User");
const Persona = require("../src/models/Persona");

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB for seeding");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Read JSON file
const readJSONFile = (filename) => {
  try {
    const filePath = path.join(__dirname, "..", "seed-data", filename);
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    return [];
  }
};

// Seed personas
const seedPersonas = async () => {
  try {
    console.log("🌱 Seeding predefined personas...");

    // Check if predefined personas already exist
    const existingPersonas = await Persona.countDocuments({
      isPredefined: true,
    });

    if (existingPersonas > 0) {
      console.log(
        `⚠️  Found ${existingPersonas} existing predefined personas. Skipping...`
      );
      return;
    }

    // Read personas data
    const personasData = readJSONFile("personas.json");

    if (personasData.length === 0) {
      console.log("⚠️  No persona data found to seed");
      return;
    }

    // Insert personas
    const personas = await Persona.insertMany(personasData);
    console.log(
      `✅ Successfully seeded ${personas.length} predefined personas`
    );

    // Display seeded personas
    personas.forEach((persona, index) => {
      console.log(
        `   ${index + 1}. ${persona.name} (${persona.demographics.age})`
      );
    });
  } catch (error) {
    console.error("❌ Error seeding personas:", error.message);
  }
};

// Create demo user for testing
const createDemoUser = async () => {
  try {
    console.log("🌱 Creating demo user...");

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: "demo@marketingllm.com" });

    if (existingUser) {
      console.log("⚠️  Demo user already exists. Skipping...");
      return existingUser;
    }

    // Create demo user
    const demoUser = new User({
      email: "demo@marketingllm.com",
      passwordHash: "Demo123!", // Will be hashed by pre-save middleware
      firstName: "Demo",
      lastName: "User",
      companyName: "Marketing LLM Demo",
      role: "manager",
      subscriptionTier: "pro",
    });

    await demoUser.save();
    console.log("✅ Demo user created successfully");
    console.log("   📧 Email: demo@marketingllm.com");
    console.log("   🔑 Password: Demo123!");

    return demoUser;
  } catch (error) {
    console.error("❌ Error creating demo user:", error.message);
    return null;
  }
};

// Main seeding function
const seedDatabase = async () => {
  try {
    console.log("🚀 Starting database seeding...");
    console.log("=".repeat(50));

    await connectDB();

    // Seed data
    await createDemoUser();
    await seedPersonas();

    console.log("=".repeat(50));
    console.log("✅ Database seeding completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Start the server: npm run dev");
    console.log("   2. Test with demo user: demo@marketingllm.com / Demo123!");
    console.log("   3. API documentation: http://localhost:5000/api");
  } catch (error) {
    console.error("❌ Database seeding failed:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);
  }
};

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes("--reset")) {
  console.log("⚠️  Resetting database...");
  mongoose.connection.once("open", async () => {
    await mongoose.connection.db.dropDatabase();
    console.log("✅ Database reset complete");
    await seedDatabase();
  });
  connectDB();
} else {
  seedDatabase();
}
