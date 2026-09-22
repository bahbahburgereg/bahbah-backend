import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
const API_URL = "https://noss-kofta-production-d57f.up.railway.app";
const translations = {
  ar: {
    home: "الرئيسية",
    menu: "المنيو",
    cart: "السلة",
    admin: "لوحة الإدارة",
    all: "الكل",
    orderNow: "اطلب دلوقتي",
    ourMenu: "المنيو بتاعنا",
    bestOffers: "أفضل العروض",
    seeMore: "رؤية المزيد ➔",
    hotlineText: "HOTLINE",
    rights: "جميع الحقوق محفوظة © 2026 نص كفتة",
    addToCart: "أضف للسلة",
    customizeBox: "شكل البوكس بمزاجك ⚙️",
    details: "عرض التفاصيل والطلب",
    emptyCart: "السلة فارغة",
    backToMenu: "ارجع للمنيو واختار أكلتك",
    total: "الإجمالي:",
    whatsappOrder: "📲 ابعت الطلب واتساب",
    delete: "مسح",
    edit: "تعديل",
    save: "حفظ",
    cancel: "إلغاء",
    addItem: "➕ إضافة صنف جديد",
    addCat: "➕ إضافة قسم",
    catManage: "📁 إدارة وتنسيق أقسام المنيو",
    itemManage: "🍔 إدارة وترتيب أصناف المنيو",
    siteSettings: "🖼️ تحكم في لوجو الموقع وواجهة الرئيسية",
  },
  en: {
    home: "Home",
    menu: "Menu",
    cart: "Cart",
    admin: "Admin",
    all: "All",
    orderNow: "Order Now",
    ourMenu: "Our Menu",
    bestOffers: "Best Offers",
    seeMore: "See More ➔",
    addToCart: "Add to Cart",
    customizeBox: "Customize Box ⚙️",
    details: "View Details & Order",
    emptyCart: "Cart is Empty",
    backToMenu: "Back to menu to choose your meal",
    total: "Total:",
    whatsappOrder: "📲 Send Order via WhatsApp",
    delete: "Delete",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
    addItem: "➕ Add New Item",
    addCat: "➕ Add Category",
    catManage: "📁 Manage & Reorder Menu Categories",
    itemManage: "🍔 Manage & Reorder Menu Items",
    siteSettings: "🖼️ Control Website Logo & Hero",
  }
};

// ================= 1. صفحة الرئيسية =================
const HomePage = ({ lang, siteSettings, menuItems, handleOpenItemDetails, cart, setCart }) => {
  const t = translations[lang];
  const title = lang === 'ar' ? siteSettings.heroTitleAr : siteSettings.heroTitleEn;
  const offerItems = menuItems.filter(item => item.isOffer);

  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    if (offerItems.length <= 3) return;
    setCurrentIndex((prev) => (prev + 1) % (offerItems.length - 2));
  };

  const prevSlide = () => {
    if (offerItems.length <= 3) return;
    setCurrentIndex((prev) => (prev === 0 ? offerItems.length - 3 : prev - 1));
  };

  useEffect(() => {
    if (offerItems.length <= 3) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, offerItems.length - 2));
    }, 3000);
    return () => clearInterval(interval);
  }, [offerItems.length]);

  return (
    <div className="bg-[#12080A] min-h-screen text-white">
      {/* هيدر العروض الكبرى والفخم مع بانر الخصم التحتاوي */}
      <header className="relative w-full bg-[#12080A] flex flex-col items-center justify-center overflow-hidden border-b-4 border-[#800020] shadow-2xl pt-12 pb-8">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-70 scale-105 transition duration-700"
          style={{ backgroundImage: `url(${siteSettings.heroImage})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#12080A] via-[#12080A]/60 to-transparent"></div>
        
        {/* محتوى الهيدر الأساسي */}
        <div className="relative z-10 text-center px-4 mb-6">
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFD700] via-[#E6C687] to-[#C5A059] drop-shadow-[0_5px_5px_rgba(0,0,0,0.9)] mb-4">
            {title}
          </h1>
          <Link to="/menu" className="inline-block bg-[#800020] hover:bg-[#990026] text-white border-2 border-[#FFD700] px-8 py-3 text-xl font-black rounded-2xl hover:scale-105 transition shadow-[0_0_30px_rgba(255,215,0,0.4)]">
            {t.orderNow}
          </Link>
        </div>

        {/* صورة الخصم أو البانر الإضافي تحت زرار اطلب دلوقتي (تظهر فقط لو مضافة) */}
        {siteSettings.promoBannerImage && (
          <div className="relative z-10 w-full max-w-4xl px-4 mt-6">
            <div className="rounded-2xl overflow-hidden border-2 border-[#FFD700]/60 shadow-[0_0_25px_rgba(255,215,0,0.3)] bg-[#1C0D10]">
              <img src={siteSettings.promoBannerImage} alt="Special Promo Offer" className="w-full h-auto max-h-[350px] object-cover hover:scale-102 transition duration-500" />
            </div>
          </div>
        )}
      </header>

      <section className="px-8 py-14 max-w-7xl mx-auto relative">
        <div className="flex justify-between items-center mb-8 border-b border-[#3A1218] pb-4">
          <h2 className="text-3xl font-bold text-[#FFD700]">{t.bestOffers}</h2>
          <Link to="/menu" className="text-[#FFD700] font-bold hover:underline text-lg flex items-center gap-1 hover:text-white transition">
            {t.seeMore}
          </Link>
        </div>

        {offerItems.length > 0 ? (
          <div className="relative overflow-hidden px-4">
            {offerItems.length > 3 && (
              <>
                <button onClick={prevSlide} className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-[#800020] text-white w-10 h-10 rounded-full font-black text-xl flex items-center justify-center shadow-lg hover:bg-[#990026] transition">❮</button>
                <button onClick={nextSlide} className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[#800020] text-white w-10 h-10 rounded-full font-black text-xl flex items-center justify-center shadow-lg hover:bg-[#990026] transition">❯</button>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 transition-all duration-300">
              {offerItems.slice(currentIndex, currentIndex + 3).map((item) => {
                const cartItem = cart.find(i => i.name === item.name);
                const quantity = cartItem ? cart.filter(i => i.name === item.name).length : 0;

                return (
                  <div 
                    key={item._id} 
                    className="bg-[#1C0D10] border border-[#3A1218] rounded-2xl overflow-hidden shadow-2xl hover:border-[#800020] transition duration-300 group flex flex-col"
                  >
                    <div onClick={() => handleOpenItemDetails(item)} className="w-full h-[320px] bg-[#12080A] overflow-hidden relative cursor-pointer">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    </div>
                    <div className="p-4 flex items-center justify-between bg-[#220E13] border-t border-[#3A1218]">
                      <div>
                        <h4 className="font-bold text-lg text-white">{item.name}</h4>
                        <span className="text-[#FFD700] font-black">{item.price} ج</span>
                      </div>
                      
                      {quantity === 0 ? (
                        <button onClick={() => handleOpenItemDetails(item)} className="bg-[#800020] text-white px-4 py-2 rounded-xl font-bold text-sm shadow hover:bg-[#990026] transition">
                          أضف للسلة 🛒
                        </button>
                      ) : (
                        <div className="flex items-center bg-[#12080A] border border-[#800020] rounded-xl px-2 py-1 gap-2">
                          <button onClick={() => {
                            const idx = cart.findIndex(i => i.name === item.name);
                            if (idx !== -1) { const nc = [...cart]; nc.splice(idx, 1); setCart(nc); }
                          }} className="text-[#FFD700] font-black px-2 hover:text-white">-</button>
                          <span className="font-black text-white">{quantity}</span>
                          <button onClick={() => setCart([...cart, item])} className="text-[#FFD700] font-black px-2 hover:text-white">+</button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center text-zinc-500 py-10">لا توجد عروض رئيسية مضافة حالياً.</div>
        )}
      </section>
    </div>
  );
};

// ================= 2. صفحة المنيو =================
const MenuPage = ({ menuItems, categories, lang, handleOpenBox, handleOpenItemDetails, cart, setCart }) => {
  const t = translations[lang];
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  const categoriesToShow = selectedCategory === 'الكل' || selectedCategory === 'All'
    ? categories 
    : categories.filter(cat => cat.name === selectedCategory);

  return (
    <section className="px-8 py-12 max-w-7xl mx-auto min-h-screen relative bg-[#12080A] text-white">
      <h2 className="text-3xl font-bold text-[#FFD700] mb-6 border-b border-[#3A1218] pb-4">{t.ourMenu}</h2>
      
      <div className="flex gap-3 overflow-x-auto pb-4 mb-12 scrollbar-none sticky top-20 bg-[#12080A]/95 py-3 z-30 backdrop-blur-md">
        <button
          onClick={() => setSelectedCategory(lang === 'ar' ? 'الكل' : 'All')}
          className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition border ${
            selectedCategory === 'الكل' || selectedCategory === 'All'
              ? 'bg-[#800020] text-white border-[#FFD700] shadow-[0_0_15px_rgba(128,0,32,0.5)]' 
              : 'bg-[#1C0D10] text-zinc-300 border-[#3A1218] hover:border-[#800020]'
          }`}
        >
          {t.all}
        </button>
        {categories.map(cat => (
          <button
            key={cat._id}
            onClick={() => setSelectedCategory(cat.name)}
            className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition border ${
              selectedCategory === cat.name 
                ? 'bg-[#800020] text-white border-[#FFD700] shadow-[0_0_15px_rgba(128,0,32,0.5)]' 
                : 'bg-[#1C0D10] text-zinc-300 border-[#3A1218] hover:border-[#800020]'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {categoriesToShow.length === 0 ? (
        <div className="text-zinc-400 text-center py-20 text-xl">لا توجد أقسام مضافة بعد... ⏳</div>
      ) : (
        <div className="space-y-16">
          {categoriesToShow.map(cat => {
            const catItems = menuItems.filter(item => item.category === cat.name);
            if (catItems.length === 0 && selectedCategory !== 'الكل' && selectedCategory !== 'All') {
              return (
                <div key={cat._id} className="border-b border-[#3A1218] pb-10">
                  <h3 className="text-2xl font-black text-[#FFD700] mb-6 border-r-4 border-[#800020] pr-3">{cat.name}</h3>
                  <p className="text-zinc-500 text-sm">لا توجد أصناف في هذا القسم حالياً.</p>
                </div>
              );
            }
            if (catItems.length === 0) return null;

            return (
              <div key={cat._id} className="border-b border-[#3A1218] pb-12">
                <h3 className="text-2xl font-black text-[#FFD700] mb-6 border-r-4 border-[#800020] pr-3">
                  {cat.name}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                  {catItems.map(item => {
                    const cartItem = cart.find(i => i.name === item.name);
                    const quantity = cartItem ? cart.filter(i => i.name === item.name).length : 0;

                    return (
                      <div 
                        key={item._id} 
                        className="bg-[#1C0D10] border border-[#3A1218] rounded-2xl overflow-hidden flex flex-col hover:border-[#800020] transition group shadow-xl"
                      >
                        <div onClick={() => item.type === 'box' ? handleOpenBox(item) : handleOpenItemDetails(item)} className="w-full h-48 object-cover bg-[#12080A] overflow-hidden cursor-pointer">
                          <img src={item.image || "https://via.placeholder.com/400x300/222/FFD700?text=Noss+Kofta"} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                        </div>
                        <div className="p-4 flex-1 flex flex-col bg-[#1C0D10]">
                          <h3 className="text-xl font-bold mb-1 text-white">{item.name}</h3>
                          <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{item.description || "..."}</p>
                          <p className="text-[#FFD700] text-2xl font-black mb-4 mt-auto">{item.price} ج</p>
                          
                          {item.type === 'box' ? (
                            <button onClick={() => handleOpenBox(item)} className="w-full bg-[#800020] text-white font-bold py-2.5 rounded-xl hover:bg-[#990026] transition shadow">
                              {t.customizeBox}
                            </button>
                          ) : (
                            quantity === 0 ? (
                              <button onClick={() => handleOpenItemDetails(item)} className="w-full border-2 border-[#800020] text-[#FFD700] font-bold py-2.5 rounded-xl hover:bg-[#800020] hover:text-white transition shadow">
                                {t.details} 🛒
                              </button>
                            ) : (
                              <div className="flex items-center justify-between bg-[#12080A] border border-[#800020] rounded-xl px-3 py-2">
                                <span className="text-xs text-[#FFD700] font-bold">الكمية:</span>
                                <div className="flex items-center gap-3">
                                  <button onClick={() => {
                                    const idx = cart.findIndex(i => i.name === item.name);
                                    if (idx !== -1) { const nc = [...cart]; nc.splice(idx, 1); setCart(nc); }
                                  }} className="w-7 h-7 bg-[#1C0D10] rounded-lg text-[#FFD700] font-black hover:bg-[#800020] hover:text-white">-</button>
                                  <span className="font-black text-white">{quantity}</span>
                                  <button onClick={() => setCart([...cart, item])} className="w-7 h-7 bg-[#1C0D10] rounded-lg text-[#FFD700] font-black hover:bg-[#800020] hover:text-white">+</button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

// ================= 3. لوحة التحكم الشاملة =================
const AdminDashboard = ({ menuItems, categories, siteSettings, lang, fetchItems, fetchCategories, fetchSettings, isAuthenticated }) => {
  const t = translations[lang];
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate('/menu');
  }, [isAuthenticated, navigate]);

  const [heroImg, setHeroImg] = useState(siteSettings.heroImage);
  const [promoBannerImg, setPromoBannerImg] = useState(siteSettings.promoBannerImage || '');
  const [titleAr, setTitleAr] = useState(siteSettings.heroTitleAr);
  const [titleEn, setTitleEn] = useState(siteSettings.heroTitleEn);
  const [logoImg, setLogoImg] = useState(siteSettings.logoImage || '');

  // مناطق التوصيل
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [zoneName, setZoneName] = useState('');
  const [zoneFee, setZoneFee] = useState('');

  const fetchZones = async () => {
    try {
const res = await fetch('https://noss-kofta-production-d57f.up.railway.app/api/zones');
      const data = await res.json();
      setDeliveryZones(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleAddZone = async (e) => {
    e.preventDefault();
    if (!zoneName.trim() || !zoneFee) return;
    try {
      const res = await fetch('https://noss-kofta-production-d57f.up.railway.app/api/zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: zoneName.trim(), fee: Number(zoneFee) })
      });
      if (res.ok) {
        setZoneName('');
        setZoneFee('');
        fetchZones();
      }
    } catch (err) {}
  };

  const handleDeleteZone = async (id) => {
    if (!window.confirm("حذف هذه المنطقة؟")) return;
    try {
      const res = await fetch(`https://noss-kofta-production-d57f.up.railway.app/api/zones/${id}`, { method: 'DELETE' });
      if (res.ok) fetchZones();
    } catch (err) {}
  };

  const handleHeroImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const MAX_WIDTH = 1200; const MAX_HEIGHT = 800;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setHeroImg(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePromoBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const MAX_WIDTH = 1200; const MAX_HEIGHT = 600;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setPromoBannerImg(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const MAX_WIDTH = 300; const MAX_HEIGHT = 300;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setLogoImg(canvas.toDataURL('image/png', 0.9));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://noss-kofta-production-d57f.up.railway.app/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          heroImage: heroImg, 
          promoBannerImage: promoBannerImg, 
          heroTitleAr: titleAr, 
          heroTitleEn: titleEn, 
          logoImage: logoImg 
        })
      });
      if (res.ok) {
        alert("تم تحديث الواجهة واللوجو وبانر العروض بنجاح! 🚀🔥");
        fetchSettings();
      }
    } catch (err) {
      alert("خطأ أثناء الحفظ");
    }
  };

  const handleMoveCategory = async (index, direction) => {
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCategories.length) return;
    const temp = newCategories[index];
    newCategories[index] = newCategories[targetIndex];
    newCategories[targetIndex] = temp;

    try {
      await Promise.all(
        newCategories.map((cat, idx) => 
          fetch(`https://noss-kofta-production-d57f.up.railway.app/api/categories/${cat._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: idx })
          })
        )
      );
      fetchCategories();
    } catch (err) {}
  };

  const [editCatId, setEditCatId] = useState(null);
  const [catName, setCatName] = useState('');

  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [extras, setExtras] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || '');
  const [type, setType] = useState('normal');
  const [maxItems, setMaxItems] = useState('');
  const [isOffer, setIsOffer] = useState(false);
  
  const [addonName, setAddonName] = useState('');
  const [addonPrice, setAddonPrice] = useState('');
  const [addonsList, setAddonsList] = useState([]);

  const [boxItemNameInput, setBoxItemNameInput] = useState('');
  const [boxItemsList, setBoxItemsList] = useState([]);

  const [sizeNameInput, setSizeNameInput] = useState('');
  const [sizePriceInput, setSizePriceInput] = useState('');
  const [sizesList, setSizesList] = useState([]);

  const handleAddSize = () => {
    if (!sizeNameInput.trim() || !sizePriceInput) return;
    setSizesList([...sizesList, { name: sizeNameInput.trim(), price: Number(sizePriceInput) }]);
    setSizeNameInput('');
    setSizePriceInput('');
  };

  const handleRemoveSize = (index) => {
    setSizesList(sizesList.filter((_, i) => i !== index));
  };

  const handleAddBoxItemName = () => {
    if (!boxItemNameInput.trim()) return;
    setBoxItemsList([...boxItemsList, { name: boxItemNameInput.trim() }]);
    setBoxItemNameInput('');
  };

  const handleRemoveBoxItemName = (index) => {
    setBoxItemsList(boxItemsList.filter((_, i) => i !== index));
  };

  const handleAddAddon = () => {
    if (!addonName.trim() || !addonPrice) return;
    setAddonsList([...addonsList, { name: addonName.trim(), price: Number(addonPrice) }]);
    setAddonName('');
    setAddonPrice('');
  };

  const handleRemoveAddon = (index) => {
    setAddonsList(addonsList.filter((_, i) => i !== index));
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      let res;
      if (editCatId) {
        res = await fetch(`https://noss-kofta-production-d57f.up.railway.app/api/categories/${editCatId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName.trim() })
        });
      } else {
        res = await fetch('https://noss-kofta-production-d57f.up.railway.app/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: catName.trim() })
        });
      }

      if (res.ok) {
        setCatName('');
        setEditCatId(null);
        fetchCategories();
      }
    } catch (err) {}
  };

  const handleEditCategoryClick = (cat) => {
    setEditCatId(cat._id);
    setCatName(cat.name);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete?")) return;
    try {
      const res = await fetch(`https://noss-kofta-production-d57f.up.railway.app/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategories();
    } catch (err) {}
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height;
          const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          setImage(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const itemData = {
      name,
      price: Number(price),
      image: image || "https://via.placeholder.com/400x300/222/FFD700?text=Noss+Kofta",
      description,
      extras,
      category: category || categories[0]?.name || 'General',
      type,
      maxItems: type === 'box' ? Number(maxItems) : undefined,
      isOffer,
      addons: addonsList,
      boxItems: type === 'box' ? boxItemsList : [],
      sizes: sizesList
    };

    try {
      let res;
      if (editId) {
        res = await fetch(`https://noss-kofta-production-d57f.up.railway.app/api/items/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
      } else {
        res = await fetch('https://noss-kofta-production-d57f.up.railway.app/api/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        });
      }

      if (res.ok) {
        resetForm();
        fetchItems();
      }
    } catch (err) {}
  };

  const handleEditItemClick = (item) => {
    setEditId(item._id);
    setName(item.name);
    setPrice(item.price);
    setImage(item.image);
    setDescription(item.description || '');
    setExtras(item.extras || '');
    setCategory(item.category);
    setType(item.type || 'normal');
    setMaxItems(item.maxItems || '');
    setIsOffer(item.isOffer || false);
    setAddonsList(item.addons || []);
    setBoxItemsList(item.boxItems || []);
    setSizesList(item.sizes || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditId(null);
    setName(''); setPrice(''); setImage(''); setDescription(''); setExtras(''); setMaxItems(''); setType('normal');
    setIsOffer(false);
    setAddonsList([]);
    setBoxItemsList([]);
    setSizesList([]);
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete item?")) return;
    try {
      const res = await fetch(`https://noss-kofta-production-d57f.up.railway.app/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) fetchItems();
    } catch (err) {}
  };

  return (
    <section className="px-8 py-12 max-w-5xl mx-auto min-h-[80vh] bg-[#12080A] text-white">
      <div className="flex justify-between items-center mb-8 border-b border-[#3A1218] pb-4">
        <h2 className="text-3xl font-bold text-[#FFD700]">⚙️ لوحة الإدارة</h2>
        <Link className="text-zinc-400 hover:text-white underline" to="/menu">{t.menu}</Link>
      </div>

      {/* قسم إدارة مناطق التوصيل */}
      <div className="bg-[#1C0D10] p-6 rounded-2xl border border-[#800020]/60 mb-8 shadow-xl">
        <h3 className="text-xl font-bold text-[#FFD700] mb-4">🚚 إدارة مناطق التوصيل وأسعارها</h3>
        <form onSubmit={handleAddZone} className="flex flex-col md:flex-row gap-4 mb-6">
          <input 
            type="text" 
            placeholder="اسم المنطقة (مثل: الشروق)" 
            value={zoneName} 
            onChange={(e) => setZoneName(e.target.value)}
            className="flex-1 bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white text-sm"
          />
          <input 
            type="number" 
            placeholder="سعر التوصيل (مثل: 30)" 
            value={zoneFee} 
            onChange={(e) => setZoneFee(e.target.value)}
            className="w-full md:w-40 bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white text-sm"
          />
          <button type="submit" className="bg-[#800020] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#990026] transition shadow cursor-pointer">
            ➕ إضافة منطقة
          </button>
        </form>

        <div className="space-y-3">
          {deliveryZones.length === 0 ? (
            <p className="text-zinc-500 text-sm">لم يتم إضافة مناطق توصيل بعد.</p>
          ) : (
            deliveryZones.map((zone) => (
              <div key={zone._id} className="bg-[#12080A] border border-[#3A1218] px-4 py-3 rounded-xl flex items-center justify-between text-sm">
                <span className="font-bold text-[#FFD700]">{zone.name} — <span className="text-white">{zone.fee} جنيه</span></span>
                <button onClick={() => handleDeleteZone(zone._id)} className="text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg font-bold text-xs">✕ مسح</button>
              </div>
            ))
          )}
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-[#1C0D10] p-6 rounded-2xl border border-[#800020]/50 mb-8 shadow-xl">
        <h3 className="text-xl font-bold text-[#FFD700] mb-4">{t.siteSettings}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2 text-zinc-300">شعار المطعم (اللوجو)</label>
            <input type="file" accept="image/*" onChange={handleLogoUpload} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-1 text-white text-sm cursor-pointer mb-2" />
            {logoImg && <img src={logoImg} alt="Logo" className="w-16 h-16 object-contain rounded-xl border border-[#3A1218] bg-[#12080A]" />}
          </div>
          <div>
            <label className="block text-sm mb-2 text-zinc-300">صورة الواجهة الخلفية</label>
            <input type="file" accept="image/*" onChange={handleHeroImageUpload} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-1 text-white text-sm cursor-pointer mb-2" />
            <img src={heroImg} alt="Hero" className="w-full h-16 object-cover rounded-xl border border-[#3A1218]" />
          </div>
          <div>
            <label className="block text-sm mb-2 text-[#FFD700]">🎁 صورة بانر الخصم (تحت اطلب دلوقتي)</label>
            <input type="file" accept="image/*" onChange={handlePromoBannerUpload} className="w-full bg-[#12080A] border border-[#800020] rounded-xl p-1 text-white text-sm cursor-pointer mb-2" />
            {promoBannerImg ? (
              <div className="flex items-center gap-2">
                <img src={promoBannerImg} alt="Promo" className="w-full h-16 object-cover rounded-xl border border-[#FFD700]" />
                <button type="button" onClick={() => setPromoBannerImg('')} className="bg-red-500/20 text-red-400 px-2 py-1 rounded-lg text-xs font-bold">حذف</button>
              </div>
            ) : (
              <span className="text-xs text-zinc-500">لا توجد صورة مضافة حالياً</span>
            )}
          </div>
          <div className="space-y-2">
            <div>
              <label className="block text-xs mb-1 text-zinc-300">العنوان بالعربي</label>
              <input type="text" value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-2 text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs mb-1 text-zinc-300">العنوان بالإنجليزي</label>
              <input type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-2 text-white text-sm" />
            </div>
          </div>
        </div>
        <button type="submit" className="w-full bg-[#800020] text-white font-bold py-3 rounded-xl hover:bg-[#990026] transition shadow">
          💾 حفظ تعديلات الواجهة والبانر واللوجو
        </button>
      </form>

      {/* إدارة الأقسام */}
      <div className="bg-[#1C0D10] p-6 rounded-2xl border border-[#3A1218] mb-8 shadow-xl">
        <h3 className="text-xl font-bold text-[#FFD700] mb-4">{t.catManage}</h3>
        <form onSubmit={handleSaveCategory} className="flex gap-4 mb-6">
          <input 
            type="text" 
            placeholder="Category Name..." 
            value={catName} 
            onChange={(e) => setCatName(e.target.value)}
            className="flex-1 bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white"
          />
          <button type="submit" className="bg-[#800020] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#990026] transition shadow">
            {editCatId ? t.save : t.addCat}
          </button>
          {editCatId && (
            <button type="button" onClick={() => { setEditCatId(null); setCatName(''); }} className="bg-zinc-700 text-white px-4 rounded-xl font-bold">
              {t.cancel}
            </button>
          )}
        </form>

        <div className="space-y-3">
          {categories.map((cat, index) => (
            <div key={cat._id} className="bg-[#12080A] border border-[#3A1218] px-4 py-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-zinc-500 font-bold text-sm">#{index + 1}</span>
                <span className="font-bold text-[#FFD700]">{cat.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => handleMoveCategory(index, 'up')}
                  disabled={index === 0}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold ${index === 0 ? 'bg-[#1C0D10] text-zinc-600 cursor-not-allowed' : 'bg-[#220E13] text-[#FFD700] hover:bg-[#2A080D]'}`}
                >
                  ◀ تحريك للخارج
                </button>
                <button 
                  type="button" 
                  onClick={() => handleMoveCategory(index, 'down')}
                  disabled={index === categories.length - 1}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold ${index === categories.length - 1 ? 'bg-[#1C0D10] text-zinc-600 cursor-not-allowed' : 'bg-[#220E13] text-[#FFD700] hover:bg-[#2A080D]'}`}
                >
                  تحريك للداخل ▶
                </button>
                <button onClick={() => handleEditCategoryClick(cat)} className="text-[#FFD700] bg-[#800020]/20 px-3 py-1.5 rounded-lg text-xs font-bold">✏️</button>
                <button onClick={() => handleDeleteCategory(cat._id)} className="text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg text-xs font-bold">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* نموذج إضافة وتعديل صنف */}
      <form onSubmit={handleSaveItem} className="bg-[#1C0D10] p-6 rounded-2xl border border-[#3A1218] mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 shadow-xl">
        <h3 className="md:col-span-2 text-xl font-bold text-[#FFD700] mb-2">{t.itemManage}</h3>
        <div>
          <label className="block text-sm mb-2 text-zinc-300">Item Name *</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white" placeholder="Name" />
        </div>
        <div>
          <label className="block text-sm mb-2 text-zinc-300">Price *</label>
          <input type="number" required value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white" placeholder="Price" />
        </div>
        <div>
          <label className="block text-sm mb-2 text-zinc-300">Category *</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white">
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-2 text-zinc-300">Image</label>
          <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-1 text-white text-sm cursor-pointer" />
        </div>

        <div className="md:col-span-2 bg-[#12080A] p-4 rounded-xl border border-[#800020]/30 flex items-center gap-3">
          <input 
            type="checkbox" 
            id="isOfferCheck" 
            checked={isOffer} 
            onChange={(e) => setIsOffer(e.target.checked)}
            className="w-5 h-5 accent-[#800020] cursor-pointer" 
          />
          <label htmlFor="isOfferCheck" className="text-[#FFD700] font-bold cursor-pointer">
            🔥 عرض في الصفحة الرئيسية (اجعل هذا الصنف يظهر كعرض متحرك في الواجهة)
          </label>
        </div>

        <div>
          <label className="block text-sm mb-2 text-zinc-300">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white">
            <option value="normal">Normal (سندوتش أو وجبة عادية)</option>
            <option value="box">Box (بوكس مخصص قابل للاختيار)</option>
          </select>
        </div>

        {type === 'box' && (
          <div>
            <label className="block text-sm mb-2 text-[#FFD700]">Max Items in Box *</label>
            <input type="number" value={maxItems} onChange={(e) => setMaxItems(e.target.value)} className="w-full bg-[#12080A] border border-[#800020] rounded-xl p-3 text-white" placeholder="3" />
          </div>
        )}

        {type === 'box' && (
          <div className="md:col-span-2 bg-[#12080A] p-4 rounded-xl border border-[#800020]/50">
            <label className="block text-sm mb-2 text-[#FFD700] font-bold">📦 أسماء المكونات التي تظهر داخل البوكس</label>
            <div className="flex gap-2 mb-3">
              <input 
                type="text" 
                placeholder="اسم المكون" 
                value={boxItemNameInput} 
                onChange={(e) => setBoxItemNameInput(e.target.value)}
                className="flex-1 bg-[#1C0D10] border border-[#3A1218] rounded-xl p-2.5 text-white text-sm"
              />
              <button type="button" onClick={handleAddBoxItemName} className="bg-[#800020] text-white px-5 rounded-xl font-bold text-sm hover:bg-[#990026]">
                ➕ إضافة
              </button>
            </div>

            {boxItemsList.length > 0 && (
              <div className="space-y-2 mt-2">
                {boxItemsList.map((bItem, index) => (
                  <div key={index} className="flex justify-between items-center bg-[#12080A] px-3 py-2 rounded-xl border border-[#3A1218] text-sm">
                    <span className="text-[#FFD700] font-bold">{bItem.name}</span>
                    <button type="button" onClick={() => handleRemoveBoxItemName(index)} className="text-red-400 font-bold text-xs">✕ مسح</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* الأحجام والأسعار */}
        <div className="md:col-span-2 bg-[#12080A] p-4 rounded-xl border border-[#800020]/50">
          <label className="block text-sm mb-2 text-[#FFD700] font-bold">⚖️ أحجام الصنف وأسعارها (مثل: كيلو، نص، ربع)</label>
          <div className="flex gap-2 mb-3">
            <input 
              type="text" 
              placeholder="اسم الحجم (مثل: كيلو)" 
              value={sizeNameInput} 
              onChange={(e) => setSizeNameInput(e.target.value)}
              className="flex-1 bg-[#1C0D10] border border-[#3A1218] rounded-xl p-2.5 text-white text-sm"
            />
            <input 
              type="number" 
              placeholder="السعر (مثل: 400)" 
              value={sizePriceInput} 
              onChange={(e) => setSizePriceInput(e.target.value)}
              className="w-32 bg-[#1C0D10] border border-[#3A1218] rounded-xl p-2.5 text-white text-sm"
            />
            <button type="button" onClick={handleAddSize} className="bg-[#800020] text-white px-4 rounded-xl font-bold text-sm hover:bg-[#990026]">
              ➕ إضافة حجم
            </button>
          </div>

          {sizesList.length > 0 && (
            <div className="space-y-2 mt-2">
              {sizesList.map((sz, index) => (
                <div key={index} className="flex justify-between items-center bg-[#12080A] px-3 py-2 rounded-xl border border-[#3A1218] text-sm">
                  <span className="text-[#FFD700] font-bold">{sz.name} — {sz.price} ج</span>
                  <button type="button" onClick={() => handleRemoveSize(index)} className="text-red-400 font-bold text-xs">✕ مسح</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* الإضافات الاختيارية */}
        <div className="md:col-span-2 bg-[#12080A] p-4 rounded-xl border border-[#3A1218]">
          <label className="block text-sm mb-2 text-[#FFD700] font-bold">✨ الإضافات الاختيارية</label>
          <div className="flex gap-2 mb-3">
            <input 
              type="text" 
              placeholder="اسم الإضافة (مثلاً: إضافة بطاطس)" 
              value={addonName} 
              onChange={(e) => setAddonName(e.target.value)}
              className="flex-1 bg-[#1C0D10] border border-[#3A1218] rounded-xl p-2.5 text-white text-sm"
            />
            <input 
              type="number" 
              placeholder="السعر (مثلاً: 10)" 
              value={addonPrice} 
              onChange={(e) => setAddonPrice(e.target.value)}
              className="w-32 bg-[#1C0D10] border border-[#3A1218] rounded-xl p-2.5 text-white text-sm"
            />
            <button type="button" onClick={handleAddAddon} className="bg-[#800020] text-white px-4 rounded-xl font-bold text-sm hover:bg-[#990026]">
              ➕ إضافة
            </button>
          </div>

          {addonsList.length > 0 && (
            <div className="space-y-2 mt-2">
              {addonsList.map((addon, index) => (
                <div key={index} className="flex justify-between items-center bg-[#12080A] px-3 py-2 rounded-xl border border-[#3A1218] text-sm">
                  <span>{addon.name} (+{addon.price} ج)</span>
                  <button type="button" onClick={() => handleRemoveAddon(index)} className="text-red-400 font-bold text-xs">✕ مسح</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm mb-2 text-[#FFD700] font-bold">Description *</label>
          <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white" placeholder="Description..." />
        </div>

        <div className="md:col-span-2 mt-4 flex gap-4">
          <button type="submit" className="flex-1 bg-[#800020] text-white font-bold py-3.5 rounded-xl hover:bg-[#990026] transition shadow">
            {editId ? t.save : t.addItem}
          </button>
          {editId && (
            <button type="button" onClick={resetForm} className="bg-zinc-700 text-white px-6 rounded-xl font-bold">
              {t.cancel}
            </button>
          )}
        </div>
      </form>

      {/* عرض الأصناف مقسمة حسب الأقسام في لوحة التحكم */}
      <div className="space-y-10 mt-10">
        <h3 className="text-2xl font-bold text-[#FFD700] border-b border-[#3A1218] pb-3">📋 إدارة وترتيب الأصناف حسب الأقسام</h3>
        
        {categories.map(cat => {
          const catItems = menuItems.filter(item => item.category === cat.name);
          return (
            <div key={cat._id} className="bg-[#1C0D10] border border-[#3A1218] rounded-2xl p-6 shadow-xl">
              <h4 className="text-xl font-black text-[#FFD700] mb-4 border-r-4 border-[#800020] pr-3">
                📁 قسم: {cat.name} ({catItems.length} صنف)
              </h4>

              {catItems.length === 0 ? (
                <p className="text-zinc-500 text-sm">لا توجد أصناف في هذا القسم حالياً.</p>
              ) : (
                <div className="space-y-3">
                  {catItems.map((item, itemIndex) => (
                    <div key={item._id} className="bg-[#12080A] border border-[#3A1218] p-3.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-zinc-500 font-bold text-sm">#{itemIndex + 1}</span>
                        <img src={item.image} alt="" className="w-14 h-10 object-cover rounded-lg bg-[#1C0D10]" />
                        <div>
                          <h4 className="font-bold text-white">
                            {item.name} 
                            {item.type === 'box' && <span className="bg-[#800020] text-white text-xs px-2 py-0.5 rounded-md font-black mr-2">بوكس مخصص</span>}
                            {item.sizes && item.sizes.length > 0 && <span className="bg-[#C5A059] text-black text-xs px-2 py-0.5 rounded-md font-black mr-2">أحجام متعددة</span>}
                          </h4>
                          <span className="text-xs text-[#FFD700]">{item.price} ج</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button onClick={() => handleEditItemClick(item)} className="text-[#FFD700] bg-[#800020]/30 px-3.5 py-1.5 rounded-lg text-xs font-bold">✏️ تعديل</button>
                        <button onClick={() => handleDeleteItem(item._id)} className="text-red-400 bg-red-500/10 px-3.5 py-1.5 rounded-lg text-xs font-bold">✕ مسح</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ================= 4. صفحة السلة وإدخال بيانات التوصيل =================
const CartPage = ({ cart, setCart, lang }) => {
  const t = translations[lang];
  const itemsTotal = cart.reduce((sum, item) => sum + item.price, 0);

  const [orderType, setOrderType] = useState('delivery');
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  useEffect(() => {
    fetch('https://noss-kofta-production-d57f.up.railway.app/api/zones')
      .then(res => res.json())
      .then(data => {
        setDeliveryZones(data);
        if (data.length > 0) setSelectedZone(data[0]);
      })
      .catch(err => {});
  }, []);

  const groupedCart = cart.reduce((acc, item) => {
    const existing = acc.find(i => i.name === item.name);
    if (existing) {
      existing.quantity += 1;
    } else {
      acc.push({ ...item, quantity: 1 });
    }
    return acc;
  }, []);

  const deliveryFee = orderType === 'delivery' && selectedZone ? selectedZone.fee : 0;
  const grandTotal = itemsTotal + deliveryFee;

  const handleIncrease = (itemName) => {
    const itemToAdd = cart.find(i => i.name === itemName);
    if (itemToAdd) setCart([...cart, { ...itemToAdd }]);
  };

  const handleDecrease = (itemName) => {
    const indexToRemove = cart.findIndex(i => i.name === itemName);
    if (indexToRemove !== -1) {
      const newCart = [...cart];
      newCart.splice(indexToRemove, 1);
      setCart(newCart);
    }
  };

  const handleRemoveCompletely = (itemName) => {
    setCart(cart.filter(i => i.name !== itemName));
  };

  const sendOrderToWhatsApp = () => {
    if (cart.length === 0) return alert("السلة فارغة!");
    if (!customerName.trim()) return alert("من فضلك اكتب اسمك الكامل.");
    if (!customerPhone.trim() || customerPhone.length !== 11 || isNaN(customerPhone)) {
      return alert("من فضلك اكتب رقم تليفون صحيح مكون من 11 رقم.");
    }
    if (orderType === 'delivery' && !customerAddress.trim()) {
      return alert("من فضلك اكتب عنوان الاستلام بالتفصيل.");
    }

    let message = `🔥 أهلاً (نص كفتة)، عندي أوردر جديد:%0A%0A`;
    message += `👤 *الاسم:* ${customerName}%0A`;
    message += `📞 *التليفون:* ${customerPhone}%0A`;
    message += `📦 *نوع الاستلام:* ${orderType === 'delivery' ? 'توصيل دليفري 🛵' : 'استلام من الفرع 🏪'}%0A`;
    
    if (orderType === 'delivery') {
      message += `📍 *العنوان:* ${customerAddress}%0A`;
      if (selectedZone) {
        message += `🚚 *منطقة التوصيل:* ${selectedZone.name} (${selectedZone.fee} ج)%0A`;
      }
    }

    message += `%0A🛒 *الأصناف المطلوبة:*%0A`;
    groupedCart.forEach((item) => {
      message += `▪️ ${item.quantity}× ${item.name} — (${item.price * item.quantity} ج)%0A`;
    });

    message += `%0A-------------------%0A`;
    message += `🏷️ *قيمة الأصناف:* ${itemsTotal} ج%0A`;
    if (orderType === 'delivery') {
      message += `🚚 *سعر التوصيل:* ${deliveryFee} ج%0A`;
    }
    message += `💰 *الإجمالي النهائي: ${grandTotal} جنيه*%0A`;
    
    const whatsappUrl = `https://wa.me/201042258982?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section className="px-8 py-12 max-w-4xl mx-auto min-h-screen bg-[#12080A] text-white">
      <h2 className="text-3xl font-bold text-[#FFD700] mb-8 border-b border-[#3A1218] pb-4">{t.cart}</h2>
      
      {cart.length === 0 ? (
        <div className="border border-[#3A1218] bg-[#1C0D10] rounded-2xl p-10 text-center shadow-xl">
          <div className="text-zinc-600 text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-zinc-400 mb-4">{t.emptyCart}</h2>
          <Link to="/menu" className="text-[#FFD700] underline hover:text-white">{t.backToMenu}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#1C0D10] rounded-2xl p-6 border border-[#3A1218] shadow-xl">
            <h3 className="text-xl font-bold text-[#FFD700] mb-4">محتويات السلة</h3>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {groupedCart.map((item, index) => (
                <div key={index} className="flex justify-between items-center border-b border-[#3A1218] pb-3">
                  <div>
                    <h4 className="text-base font-bold text-white">{item.name}</h4>
                    <p className="text-[#FFD700] font-bold text-sm">{item.price * item.quantity} ج</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#12080A] border border-[#3A1218] rounded-xl px-2 py-1 gap-3">
                      <button onClick={() => handleDecrease(item.name)} className="text-[#FFD700] font-black text-lg hover:text-white">-</button>
                      <span className="font-black text-white">{item.quantity}</span>
                      <button onClick={() => handleIncrease(item.name)} className="text-[#FFD700] font-black text-lg hover:text-white">+</button>
                    </div>
                    
                    <button onClick={() => handleRemoveCompletely(item.name)} className="text-red-400 bg-red-500/10 px-2.5 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500/20">❌</button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#3A1218] space-y-2 text-sm text-zinc-300">
              <div className="flex justify-between"><span>سعر الأصناف:</span><span className="font-bold text-white">{itemsTotal} ج</span></div>
              {orderType === 'delivery' && (
                <div className="flex justify-between"><span>سعر التوصيل:</span><span className="font-bold text-[#FFD700]">{deliveryFee} ج</span></div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t-2 border-[#800020] flex justify-between items-center">
              <span className="text-lg font-bold">{t.total}</span>
              <span className="text-2xl font-black text-[#FFD700]">{grandTotal} جنيه</span>
            </div>
          </div>

          <div className="bg-[#1C0D10] rounded-2xl p-6 border border-[#3A1218] flex flex-col justify-between shadow-xl">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-[#FFD700] mb-2">بيانات التوصيل والاستلام</h3>
              
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button 
                  type="button"
                  onClick={() => setOrderType('delivery')}
                  className={`py-3 rounded-xl font-bold text-sm transition ${orderType === 'delivery' ? 'bg-[#800020] text-white border border-[#FFD700]' : 'bg-[#12080A] text-zinc-400 border border-[#3A1218]'}`}
                >
                  🛵 توصيل دليفري
                </button>
                <button 
                  type="button"
                  onClick={() => setOrderType('pickup')}
                  className={`py-3 rounded-xl font-bold text-sm transition ${orderType === 'pickup' ? 'bg-[#800020] text-white border border-[#FFD700]' : 'bg-[#12080A] text-zinc-400 border border-[#3A1218]'}`}
                >
                  🏪 استلام من الفرع
                </button>
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">الاسم الكامل *</label>
                <input type="text" placeholder="اكتب اسمك..." value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs text-zinc-300 mb-1">رقم التليفون (11 رقم) *</label>
                <input type="text" maxLength="11" placeholder="010xxxxxxxx" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, ''))} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white text-sm tracking-wider" />
              </div>

              {orderType === 'delivery' && (
                <>
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">اختر منطقة التوصيل *</label>
                    <select 
                      value={selectedZone ? selectedZone._id : ''}
                      onChange={(e) => {
                        const zone = deliveryZones.find(z => z._id === e.target.value);
                        setSelectedZone(zone);
                      }}
                      className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white text-sm cursor-pointer"
                    >
                      {deliveryZones.map(zone => (
                        <option key={zone._id} value={zone._id}>
                          {zone.name} ({zone.fee} جنيه)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">العنوان بالتفصيل *</label>
                    <textarea rows="2" placeholder="الشارع، رقم العمارة، الدور..." value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full bg-[#12080A] border border-[#3A1218] rounded-xl p-3 text-white text-sm" />
                  </div>
                </>
              )}
            </div>

            <button onClick={sendOrderToWhatsApp} className="w-full bg-[#25D366] text-black font-black text-lg py-4 rounded-xl hover:bg-[#20bd5a] transition mt-6 flex items-center justify-center gap-2 shadow-lg cursor-pointer">
              {t.whatsappOrder}
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

// ================= التطبيق الرئيسي =================
function App() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [siteSettings, setSiteSettings] = useState({ heroImage: '', promoBannerImage: '', heroTitleAr: 'أقوى العروض 🔥', heroTitleEn: 'Strongest Offers 🔥', logoImage: '' });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [lang, setLang] = useState('ar');

  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedAddon, setSelectedAddon] = useState(null);

  const t = translations[lang];

  const fetchItems = async () => {
    try {
      const res = await fetch('https://noss-kofta-production-d57f.up.railway.app/api/items');
      const data = await res.json();
      setMenuItems(data);
    } catch (err) {}
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('https://noss-kofta-production-d57f.up.railway.app/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (err) {}
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('https://noss-kofta-production-d57f.up.railway.app/api/settings');
      const data = await res.json();
      setSiteSettings(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchItems();
    fetchCategories();
    fetchSettings();
  }, []);

  const handleSecretLogoClick = () => {
    setLogoClicks(prev => {
      const newCount = prev + 1;
      if (newCount === 3) {
        const pass = window.prompt("🔒 Admin Password:");
        if (pass === "15926") {
          setIsAuthenticated(true);
          navigate('/secret-admin-dashboard');
        } else if (pass !== null) { alert("Wrong password!"); }
        return 0;
      }
      return newCount;
    });
  };

  const [isBoxModalOpen, setIsBoxModalOpen] = useState(false);
  const [activeBox, setActiveBox] = useState(null);
  const [boxSelections, setBoxSelections] = useState({});

  const handleOpenBox = (boxItem) => {
    setActiveBox(boxItem);
    const initialSelections = {};
    if (boxItem.boxItems && boxItem.boxItems.length > 0) {
      boxItem.boxItems.forEach(b => { initialSelections[b.name] = 0; });
    }
    setBoxSelections(initialSelections);
    setIsBoxModalOpen(true);
  };

  const totalSelected = Object.values(boxSelections).reduce((a, b) => a + b, 0);

  const handleUpdateSelection = (name, operation) => {
    if (operation === 'add' && totalSelected < activeBox.maxItems) {
      setBoxSelections({ ...boxSelections, [name]: boxSelections[name] + 1 });
    } else if (operation === 'remove' && boxSelections[name] > 0) {
      setBoxSelections({ ...boxSelections, [name]: boxSelections[name] - 1 });
    }
  };

  const handleAddBoxToCart = () => {
    if (totalSelected === activeBox.maxItems) {
      const detailsStr = Object.entries(boxSelections)
        .filter(([_, count]) => count > 0)
        .map(([name, count]) => `${name}: ${count}`)
        .join(', ');

      const customBoxItem = { ...activeBox, name: `${activeBox.name} (${detailsStr})` };
      setCart([...cart, customBoxItem]);
      setIsBoxModalOpen(false);
    }
  };

  const handleOpenItemDetailsModal = (item) => {
    const hasSizes = item.sizes && item.sizes.length > 0;
    const hasAddons = item.addons && item.addons.length > 0;
    if (hasSizes || hasAddons) {
      setSelectedItemDetail(item);
      setSelectedSize(hasSizes ? item.sizes[0] : null);
      setSelectedAddon(null);
    } else {
      setCart([...cart, item]);
    }
  };

  const basePrice = selectedSize ? selectedSize.price : (selectedItemDetail ? selectedItemDetail.price : 0);
  const currentItemTotalPrice = basePrice + (selectedAddon ? selectedAddon.price : 0);

  const handleAddCustomizedItemToCart = () => {
    if (!selectedItemDetail) return;
    let itemName = selectedItemDetail.name;
    if (selectedSize) itemName += ` (${selectedSize.name})`;
    if (selectedAddon) itemName += ` - ${selectedAddon.name}`;

    const finalItem = { ...selectedItemDetail, name: itemName, price: currentItemTotalPrice };
    setCart([...cart, finalItem]);
    setSelectedItemDetail(null); setSelectedSize(null); setSelectedAddon(null);
  };

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} className="min-h-screen bg-[#12080A] text-white font-sans flex flex-col justify-between relative">
      <nav className="bg-[#1C0D10] border-b border-[#800020]/60 sticky top-0 z-50 shadow-2xl">
        <div className="flex items-center justify-between px-8 py-3">
          <div onClick={handleSecretLogoClick} className="flex items-center cursor-pointer select-none">
            {siteSettings.logoImage ? (
              <img src={siteSettings.logoImage} alt="Logo" style={{ height: '75px', width: 'auto' }} className="object-contain" />
            ) : (
              <span className="text-3xl font-black text-[#FFD700] tracking-tighter">نص كفتة <span className="text-white text-sm">🔥</span></span>
            )}
          </div>
          
          <ul className="hidden md:flex gap-4 text-base font-bold">
            <li><Link to="/" className="bg-[#12080A] hover:bg-[#800020] text-zinc-300 hover:text-white border border-[#3A1218] px-6 py-2 rounded-xl transition shadow">الرئيسية</Link></li>
            <li><Link to="/menu" className="bg-[#12080A] hover:bg-[#800020] text-zinc-300 hover:text-white border border-[#3A1218] px-6 py-2 rounded-xl transition shadow">المنيو</Link></li>
          </ul>

          <div className="flex items-center gap-6">
            <Link to="/cart" className="flex items-center gap-2 bg-[#800020] text-white px-5 py-2.5 rounded-xl font-bold hover:bg-[#990026] transition shadow-lg">
              <span>🛒 السلة</span>
              <span className="bg-[#12080A] text-[#FFD700] px-2 py-0.5 rounded-full text-xs font-black">{cart.length}</span>
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage lang={lang} siteSettings={siteSettings} menuItems={menuItems} handleOpenItemDetails={handleOpenItemDetailsModal} cart={cart} setCart={setCart} />} />
          <Route path="/menu" element={<MenuPage menuItems={menuItems} categories={categories} lang={lang} handleOpenBox={handleOpenBox} handleOpenItemDetails={handleOpenItemDetailsModal} cart={cart} setCart={setCart} />} />
          <Route path="/secret-admin-dashboard" element={<AdminDashboard menuItems={menuItems} categories={categories} siteSettings={siteSettings} lang={lang} fetchItems={fetchItems} fetchCategories={fetchCategories} fetchSettings={fetchSettings} isAuthenticated={isAuthenticated} />} />
          <Route path="/cart" element={<CartPage cart={cart} setCart={setCart} lang={lang} />} />
        </Routes>
      </div>

      {selectedItemDetail && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C0D10] border border-[#800020] rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <button onClick={() => setSelectedItemDetail(null)} className="absolute top-4 left-4 text-red-400 text-xl font-bold">✕</button>
            <h3 className="text-3xl font-black text-white mb-4">{selectedItemDetail.name}</h3>
            
            {selectedItemDetail.sizes && selectedItemDetail.sizes.length > 0 && (
              <div className="mb-6 space-y-3">
                <h4 className="text-sm font-bold text-[#FFD700]">اختر الحجم:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedItemDetail.sizes.map((sz, idx) => (
                    <div key={idx} onClick={() => setSelectedSize(sz)} className={`p-3 rounded-xl border cursor-pointer flex flex-col items-center justify-center transition ${selectedSize === sz ? 'bg-[#800020]/30 border-[#FFD700] text-[#FFD700]' : 'bg-[#12080A] border-[#3A1218] text-zinc-300'}`}>
                      <span className="font-bold">{sz.name}</span>
                      <span className="text-sm font-black text-[#FFD700]">{sz.price} ج</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={handleAddCustomizedItemToCart} className="w-full bg-[#800020] text-white font-black py-4 rounded-xl hover:bg-[#990026] transition text-lg shadow-lg">
              أضف للسلة • {currentItemTotalPrice} ج
            </button>
          </div>
        </div>
      )}

      {/* مودال البوكسات */}
      {isBoxModalOpen && activeBox && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1C0D10] border border-[#800020] rounded-2xl w-full max-w-lg p-6 relative shadow-2xl">
            <button onClick={() => setIsBoxModalOpen(false)} className="absolute top-4 left-4 text-red-400 text-xl font-bold">✕</button>
            
            <h3 className="text-3xl font-black text-[#FFD700] mb-1">{activeBox.name}</h3>
            <p className="text-zinc-300 mb-6 border-b border-[#3A1218] pb-4 text-sm">
              اختر {activeBox.maxItems} أصناف. 
              <span className={`block mt-1 font-bold text-base ${totalSelected === activeBox.maxItems ? 'text-green-400' : 'text-[#FFD700]'}`}>
                تم اختيار: ({totalSelected} / {activeBox.maxItems})
              </span>
            </p>

            <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-1">
              {activeBox.boxItems && activeBox.boxItems.map((bItem, idx) => (
                <div key={idx} className="flex justify-between items-center bg-[#12080A] p-3.5 rounded-xl border border-[#3A1218]">
                  <span className="font-bold text-base text-white">{bItem.name}</span>
                  <div className="flex items-center gap-4">
                    <button onClick={() => handleUpdateSelection(bItem.name, 'remove')} className="w-8 h-8 bg-[#1C0D10] rounded-lg text-[#FFD700] font-bold">-</button>
                    <span className="text-xl w-4 text-center font-black text-white">{boxSelections[bItem.name] || 0}</span>
                    <button onClick={() => handleUpdateSelection(bItem.name, 'add')} className="w-8 h-8 bg-[#1C0D10] rounded-lg text-[#FFD700] font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleAddBoxToCart} disabled={totalSelected !== activeBox.maxItems} className={`w-full py-4 rounded-xl font-black text-lg transition ${totalSelected === activeBox.maxItems ? 'bg-[#800020] text-white hover:bg-[#990026] cursor-pointer shadow-lg' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'}`}>
              Add to Cart
            </button>
          </div>
        </div>
      )}

      <footer className="bg-[#1C0D10] border-t border-[#3A1218] mt-20 text-zinc-400 py-6 text-center text-xs">
        جميع الحقوق محفوظة © 2026 نص كفتة
      </footer>
    </div>
  );
}

export default App;