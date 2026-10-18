import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { promisify } from 'util';

dotenv.config();

const scrypt = promisify(crypto.scrypt);
const app = express();

// Railway شغال ورا proxy، ده عشان نعرف IP الزبون الحقيقي (بنستخدمه في الحماية من التكرار)
app.set('trust proxy', 1);

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
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// =========================
// Category Schema
// =========================
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  order: { type: Number, default: 0 }
});
const Category = mongoose.model("Category", categorySchema);

// =========================
// Item Schema
// =========================
const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  image: { type: String },
  description: { type: String },
  extras: { type: String },
  category: { type: String, required: true },
  type: { type: String, default: "normal" },
  maxItems: { type: Number },
  isOffer: { type: Boolean, default: false },
  available: { type: Boolean, default: true },
  order: { type: Number, default: 0 },

  // النظام القديم (متروك عشان الأصناف القديمة تفضل شغالة)
  addons: [{ name: String, price: Number }],
  boxItems: [{ name: String }],
  sizes: [{ name: String, price: Number }],

  // النظام الجديد: مجموعات التعديلات
  modifierGroups: [
    {
      name: String,
      min: Number,
      max: Number,
      options: [{ name: String, price: Number }]
    }
  ]
});
const Item = mongoose.model("Item", itemSchema);

// =========================
// Delivery Zones
// =========================
const zoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fee: { type: Number, required: true }
});
const DeliveryZone = mongoose.model("DeliveryZone", zoneSchema);

// =========================
// Settings
// =========================
const settingsSchema = new mongoose.Schema({
  heroImage: {
    type: String,
    default: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1920&auto=format&fit=crop"
  },
  heroTitleAr: { type: String, default: "أقوى العروض 🔥" },
  heroTitleEn: { type: String, default: "Strongest Offers 🔥" },
  logoImage: { type: String, default: "" },
  promoBannerImage: { type: String, default: "" }
});
const Settings = mongoose.model("Settings", settingsSchema);

// =========================
// Orders (شاشة الكاشير)
// =========================
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  orderType: { type: String, required: true },
  customerAddress: { type: String },
  zoneName: { type: String },
  deliveryFee: { type: Number, default: 0 },
  items: { type: Array, required: true },
  itemsTotal: { type: Number, required: true },
  grandTotal: { type: Number, required: true },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
  acceptedBy: { type: String },
  acceptedAt: { type: Date },
  completedBy: { type: String },
  completedAt: { type: Date }
});
const Order = mongoose.model("Order", orderSchema);

// تقفيلات الشيفتات
const shiftSchema = new mongoose.Schema({
  closedAt: { type: Date, default: Date.now },
  closedBy: { type: String },
  from: { type: Date },
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  delivery: { type: Number, default: 0 },
  orders: { type: Array, default: [] }
});
const Shift = mongoose.model("Shift", shiftSchema);

// =========================
// AUTH (الكاشير / الأدمن)
// =========================
const AUTH_SECRET = process.env.AUTH_SECRET || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_USERNAME = "admin";

const authReady = AUTH_SECRET.length >= 24 && ADMIN_PASSWORD.length >= 8;

if (!authReady) {
  console.error(
    "⚠️ نظام الدخول مقفول: لازم تضيف AUTH_SECRET (24 حرف أو أكتر) و ADMIN_PASSWORD (8 حروف أو أكتر) في Variables بتاعة Railway."
  );
}

const ADMIN_TOKEN_TTL = 12 * 60 * 60 * 1000;
const CASHIER_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

const adminStamp = authReady
  ? crypto.createHmac("sha256", AUTH_SECRET).update(`admin:${ADMIN_PASSWORD}`).digest("hex").slice(0, 16)
  : "";

const staffSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["cashier", "admin"], default: "cashier" },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});
const Staff = mongoose.model("Staff", staffSchema);

const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString("hex");
  const key = await scrypt(String(password), salt, 64);
  return `${salt}:${key.toString("hex")}`;
};

const DUMMY_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`;

const verifyPassword = async (password, stored) => {
  try {
    if (typeof stored !== "string") return false;
    const [salt, hash] = stored.split(":");
    if (!salt || !hash || !/^[0-9a-f]{128}$/i.test(hash)) return false;
    const expected = Buffer.from(hash, "hex");
    const test = await scrypt(String(password), salt, 64);
    return expected.length === test.length && crypto.timingSafeEqual(expected, test);
  } catch {
    return false;
  }
};

const safeEqual = (a, b) => {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

const signToken = (payload, ttlMs) => {
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + ttlMs })).toString("base64url");
  const sig = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
  return `${body}.${sig}`;
};

const verifyToken = (token) => {
  try {
    if (typeof token !== "string") return null;
    const [body, sig] = token.split(".");
    if (!body || !sig) return null;
    const expected = crypto.createHmac("sha256", AUTH_SECRET).update(body).digest("base64url");
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

// ---------- حماية من التخمين والطلبات المتكررة ----------
const buckets = new Map();

const hitBucket = (key, windowMs) => {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || bucket.reset < now) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket;
};

const peekBucket = (key) => {
  const bucket = buckets.get(key);
  return bucket && bucket.reset > Date.now() ? bucket : null;
};

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.reset < now) buckets.delete(key);
}, 60 * 1000).unref();

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const MAX_LOGIN_FAILS_PER_USER = 8;
const MAX_LOGIN_FAILS_PER_IP = 30;

const orderLimiter = (req, res, next) => {
  const bucket = hitBucket(`order:${req.ip}`, 10 * 60 * 1000);
  if (bucket.count > 15) {
    return res.status(429).json({ error: "طلبات كتير في وقت قصير، حاول بعد شوية" });
  }
  next();
};

// ---------- Middlewares ----------
const requireAuth = async (req, res, next) => {
  try {
    if (!authReady) return res.status(503).json({ error: "نظام الدخول لسه مش متظبط على السيرفر" });

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    const payload = token ? verifyToken(token) : null;
    if (!payload) return res.status(401).json({ error: "غير مصرح" });

    if (payload.role === "admin") {
      if (payload.s !== adminStamp) return res.status(401).json({ error: "غير مصرح" });
      req.user = { _id: "admin", name: "المدير", username: ADMIN_USERNAME, role: "admin" };
      return next();
    }

    const user = await Staff.findById(payload.id);
    if (!user || !user.active || user.role !== "cashier") {
      return res.status(401).json({ error: "الحساب غير مفعل" });
    }
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: "غير مصرح" });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") return res.status(403).json({ error: "للأدمن فقط" });
  next();
};

// ---------- تسجيل الدخول ----------
app.post("/api/auth/login", async (req, res) => {
  try {
    if (!authReady) return res.status(503).json({ error: "نظام الدخول لسه مش متظبط على السيرفر" });

    const username = String(req.body?.username || "").toLowerCase().trim();
    const password = String(req.body?.password || "");

    if (!username || !password || password.length > 200) {
      return res.status(400).json({ error: "اكتب اليوزر والباسورد" });
    }

    const userKey = `login:${req.ip}:${username}`;
    const ipKey = `loginip:${req.ip}`;
    if (
      (peekBucket(userKey)?.count || 0) >= MAX_LOGIN_FAILS_PER_USER ||
      (peekBucket(ipKey)?.count || 0) >= MAX_LOGIN_FAILS_PER_IP
    ) {
      return res.status(429).json({ error: "محاولات غلط كتير، استنى 15 دقيقة وحاول تاني" });
    }

    let session = null;

    if (username === ADMIN_USERNAME) {
      if (safeEqual(password, ADMIN_PASSWORD)) {
        session = {
          token: signToken({ id: "admin", role: "admin", s: adminStamp }, ADMIN_TOKEN_TTL),
          user: { id: "admin", name: "المدير", username: ADMIN_USERNAME, role: "admin" }
        };
      }
    } else {
      const staff = await Staff.findOne({ username, role: "cashier" });
      const passwordOk = await verifyPassword(password, staff ? staff.password : DUMMY_HASH);
      if (staff && passwordOk && staff.active) {
        session = {
          token: signToken({ id: String(staff._id), role: "cashier" }, CASHIER_TOKEN_TTL),
          user: { id: staff._id, name: staff.name, username: staff.username, role: "cashier" }
        };
      }
    }

    if (!session) {
      hitBucket(userKey, LOGIN_WINDOW_MS);
      hitBucket(ipKey, LOGIN_WINDOW_MS);
      return res.status(401).json({ error: "اليوزر أو الباسورد غلط" });
    }

    buckets.delete(userKey);
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- إدارة الكاشيرات ----------
const USERNAME_RE = /^[a-z0-9_.-]{3,30}$/;

app.get("/api/staff", requireAuth, requireAdmin, async (req, res) => {
  try {
    const staff = await Staff.find({ role: "cashier" }).select("-password").sort({ createdAt: 1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/staff", requireAuth, requireAdmin, async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim().slice(0, 50);
    const username = String(req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!name) return res.status(400).json({ error: "اكتب اسم الكاشير" });
    if (!USERNAME_RE.test(username)) return res.status(400).json({ error: "اسم المستخدم لازم يكون إنجليزي وأرقام من 3 لـ 30 حرف" });
    if (username === ADMIN_USERNAME) return res.status(400).json({ error: "اسم المستخدم ده محجوز" });
    if (password.length < 6 || password.length > 100) return res.status(400).json({ error: "الباسورد لازم يكون 6 حروف أو أرقام على الأقل" });

    const created = await Staff.create({
      name,
      username,
      password: await hashPassword(password),
      role: "cashier"
    });

    res.status(201).json({ _id: created._id, name: created.name, username: created.username, role: created.role, active: created.active });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: "اليوزر ده موجود قبل كده" });
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/staff/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "رقم الحساب غير صحيح" });
    const update = {};
    if (req.body?.password !== undefined) {
      const password = String(req.body.password);
      if (password.length < 6 || password.length > 100) return res.status(400).json({ error: "الباسورد لازم يكون 6 حروف على الأقل" });
      update.password = await hashPassword(password);
    }
    if (typeof req.body?.active === "boolean") update.active = req.body.active;
    if (req.body?.name) update.name = String(req.body.name).trim().slice(0, 50);

    const updated = await Staff.findOneAndUpdate({ _id: req.params.id, role: "cashier" }, update, { new: true }).select("-password");
    if (!updated) return res.status(404).json({ error: "الحساب غير موجود" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/staff/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ error: "رقم الحساب غير صحيح" });
    await Staff.findOneAndDelete({ _id: req.params.id, role: "cashier" });
    res.json({ message: "تم المسح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// SETTINGS
// =========================
app.get("/api/settings", async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/settings", requireAuth, requireAdmin, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings(req.body);
    else Object.assign(settings, req.body);
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// DELIVERY ZONES
// =========================
app.get("/api/zones", async (req, res) => {
  try {
    res.json(await DeliveryZone.find());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/zones", requireAuth, requireAdmin, async (req, res) => {
  try {
    const saved = await new DeliveryZone(req.body).save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/zones/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await DeliveryZone.findByIdAndDelete(req.params.id);
    res.json({ message: "تم مسح المنطقة بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// CATEGORIES
// =========================
app.get("/api/categories", async (req, res) => {
  try {
    res.json(await Category.find().sort({ order: 1, _id: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/categories", requireAuth, requireAdmin, async (req, res) => {
  try {
    const count = await Category.countDocuments();
    const saved = await new Category({ ...req.body, order: count }).save();
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/categories/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const updated = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/categories/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "تم مسح القسم بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// ITEMS
// =========================
app.get("/api/items", async (req, res) => {
  try {
    res.json(await Item.find().sort({ order: 1, _id: 1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/items", requireAuth, requireAdmin, async (req, res) => {
  try {
    const count = await Item.countDocuments({ category: req.body.category });
    const newItem = new Item({ ...req.body, order: count });
    res.json(await newItem.save());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل الخصم لأكتر من صنف مرة واحدة (للأدمن) — لازم يكون قبل راوت /api/items/:id
app.put("/api/items/bulk-discount", requireAuth, requireAdmin, async (req, res) => {
  try {
    const discount = Number(req.body?.discount);
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      return res.status(400).json({ error: "الخصم لازم يكون رقم من 0 لـ 100" });
    }
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.filter((id) => mongoose.Types.ObjectId.isValid(id))
      : [];
    if (ids.length === 0) return res.status(400).json({ error: "اختار صنف واحد على الأقل" });

    const result = await Item.updateMany({ _id: { $in: ids } }, { $set: { discount } });
    res.json({ ok: true, matched: result.matchedCount, modified: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/items/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const updateData = { ...req.body };
    delete updateData._id;
    delete updateData.available;
    if (req.body.price !== undefined) updateData.price = Number(req.body.price);
    else delete updateData.price;
    if (req.body.discount !== undefined) updateData.discount = Number(req.body.discount) || 0;
    else delete updateData.discount;

    const updated = await Item.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: "الصنف غير موجود" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/items/:id/availability", requireAuth, async (req, res) => {
  try {
    if (typeof req.body.available !== "boolean") return res.status(400).json({ error: "القيمة غير صحيحة" });
    const updated = await Item.findByIdAndUpdate(req.params.id, { $set: { available: req.body.available } }, { new: true });
    if (!updated) return res.status(404).json({ error: "الصنف غير موجود" });
    res.json({ _id: updated._id, name: updated.name, available: updated.available });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/items/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await Item.findByIdAndDelete(req.params.id);
    res.json({ message: "تم مسح الصنف بنجاح" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// ORDERS
// =========================
const cleanText = (value, max) => String(value ?? "").trim().slice(0, max);
const clampNumber = (value, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
};

const buildOrderFromBody = (body = {}, zoneFee = null) => {
  const orderId = cleanText(body.orderId, 30);
  if (!/^[A-Za-z0-9-]{4,30}$/.test(orderId)) return { error: "رقم الأوردر غير صحيح" };

  const customerName = cleanText(body.customerName, 80);
  if (!customerName) return { error: "الاسم مطلوب" };

  const customerPhone = cleanText(body.customerPhone, 20);
  if (!/^\+?\d{8,15}$/.test(customerPhone)) return { error: "رقم التليفون غير صحيح" };

  const orderType = body.orderType === "delivery" ? "delivery" : body.orderType === "pickup" ? "pickup" : null;
  if (!orderType) return { error: "نوع الاستلام غير صحيح" };

  const rawItems = Array.isArray(body.items) ? body.items.slice(0, 60) : [];
  const items = rawItems.map((it) => ({
    name: cleanText(it?.name, 200),
    price: clampNumber(it?.price, 0, 100000),
    quantity: Math.round(clampNumber(it?.quantity, 1, 99)),
    modifiers: Array.isArray(it?.modifiers) ? it.modifiers.slice(0, 40).map((m) => cleanText(m, 200)).filter(Boolean) : [],
    notes: cleanText(it?.notes, 300)
  })).filter((it) => it.name);
  if (items.length === 0) return { error: "الأوردر فاضي" };

  const itemsTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const deliveryFee = orderType === "delivery" ? (zoneFee !== null ? zoneFee : clampNumber(body.deliveryFee, 0, 500)) : 0;

  return {
    order: {
      orderId, customerName, customerPhone, orderType,
      customerAddress: orderType === "delivery" ? cleanText(body.customerAddress, 300) : "استلام من الفرع",
      zoneName: orderType === "delivery" ? cleanText(body.zoneName, 80) : "استلام من الفرع",
      deliveryFee, items, itemsTotal, grandTotal: itemsTotal + deliveryFee, status: "pending"
    }
  };
};

app.post("/api/orders", orderLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    let zoneFee = null;
    if (body.orderType === "delivery") {
      const zone = await DeliveryZone.findOne({ name: cleanText(body.zoneName, 80) });
      if (zone) zoneFee = zone.fee;
    }
    const { order, error } = buildOrderFromBody(body, zoneFee);
    if (error) return res.status(400).json({ error });

    const saved = await new Order(order).save();
    console.log(`✅ New order saved: #${saved.orderId}`);
    res.status(201).json({ ok: true, orderId: saved.orderId });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "الأوردر ده اتبعت قبل كده" });
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/orders", requireAuth, async (req, res) => {
  try {
    res.json(await Order.find().sort({ createdAt: -1 }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    if (!req.body.status || !["pending", "accepted", "completed"].includes(req.body.status)) return res.status(400).json({ error: "حالة الأوردر غير صحيحة" });
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ _id: req.params.id }, { orderId: req.params.id }] } : { orderId: req.params.id };
    const update = { status: req.body.status };
    if (req.body.status === "accepted") { update.acceptedBy = req.user.name; update.acceptedAt = new Date(); }
    if (req.body.status === "completed") { update.completedBy = req.user.name; update.completedAt = new Date(); }

    const updatedOrder = await Order.findOneAndUpdate(query, update, { new: true });
    if (!updatedOrder) return res.status(404).json({ error: "الأوردر غير موجود" });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/orders/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "تم مسح الأوردر" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================
// SHIFTS
// =========================
app.get("/api/shifts", requireAuth, async (req, res) => {
  try {
    res.json(await Shift.find().sort({ closedAt: -1 }).limit(90));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/shifts/close", requireAuth, async (req, res) => {
  try {
    const last = await Shift.findOne().sort({ closedAt: -1 });
    const lastAt = last ? new Date(last.closedAt).getTime() : 0;
    const now = new Date();

    const completed = await Order.find({ status: "completed" });
    const inShift = completed
      .filter((o) => {
        const t = new Date(o.completedAt || o.createdAt).getTime();
        return t > lastAt && t <= now.getTime();
      })
      .sort((a, b) => new Date(a.completedAt || a.createdAt) - new Date(b.completedAt || b.createdAt));

    if (inShift.length === 0) return res.status(400).json({ error: "مفيش أوردرات مكتملة في الشيفت ده" });

    const shift = await Shift.create({
      closedAt: now,
      closedBy: req.user.name,
      from: inShift[0].completedAt || inShift[0].createdAt,
      count: inShift.length,
      total: inShift.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0),
      delivery: inShift.reduce((sum, o) => sum + (Number(o.deliveryFee) || 0), 0),
      orders: inShift.map((o) => ({ id: o.orderId, total: Number(o.grandTotal) || 0 }))
    });
    res.json(shift);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/health", (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({
    ok: dbOk, database: dbOk ? "connected" : "disconnected", auth: authReady ? "ready" : "not-configured"
  });
});

// =========================
// SERVER STARTUP
// =========================
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

process.on("unhandledRejection", (err) => console.error("⚠️ unhandledRejection:", err));
mongoose.connection.on("disconnected", () => console.error("❌ اتصال MongoDB انقطع"));
mongoose.connection.on("error", (err) => console.error("❌ MongoDB error:", err.message));

const removeLegacyAdminAccounts = async () => {
  try {
    const result = await Staff.deleteMany({ role: "admin" });
    if (result.deletedCount > 0) console.log(`🧹 اتمسح ${result.deletedCount} حساب أدمن قديم`);
  } catch (err) {}
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const connectToDatabase = async () => {
  while (true) {
    try {
      await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 15000 });
      console.log("✅ تم الاتصال بقاعدة بيانات MongoDB بنجاح");
      await removeLegacyAdminAccounts();
      return;
    } catch (err) {
      console.error("❌ فشل الاتصال بقاعدة البيانات، هحاول تاني بعد 5 ثواني:", err.message);
      await sleep(5000);
    }
  }
};

if (!MONGO_URI) {
  console.error("❌ MONGO_URI غير موجود في Environment Variables على Railway");
  process.exit(1);
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 السيرفر شغال على البورت ${PORT}`);
});
connectToDatabase();