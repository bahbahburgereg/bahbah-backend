import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// =========================
// CORS
// =========================
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// =========================
// MongoDB
// =========================
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI غير موجود في Environment Variables");
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("🔥 تم الاتصال بقاعدة البيانات MongoDB بنجاح!"))
    .catch((err) => console.log("❌ خطأ في الاتصال:", err));
}

// =========================
// Category Schema
// =========================
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: Number,
    default: 0
  }
});

const Category = mongoose.model("Category", categorySchema);

// =========================
// Item Schema
// =========================
const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  // ⭐ الخصم
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  image: {
    type: String
  },

  description: {
    type: String
  },

  extras: {
    type: String
  },

  category: {
    type: String,
    required: true
  },

  type: {
    type: String,
    default: "normal"
  },

  maxItems: {
    type: Number
  },

  isOffer: {
    type: Boolean,
    default: false
  },

  order: {
    type: Number,
    default: 0
  },

  addons: [
    {
      name: String,
      price: Number
    }
  ],

  boxItems: [
    {
      name: String
    }
  ],

  sizes: [
    {
      name: String,
      price: Number
    }
  ]
});

const Item = mongoose.model("Item", itemSchema);

// =========================
// Delivery Zones
// =========================
const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  fee: {
    type: Number,
    required: true
  }
});

const DeliveryZone = mongoose.model("DeliveryZone", zoneSchema);

// =========================
// Settings
// =========================
const settingsSchema = new mongoose.Schema({
  heroImage: {
    type: String,
    default:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1920&auto=format&fit=crop"
  },

  heroTitleAr: {
    type: String,
    default: "أقوى العروض 🔥"
  },

  heroTitleEn: {
    type: String,
    default: "Strongest Offers 🔥"
  },

  logoImage: {
    type: String,
    default: ""
  },

  promoBannerImage: {
    type: String,
    default: ""
  }
});

const Settings = mongoose.model("Settings", settingsSchema);

// =========================
// SETTINGS
// =========================

app.get("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({});
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.put("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(req.body);
    } else {
      settings.heroImage =
        req.body.heroImage || settings.heroImage;

      settings.heroTitleAr =
        req.body.heroTitleAr || settings.heroTitleAr;

      settings.heroTitleEn =
        req.body.heroTitleEn || settings.heroTitleEn;

      settings.logoImage =
        req.body.logoImage !== undefined
          ? req.body.logoImage
          : settings.logoImage;

      settings.promoBannerImage =
        req.body.promoBannerImage !== undefined
          ? req.body.promoBannerImage
          : settings.promoBannerImage;
    }

    await settings.save();

    res.json(settings);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// DELIVERY ZONES
// =========================

app.get("/api/zones", async (req, res) => {
  try {
    const zones = await DeliveryZone.find();
    res.json(zones);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.post("/api/zones", async (req, res) => {
  try {
    const newZone = new DeliveryZone(req.body);
    const savedZone = await newZone.save();

    res.json(savedZone);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.delete("/api/zones/:id", async (req, res) => {
  try {
    await DeliveryZone.findByIdAndDelete(req.params.id);

    res.json({
      message: "تم مسح المنطقة بنجاح"
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// CATEGORIES
// =========================

app.get("/api/categories", async (req, res) => {
  try {
    const cats = await Category.find().sort({
      order: 1,
      _id: 1
    });

    res.json(cats);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    const count = await Category.countDocuments();

    const newCat = new Category({
      ...req.body,
      order: count
    });

    const savedCat = await newCat.save();

    res.json(savedCat);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  try {
    const updatedCat = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json(updatedCat);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);

    res.json({
      message: "تم مسح القسم بنجاح"
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// ITEMS
// =========================

// GET ALL ITEMS
app.get("/api/items", async (req, res) => {
  try {
    const items = await Item.find().sort({
      order: 1,
      _id: 1
    });

    res.json(items);
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// CREATE ITEM
// =========================

app.post("/api/items", async (req, res) => {
  try {
    const count = await Item.countDocuments({
      category: req.body.category
    });

    // ⭐ تحويل الخصم لرقم بشكل صريح
    const discountValue = Number(req.body.discount) || 0;

    const newItem = new Item({
      name: req.body.name,
      price: Number(req.body.price),

      // ⭐ الخصم بيتحفظ هنا صراحة
      discount: discountValue,

      image: req.body.image || "https://via.placeholder.com/400x300/222/FFD700?text=Bahbah+Burger",
      description: req.body.description,
      extras: req.body.extras,
      category: req.body.category,
      type: req.body.type || "normal",
      maxItems: req.body.maxItems
        ? Number(req.body.maxItems)
        : undefined,
      isOffer: Boolean(req.body.isOffer),
      order: count,
      addons: req.body.addons || [],
      boxItems: req.body.boxItems || [],
      sizes: req.body.sizes || []
    });

    const savedItem = await newItem.save();

    console.log(
      "✅ Item created:",
      savedItem.name,
      "| Discount:",
      savedItem.discount
    );

    res.json(savedItem);
  } catch (err) {
    console.error("❌ Create item error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// UPDATE ITEM
// =========================

app.put("/api/items/:id", async (req, res) => {
  try {
    // ⭐ الخصم بيتحول لرقم بشكل صريح
    const discountValue = Number(req.body.discount) || 0;

    const updateData = {
      ...req.body,

      price: Number(req.body.price),

      // ⭐ مهم جدًا
      discount: discountValue
    };

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      {
        $set: updateData
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedItem) {
      return res.status(404).json({
        error: "الصنف غير موجود"
      });
    }

    console.log(
      "✅ Item updated:",
      updatedItem.name,
      "| Discount:",
      updatedItem.discount
    );

    res.json(updatedItem);
  } catch (err) {
    console.error("❌ Update item error:", err);

    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// DELETE ITEM
// =========================

app.delete("/api/items/:id", async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);

    res.json({
      message: "تم مسح الصنف بنجاح"
    });
  } catch (err) {
    res.status(500).json({
      error: err.message
    });
  }
});

// =========================
// SERVER
// =========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `🚀 السيرفر شغال ومفتوح للجميع على البورت ${PORT}`
  );
});