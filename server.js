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
// كاش في الذاكرة لقائمة الأصناف والإعدادات (بيتمسح لوحده أول ما الأدمن يعدّل أي حاجة)
// =========================
const LIST_CACHE_TTL = 30 * 1000;
const listCache = { items: null, settings: null };
const readListCache = (key) => (listCache[key] && Date.now() - listCache[key].at < LIST_CACHE_TTL ? listCache[key].body : null);
const writeListCache = (key, body) => { listCache[key] = { at: Date.now(), body }; };
app.use(["/api/items", "/api/settings"], (req, res, next) => {
  if (req.method !== "GET") res.on("finish", () => { listCache.items = null; listCache.settings = null; });
  next();
});

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
  promoBannerImage: { type: String, default: "" },

  // مواعيد استقبال الأوردرات (فتح / قفل)
  orderingMode: { type: String, enum: ["auto", "open", "closed"], default: "auto" },
  openTime: { type: String, default: "12:00" },
  closeTime: { type: String, default: "03:00" },
  closedMessage: { type: String, default: "" }
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
  completedAt: { type: Date },

  // أوردرات الكاشير (POS) + الإلغاء + السواق
  source: { type: String, default: "web" },
  paymentMethod: { type: String },
  talabatNo: { type: String },
  discountPercent: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  createdBy: { type: String },
  driverName: { type: String },
  cancelReason: { type: String },
  cancelledBy: { type: String },
  cancelledAt: { type: Date }
});
const Order = mongoose.model("Order", orderSchema);

// عدّاد أرقام أوردرات الكاشير
const counterSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model("Counter", counterSchema);

// تقفيلات الشيفتات
const shiftSchema = new mongoose.Schema({
  closedAt: { type: Date, default: Date.now },
  closedBy: { type: String },
  from: { type: Date },
  count: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  delivery: { type: Number, default: 0 },
  orders: { type: Array, default: [] },
  payments: { type: Object, default: {} },
  talabat: { type: Number, default: 0 },
  discounts: { type: Number, default: 0 },
  cancelled: { type: Number, default: 0 }
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
const SETTINGS_IMAGE_FIELDS = { hero: "heroImage", logo: "logoImage", banner: "promoBannerImage" };
const presentSettings = (doc) => {
  const d = doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  Object.entries(SETTINGS_IMAGE_FIELDS).forEach(([key, field]) => {
    if (typeof d[field] === "string" && d[field].startsWith("data:")) d[field] = `${PUBLIC_URL}/api/settings/image/${key}?v=${d[field].length}`;
  });
  return d;
};

app.get("/api/settings", async (req, res) => {
  try {
    const cached = readListCache("settings");
    if (cached) return res.type("json").send(cached);
    let settings = await Settings.findOne();
    if (!settings) settings = await Settings.create({});
    const body = JSON.stringify(presentSettings(settings));
    writeListCache("settings", body);
    res.type("json").send(body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/settings/image/:key", async (req, res) => {
  try {
    const field = SETTINGS_IMAGE_FIELDS[req.params.key];
    if (!field) return res.status(404).end();
    const settings = await Settings.findOne().lean();
    if (!settings) return res.status(404).end();
    sendImageFromDataUri(res, settings[field]);
  } catch (err) {
    res.status(500).end();
  }
});

app.put("/api/settings", requireAuth, requireAdmin, async (req, res) => {
  try {
    const body = { ...req.body };
    Object.values(SETTINGS_IMAGE_FIELDS).forEach((f) => { if (isOwnImageUrl(body[f])) delete body[f]; });
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings(body);
    else Object.assign(settings, body);
    await settings.save();
    res.json(presentSettings(settings));
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
// ---- الصور: بدل ما نبعت الصور (base64) جوه رد الأصناف، بنبعت لينك صغير والمتصفح يحمّل الصورة لوحدها ويخزّنها ----
const PUBLIC_URL = (process.env.PUBLIC_URL || "https://bahbah-backend-production.up.railway.app").replace(/\/$/, "");
const DATA_URI_RE = /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i;
// لينك صورة بتاعنا (لو الأدمن رجّعه في التعديل، ما نحفظوش مكان الصورة الأصلية)
const isOwnImageUrl = (v) => typeof v === "string" && v.startsWith(`${PUBLIC_URL}/api/`) && v.includes("/image");
const presentItem = (doc) => {
  const d = doc && typeof doc.toObject === "function" ? doc.toObject() : { ...doc };
  if (typeof d.image === "string" && d.image.startsWith("data:")) d.image = `${PUBLIC_URL}/api/items/${d._id}/image?v=${d.image.length}`;
  return d;
};
const sendImageFromDataUri = (res, dataUri) => {
  const m = DATA_URI_RE.exec(dataUri || "");
  if (!m) return res.status(404).end();
  const buf = Buffer.from(m[2], "base64");
  res.set({ "Content-Type": m[1], "Content-Length": buf.length, "Cache-Control": "public, max-age=31536000, immutable" });
  res.send(buf);
};

app.get("/api/items", async (req, res) => {
  try {
    const cached = readListCache("items");
    if (cached) return res.type("json").send(cached);
    // الصور بتتشال جوه MongoDB نفسه (من غير ما تتنقل للسيرفر) ونسيب مكانها لينك
    const docs = await Item.aggregate([
      { $sort: { order: 1, _id: 1 } },
      {
        $addFields: {
          _imgLen: { $strLenCP: { $ifNull: ["$image", ""] } },
          _isData: { $eq: [{ $substrCP: [{ $ifNull: ["$image", ""] }, 0, 5] }, "data:"] }
        }
      },
      { $addFields: { image: { $cond: ["$_isData", "", "$image"] } } }
    ]);
    const body = JSON.stringify(docs.map((d) => {
      const out = { ...d };
      if (d._isData) out.image = `${PUBLIC_URL}/api/items/${d._id}/image?v=${d._imgLen}`;
      if (out.available === undefined) out.available = true;
      delete out._imgLen; delete out._isData;
      return out;
    }));
    writeListCache("items", body);
    res.type("json").send(body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/items/:id/image", async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(404).end();
    const item = await Item.findById(req.params.id).select("image").lean();
    if (!item) return res.status(404).end();
    sendImageFromDataUri(res, item.image);
  } catch (err) {
    res.status(500).end();
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
    if (isOwnImageUrl(updateData.image)) delete updateData.image;
    if (req.body.price !== undefined) updateData.price = Number(req.body.price);
    else delete updateData.price;
    if (req.body.discount !== undefined) updateData.discount = Number(req.body.discount) || 0;
    else delete updateData.discount;

    const updated = await Item.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: "الصنف غير موجود" });
    res.json(presentItem(updated));
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

// =========================
// STORE HOURS (فتح / قفل استقبال الأوردرات)
// =========================
const STORE_TZ = "Africa/Cairo";
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEFAULT_CLOSED_MSG = "قفلنا دلوقتي 🌙 هنفتح تاني الصبح بإذن الله، تنوّر بحبح برجر في مواعيدنا!";

const toMin = (s) => { const [h, m] = String(s).split(":").map(Number); return h * 60 + m; };
const cairoMinutes = () => {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: STORE_TZ, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour").value) % 24;
  const m = Number(parts.find((p) => p.type === "minute").value);
  return h * 60 + m;
};
// بيدعم الميعاد اللي بعد نص الليل (مثلاً 12:00 ← 03:00)
const inWindow = (now, open, close) => (open === close ? true : open < close ? now >= open && now < close : now >= open || now < close);

let storeCfgCache = { at: 0, cfg: null };
const loadStoreCfg = async () => {
  if (storeCfgCache.cfg && Date.now() - storeCfgCache.at < 5000) return storeCfgCache.cfg;
  const s = await Settings.findOne().lean();
  const cfg = {
    mode: ["auto", "open", "closed"].includes(s?.orderingMode) ? s.orderingMode : "auto",
    openTime: TIME_RE.test(s?.openTime || "") ? s.openTime : "12:00",
    closeTime: TIME_RE.test(s?.closeTime || "") ? s.closeTime : "03:00",
    customMessage: s?.closedMessage || ""
  };
  storeCfgCache = { at: Date.now(), cfg };
  return cfg;
};

const getStoreStatus = async () => {
  try {
    const cfg = await loadStoreCfg();
    const isOpen = cfg.mode === "open" ? true : cfg.mode === "closed" ? false : inWindow(cairoMinutes(), toMin(cfg.openTime), toMin(cfg.closeTime));
    return { isOpen, mode: cfg.mode, openTime: cfg.openTime, closeTime: cfg.closeTime, customMessage: cfg.customMessage, message: isOpen ? "" : (cfg.customMessage || DEFAULT_CLOSED_MSG) };
  } catch (err) {
    // لو قاعدة البيانات فيها مشكلة ما نوقفش الأوردرات
    return { isOpen: true, mode: "auto", openTime: "12:00", closeTime: "03:00", customMessage: "", message: "" };
  }
};

const saveStoreCfg = async (patch) => {
  let s = await Settings.findOne();
  if (!s) s = new Settings({});
  Object.assign(s, patch);
  await s.save();
  storeCfgCache = { at: 0, cfg: null };
  listCache.settings = null;
};

// عام: الموقع بيسأله كل دقيقة
app.get("/api/store-status", async (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(await getStoreStatus());
});

// الكاشير والأدمن: فتح / قفل / تلقائي
app.put("/api/store-mode", requireAuth, async (req, res) => {
  try {
    const mode = req.body?.mode;
    if (!["auto", "open", "closed"].includes(mode)) return res.status(400).json({ error: "الوضع غير صحيح" });
    await saveStoreCfg({ orderingMode: mode });
    res.json(await getStoreStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// الأدمن فقط: المواعيد ورسالة القفل
app.put("/api/store-hours", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { openTime, closeTime, closedMessage } = req.body || {};
    if (!TIME_RE.test(String(openTime)) || !TIME_RE.test(String(closeTime))) return res.status(400).json({ error: "اكتب الوقت بشكل صحيح" });
    await saveStoreCfg({ openTime, closeTime, closedMessage: cleanText(closedMessage, 200) });
    res.json(await getStoreStatus());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    // لو الموقع مقفول (يدوي أو حسب المواعيد) نرفض الأوردر
    const status = await getStoreStatus();
    if (!status.isOpen) return res.status(403).json({ error: status.message, closed: true });

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

// الحالات المسموحة للكاشير: لقدام بس. الأدمن بس يرجّع للخلف.
const FORWARD_STATUS = {
  pending: ["accepted", "completed", "cancelled"],
  accepted: ["completed", "cancelled"],
  completed: [],
  cancelled: []
};

app.put("/api/orders/:id", requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status || !["pending", "accepted", "completed", "cancelled"].includes(status)) return res.status(400).json({ error: "حالة الأوردر غير صحيحة" });
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ _id: req.params.id }, { orderId: req.params.id }] } : { orderId: req.params.id };
    const order = await Order.findOne(query);
    if (!order) return res.status(404).json({ error: "الأوردر غير موجود" });

    // نفس الحالة تاني: ما نغيرش حاجة (يمنع تكرار التسليم أو الحساب)
    if (order.status === status) return res.json(order);

    const isAdminUser = req.user?.role === "admin";
    if (!isAdminUser && !(FORWARD_STATUS[order.status] || []).includes(status)) {
      return res.status(403).json({ error: "مينفعش ترجّع أو تعدّل أوردر خلص. اطلب من الأدمن" });
    }

    const update = { status };
    const unset = {};
    if (status === "accepted") { update.acceptedBy = req.user.name; update.acceptedAt = new Date(); }
    if (status === "completed") {
      update.completedBy = req.user.name; update.completedAt = new Date();
      if (order.orderType === "delivery") update.driverName = cleanText(req.body.driverName, 40);
    }
    if (status === "cancelled") {
      const reason = cleanText(req.body.cancelReason, 200);
      if (reason.length < 2) return res.status(400).json({ error: "اكتب سبب الإلغاء" });
      update.cancelReason = reason; update.cancelledBy = req.user.name; update.cancelledAt = new Date();
    }
    if (status !== "completed") { unset.completedAt = ""; unset.completedBy = ""; unset.driverName = ""; }
    if (status !== "cancelled") { unset.cancelReason = ""; unset.cancelledBy = ""; unset.cancelledAt = ""; }

    const op = { $set: update };
    if (Object.keys(unset).length) op.$unset = unset;

    // الشرط على الحالة القديمة عشان لو دوسين في نفس اللحظة ما يتسجلوش مرتين
    const updatedOrder = await Order.findOneAndUpdate({ _id: order._id, status: order.status }, op, { new: true });
    if (!updatedOrder) return res.status(409).json({ error: "الأوردر اتغيّر قبل كده، حدّث الصفحة" });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// أوردر من شاشة الكاشير (POS)
const POS_PAYMENTS = ["cash", "visa", "instapay", "wallet"];
const MAX_CASHIER_DISCOUNT = clampNumber(process.env.MAX_CASHIER_DISCOUNT ?? 50, 0, 100);

app.post("/api/pos/orders", requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const orderType = ["pickup", "delivery", "talabat"].includes(body.orderType) ? body.orderType : null;
    if (!orderType) return res.status(400).json({ error: "نوع الأوردر غير صحيح" });

    const paymentMethod = POS_PAYMENTS.includes(body.paymentMethod) ? body.paymentMethod : null;
    if (!paymentMethod) return res.status(400).json({ error: "اختار طريقة الدفع" });
    if (orderType === "talabat" && !["cash", "visa"].includes(paymentMethod)) return res.status(400).json({ error: "طلبات: كاش أو فيزا بس" });

    const talabatNo = orderType === "talabat" ? cleanText(body.talabatNo, 30) : "";
    if (orderType === "talabat" && !talabatNo) return res.status(400).json({ error: "اكتب رقم أوردر طلبات" });

    const rawItems = Array.isArray(body.items) ? body.items.slice(0, 80) : [];
    const items = rawItems.map((it) => ({
      name: cleanText(it?.name, 200),
      price: clampNumber(it?.price, 0, 100000),
      quantity: Math.round(clampNumber(it?.quantity, 1, 99)),
      modifiers: Array.isArray(it?.modifiers) ? it.modifiers.slice(0, 40).map((m) => cleanText(m, 200)).filter(Boolean) : [],
      notes: cleanText(it?.notes, 300)
    })).filter((it) => it.name);
    if (items.length === 0) return res.status(400).json({ error: "الأوردر فاضي" });

    const isAdminUser = req.user?.role === "admin";
    const discountPercent = clampNumber(body.discountPercent, 0, 100);
    if (!isAdminUser && discountPercent > MAX_CASHIER_DISCOUNT) {
      return res.status(403).json({ error: `أقصى خصم للكاشير ${MAX_CASHIER_DISCOUNT}%` });
    }

    const itemsTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const discountAmount = Math.round(itemsTotal * discountPercent / 100);

    let customerName = cleanText(body.customerName, 80) || "-";
    let customerPhone = cleanText(body.customerPhone, 20) || "-";
    let customerAddress = "استلام من الفرع";
    let zoneName = "استلام من الفرع";
    let deliveryFee = 0;
    if (orderType === "delivery") {
      customerAddress = cleanText(body.customerAddress, 300);
      if (!customerAddress) return res.status(400).json({ error: "اكتب عنوان التوصيل" });
      if (customerPhone !== "-" && !/^\+?\d{6,15}$/.test(customerPhone)) return res.status(400).json({ error: "رقم التليفون غير صحيح" });
      zoneName = cleanText(body.zoneName, 80) || "توصيل";
      const zone = zoneName ? await DeliveryZone.findOne({ name: zoneName }) : null;
      deliveryFee = zone ? zone.fee : clampNumber(body.deliveryFee, 0, 500);
    } else if (orderType === "talabat") {
      customerName = "طلبات"; customerPhone = "-"; customerAddress = "طلبات"; zoneName = "طلبات";
    }

    const grandTotal = itemsTotal - discountAmount + deliveryFee;

    const counter = await Counter.findOneAndUpdate({ key: "pos" }, { $inc: { seq: 1 } }, { new: true, upsert: true });
    const orderId = `P${counter.seq}`;

    const saved = await new Order({
      orderId, customerName, customerPhone, orderType, customerAddress, zoneName, deliveryFee,
      items, itemsTotal, grandTotal, status: "accepted",
      source: "pos", paymentMethod, talabatNo, discountPercent, discountAmount,
      createdBy: req.user.name, acceptedBy: req.user.name, acceptedAt: new Date()
    }).save();
    console.log(`✅ POS order saved: #${saved.orderId} by ${req.user.name}`);
    res.status(201).json(saved);
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

    const payments = {};
    let talabat = 0;
    let discounts = 0;
    inShift.forEach((o) => {
      discounts += Number(o.discountAmount) || 0;
      if (o.orderType === "talabat") { talabat += Number(o.grandTotal) || 0; return; }
      const k = o.paymentMethod || "cash";
      payments[k] = (payments[k] || 0) + (Number(o.grandTotal) || 0);
    });
    const cancelled = await Order.countDocuments({ status: "cancelled", cancelledAt: { $gt: new Date(lastAt), $lte: now } });

    const shift = await Shift.create({
      payments, talabat, discounts, cancelled,
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