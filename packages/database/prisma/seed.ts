import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Mango Pickle", slug: "mango-pickle", description: "Traditional raw mango pickles made with cold-pressed oils and authentic Andhra spices", image: "/categories/mango.jpg" },
  { name: "Gongura Pickle", slug: "gongura-pickle", description: "Tangy gongura (roselle) leaf pickles with garlic and aromatic tempering", image: "/categories/gongura.jpg" },
  { name: "Garlic Pickle", slug: "garlic-pickle", description: "Pungent garlic clove pickles tempered in sesame oil with red chilli", image: "/categories/garlic.jpg" },
  { name: "Lemon Pickle", slug: "lemon-pickle", description: "Juicy lemon pickles aged with turmeric, mustard, and mineral salt", image: "/categories/lemon.jpg" },
  { name: "Tomato Pickle", slug: "tomato-pickle", description: "Sweet and tangy tomato pickles with a rich Andhra masala base", image: "/categories/tomato.jpg" },
  { name: "Ginger Pickle", slug: "ginger-pickle", description: "Fiery ginger pickle with green chilli and lemon for digestive warmth", image: "/categories/ginger.jpg" },
  { name: "Mixed Pickle", slug: "mixed-pickle", description: "A medley of seasonal vegetables and spices in one aromatic jar", image: "/categories/mixed.jpg" },
  { name: "Chicken Pickle", slug: "chicken-pickle", description: "Boneless chicken slow-cooked in deeply aromatic Andhra masala", image: "/categories/chicken.jpg" },
  { name: "Mutton Pickle", slug: "mutton-pickle", description: "Tender mutton pieces in a rich, spicy gravy-style pickle", image: "/categories/mutton.jpg" },
  { name: "Special Pachallu", slug: "special-pachallu", description: "Rare and seasonal Andhra specialties — amla, raw tamarind, green chilli", image: "/categories/special.jpg" },
  { name: "Combo Packs", slug: "combo-packs", description: "Curated sets of our best pickles at a special combined price", image: "/categories/combo.jpg" },
  { name: "Gift Packs", slug: "gift-packs", description: "Premium gift boxes with handpicked pickle selections and gift notes", image: "/categories/gift.jpg" },
];

const products = [
  {
    name: "Andhra Avakaya Mango Pickle",
    slug: "andhra-avakaya-mango-pickle",
    categorySlug: "mango-pickle",
    shortDescription: "Traditional raw mango pickle with cold-pressed sesame oil and hand-ground spices.",
    description: "Our signature Avakaya is made with sun-cured raw mangoes, cold-pressed sesame oil, hand-pounded mustard, fiery red chilli, and rock salt. Each batch follows a generations-old traditional Andhra family recipe, where the mangoes are hand-selected for the perfect tartness. The pickle is oil-matured for a minimum of 7 days before packing, ensuring deep flavor absorption and that unmistakable Andhra heat balanced by the richness of nuvvula nune (sesame oil).",
    ingredients: ["Raw Mango", "Cold-pressed Sesame Oil", "Mustard Powder", "Red Chilli Powder", "Fenugreek", "Rock Salt"],
    allergens: ["Mustard", "Sesame"],
    tags: ["bestseller", "traditional", "veg"],
    nutrition: { energy: "62 kcal", fat: "5g", carbs: "3g", protein: "0.5g", serving: "15g" },
    shelfLife: "9 months",
    storage: "Use a dry spoon. Store in a cool, dark place. Refrigerate after opening.",
    process: "Mangoes are washed, sun-dried for 2 days, hand-cut, coated with freshly ground spices, mixed with cold-pressed sesame oil, matured in ceramic jars for 7 days, then packed in sterilized glass jars.",
    images: ["/products/avakaya-1.jpg", "/products/avakaya-2.jpg", "/products/avakaya-3.jpg"],
    isVeg: true,
    isFeatured: true,
    isBestSeller: true,
    variants: [
      { weight: "250g", sku: "UHT-AVA-250", mrp: 229, price: 189, stock: 120 },
      { weight: "500g", sku: "UHT-AVA-500", mrp: 399, price: 349, stock: 80 },
      { weight: "1kg", sku: "UHT-AVA-1000", mrp: 749, price: 649, stock: 40 },
    ],
  },
  {
    name: "Gongura Leaf Pickle",
    slug: "gongura-leaf-pickle",
    categorySlug: "gongura-pickle",
    shortDescription: "Sour gongura leaves tempered with garlic, chilli, and roasted lentil spice.",
    description: "Gongura (Roselle/Sorrel leaves) is the soul of Andhra cuisine. Our Gongura Pachadi is made with tender red-stemmed gongura leaves, stone-ground with garlic, green chillies, and a tempering of mustard, fenugreek, and urad dal in fresh groundnut oil. The result is a tangy, earthy, deeply aromatic pickle that pairs perfectly with hot rice and ghee.",
    ingredients: ["Gongura Leaves", "Garlic", "Green Chilli", "Fenugreek", "Urad Dal", "Groundnut Oil", "Mustard Seeds", "Salt"],
    allergens: ["Groundnut"],
    tags: ["tangy", "traditional", "veg", "iron-rich"],
    nutrition: { energy: "54 kcal", fat: "4g", carbs: "2g", protein: "1g", serving: "15g", iron: "2.1mg" },
    shelfLife: "6 months",
    storage: "Refrigerate after opening for freshest aroma.",
    process: "Leaves are cleaned, wilted in sun, stone-ground with garlic and chilli, tempered with spices in groundnut oil, rested overnight, and packed fresh.",
    images: ["/products/gongura-1.jpg", "/products/gongura-2.jpg", "/products/gongura-3.jpg"],
    isVeg: true,
    isFeatured: true,
    isBestSeller: true,
    variants: [
      { weight: "250g", sku: "UHT-GON-250", mrp: 199, price: 169, stock: 100 },
      { weight: "500g", sku: "UHT-GON-500", mrp: 369, price: 319, stock: 60 },
      { weight: "1kg", sku: "UHT-GON-1000", mrp: 699, price: 599, stock: 30 },
    ],
  },
  {
    name: "Natu Kodi Chicken Pickle",
    slug: "natu-kodi-chicken-pickle",
    categorySlug: "chicken-pickle",
    shortDescription: "Country chicken slow-cooked in a deeply aromatic Andhra masala with sesame oil.",
    description: "Made with boneless country chicken (Natu Kodi), slow-cooked in a robust blend of ginger-garlic paste, red chilli, garam masala, and cold-pressed sesame oil. This protein-rich pickle is a staple of Andhra non-veg cuisine — perfect as a side dish, in a wrap, or straight from the jar with hot rice. Every batch is prepared fresh, oil-sealed for preservation, and packed in tamper-proof jars.",
    ingredients: ["Boneless Chicken", "Ginger-Garlic Paste", "Red Chilli", "Garam Masala", "Sesame Oil", "Turmeric", "Salt"],
    allergens: ["Sesame"],
    tags: ["protein-rich", "non-veg", "bestseller"],
    nutrition: { energy: "110 kcal", fat: "7g", carbs: "1g", protein: "9g", serving: "30g" },
    shelfLife: "4 months",
    storage: "Keep refrigerated. Consume within 2 weeks of opening.",
    process: "Chicken is marinated in spices for 4 hours, slow-cooked on low flame, sealed with hot sesame oil, cooled, and packed in sterilized jars.",
    images: ["/products/chicken-1.jpg", "/products/chicken-2.jpg", "/products/chicken-3.jpg"],
    isVeg: false,
    isFeatured: true,
    isBestSeller: true,
    variants: [
      { weight: "250g", sku: "UHT-CHK-250", mrp: 399, price: 349, stock: 60 },
      { weight: "500g", sku: "UHT-CHK-500", mrp: 749, price: 649, stock: 40 },
      { weight: "1kg", sku: "UHT-CHK-1000", mrp: 1399, price: 1199, stock: 20 },
    ],
  },
  {
    name: "Lemon Turmeric Pickle",
    slug: "lemon-turmeric-pickle",
    categorySlug: "lemon-pickle",
    shortDescription: "Juicy lemons aged with turmeric, mustard, chilli, and mineral salt.",
    description: "Fresh lemons are quartered, salt-cured for 3 days, then mixed with turmeric, mustard powder, red chilli, and asafoetida. This classic pickle is a daily staple in Andhra households — tangy, mildly spicy, and rich in Vitamin C. Our recipe uses only sun-dried mineral salt for a cleaner taste.",
    ingredients: ["Lemon", "Turmeric", "Mustard Powder", "Red Chilli", "Asafoetida", "Mineral Salt", "Sesame Oil"],
    allergens: ["Mustard", "Sesame"],
    tags: ["classic", "vitamin-c", "veg", "daily-staple"],
    nutrition: { energy: "38 kcal", fat: "2g", carbs: "4g", protein: "0.3g", serving: "15g", vitaminC: "12mg" },
    shelfLife: "8 months",
    storage: "Store in a cool place away from direct sunlight.",
    process: "Lemons are quartered, salt-cured for 3 days, mixed with ground spices and sesame oil, matured in glass jars for 5 days, then packed.",
    images: ["/products/lemon-1.jpg", "/products/lemon-2.jpg", "/products/lemon-3.jpg"],
    isVeg: true,
    isFeatured: false,
    isBestSeller: false,
    variants: [
      { weight: "250g", sku: "UHT-LEM-250", mrp: 179, price: 149, stock: 150 },
      { weight: "500g", sku: "UHT-LEM-500", mrp: 329, price: 279, stock: 90 },
      { weight: "1kg", sku: "UHT-LEM-1000", mrp: 619, price: 529, stock: 45 },
    ],
  },
  {
    name: "Spicy Garlic Pickle",
    slug: "spicy-garlic-pickle",
    categorySlug: "garlic-pickle",
    shortDescription: "Whole garlic cloves in a fiery red chilli and sesame oil marinade.",
    description: "Plump, hand-peeled garlic cloves are marinated in a bold Andhra spice blend of red chilli, mustard, fenugreek, and cold-pressed sesame oil. This pickle delivers an intense garlic punch balanced by the warmth of roasted spices. Known for its immunity-boosting properties, it is a winter favourite across Telugu households.",
    ingredients: ["Garlic Cloves", "Red Chilli Powder", "Mustard", "Fenugreek", "Sesame Oil", "Salt", "Turmeric"],
    allergens: ["Mustard", "Sesame"],
    tags: ["spicy", "immunity", "veg", "winter-favourite"],
    nutrition: { energy: "72 kcal", fat: "5g", carbs: "5g", protein: "1.5g", serving: "15g" },
    shelfLife: "10 months",
    storage: "Use a dry spoon. Store in a cool, dark place.",
    process: "Garlic cloves are peeled, sun-dried briefly, coated in ground spices, immersed in hot sesame oil, cooled, and packed.",
    images: ["/products/garlic-1.jpg", "/products/garlic-2.jpg", "/products/garlic-3.jpg"],
    isVeg: true,
    isFeatured: false,
    isBestSeller: true,
    variants: [
      { weight: "250g", sku: "UHT-GAR-250", mrp: 219, price: 179, stock: 110 },
      { weight: "500g", sku: "UHT-GAR-500", mrp: 399, price: 339, stock: 70 },
      { weight: "1kg", sku: "UHT-GAR-1000", mrp: 749, price: 639, stock: 35 },
    ],
  },
  {
    name: "Tomato Pickle",
    slug: "tomato-pickle",
    categorySlug: "tomato-pickle",
    shortDescription: "Sweet, tangy tomato pickle with a rich jaggery-spice balance.",
    description: "Ripe tomatoes are slow-cooked with jaggery, tamarind, red chilli, and a special tempering of mustard, curry leaves, and fenugreek in groundnut oil. This pickle has a unique sweet-tangy-spicy profile that makes it a favourite with children and adults alike. A signature traditional Andhra handmade recipe.",
    ingredients: ["Tomato", "Jaggery", "Tamarind", "Red Chilli", "Mustard Seeds", "Fenugreek", "Curry Leaves", "Groundnut Oil", "Salt"],
    allergens: ["Groundnut", "Mustard"],
    tags: ["sweet-tangy", "kid-friendly", "veg"],
    nutrition: { energy: "48 kcal", fat: "3g", carbs: "5g", protein: "0.4g", serving: "15g" },
    shelfLife: "6 months",
    storage: "Refrigerate after opening.",
    process: "Tomatoes are blanched, cooked with jaggery and tamarind paste, tempered with spices in groundnut oil, and packed hot into sterilized jars.",
    images: ["/products/tomato-1.jpg", "/products/tomato-2.jpg", "/products/tomato-3.jpg"],
    isVeg: true,
    isFeatured: true,
    isBestSeller: false,
    variants: [
      { weight: "250g", sku: "UHT-TOM-250", mrp: 189, price: 159, stock: 130 },
      { weight: "500g", sku: "UHT-TOM-500", mrp: 349, price: 299, stock: 75 },
      { weight: "1kg", sku: "UHT-TOM-1000", mrp: 659, price: 569, stock: 40 },
    ],
  },
  {
    name: "Allam (Ginger) Pickle",
    slug: "allam-ginger-pickle",
    categorySlug: "ginger-pickle",
    shortDescription: "Fresh ginger pickle with green chilli and lemon for digestive warmth.",
    description: "Tender young ginger is sliced thin, marinated with fresh lemon juice, green chilli, mustard, and salt, then tempered in sesame oil. This digestive pickle is a traditional Andhra appetizer — served before meals to stimulate appetite. Its sharp, zingy flavor cuts through rich dishes perfectly.",
    ingredients: ["Fresh Ginger", "Green Chilli", "Lemon Juice", "Mustard", "Sesame Oil", "Salt", "Turmeric"],
    allergens: ["Mustard", "Sesame"],
    tags: ["digestive", "appetizer", "veg", "medicinal"],
    nutrition: { energy: "35 kcal", fat: "2g", carbs: "3g", protein: "0.4g", serving: "10g" },
    shelfLife: "5 months",
    storage: "Refrigerate. Best consumed within 3 months of opening.",
    process: "Ginger is washed, peeled, sliced, marinated with lemon and salt for 24 hours, mixed with ground spices, tempered in sesame oil, and packed.",
    images: ["/products/ginger-1.jpg", "/products/ginger-2.jpg", "/products/ginger-3.jpg"],
    isVeg: true,
    isFeatured: false,
    isBestSeller: false,
    variants: [
      { weight: "250g", sku: "UHT-GIN-250", mrp: 199, price: 169, stock: 90 },
      { weight: "500g", sku: "UHT-GIN-500", mrp: 369, price: 319, stock: 55 },
    ],
  },
  {
    name: "Mixed Vegetable Pickle",
    slug: "mixed-vegetable-pickle",
    categorySlug: "mixed-pickle",
    shortDescription: "A medley of raw mango, carrot, cauliflower, and green chilli in Andhra masala.",
    description: "A vibrant mix of raw mango, carrot, cauliflower, green chilli, and amla, all hand-cut and pickled in a unified Andhra spice blend with cold-pressed sesame oil. Each vegetable brings its own texture and taste — the crunch of carrot, the tang of mango, the bite of chilli — making every spoonful a unique experience.",
    ingredients: ["Raw Mango", "Carrot", "Cauliflower", "Green Chilli", "Amla", "Red Chilli", "Mustard", "Fenugreek", "Sesame Oil", "Salt"],
    allergens: ["Mustard", "Sesame"],
    tags: ["variety", "crunchy", "veg", "colourful"],
    nutrition: { energy: "55 kcal", fat: "4g", carbs: "3g", protein: "0.6g", serving: "15g" },
    shelfLife: "7 months",
    storage: "Use a dry spoon. Store in a cool place.",
    process: "Vegetables are washed, sun-dried, hand-cut, individually spiced, combined in sesame oil, matured for 5 days, and packed.",
    images: ["/products/mixed-1.jpg", "/products/mixed-2.jpg", "/products/mixed-3.jpg"],
    isVeg: true,
    isFeatured: false,
    isBestSeller: false,
    variants: [
      { weight: "250g", sku: "UHT-MIX-250", mrp: 209, price: 179, stock: 100 },
      { weight: "500g", sku: "UHT-MIX-500", mrp: 389, price: 339, stock: 65 },
      { weight: "1kg", sku: "UHT-MIX-1000", mrp: 729, price: 629, stock: 30 },
    ],
  },
  {
    name: "Mutton Pickle",
    slug: "mutton-pickle",
    categorySlug: "mutton-pickle",
    shortDescription: "Tender mutton pieces in a rich, spicy Andhra-style gravy pickle.",
    description: "Premium boneless mutton is pressure-cooked until tender, then slow-simmered in a rich masala of ginger, garlic, red chilli, garam masala, and cold-pressed sesame oil. This pickle has a thick, gravy-like consistency that makes it perfect as a side dish with biryani, roti, or plain rice. A true indulgence for meat lovers.",
    ingredients: ["Boneless Mutton", "Ginger-Garlic Paste", "Red Chilli", "Garam Masala", "Turmeric", "Sesame Oil", "Salt", "Curry Leaves"],
    allergens: ["Sesame"],
    tags: ["premium", "non-veg", "indulgent"],
    nutrition: { energy: "135 kcal", fat: "9g", carbs: "1g", protein: "12g", serving: "30g" },
    shelfLife: "3 months",
    storage: "Keep refrigerated at all times. Consume within 10 days of opening.",
    process: "Mutton is cleaned, pressure-cooked, sautéed in spices and sesame oil, slow-simmered for 45 minutes, oil-sealed, and packed in sterilized jars.",
    images: ["/products/mutton-1.jpg", "/products/mutton-2.jpg", "/products/mutton-3.jpg"],
    isVeg: false,
    isFeatured: false,
    isBestSeller: false,
    variants: [
      { weight: "250g", sku: "UHT-MUT-250", mrp: 499, price: 429, stock: 40 },
      { weight: "500g", sku: "UHT-MUT-500", mrp: 949, price: 819, stock: 25 },
    ],
  },
  {
    name: "Amla (Gooseberry) Pickle",
    slug: "amla-gooseberry-pickle",
    categorySlug: "special-pachallu",
    shortDescription: "Vitamin C-rich Indian gooseberry pickle with mustard and green chilli.",
    description: "Fresh Indian gooseberries (Amla) are cut, salted, and pickled with green chilli, mustard, fenugreek, and sesame oil. This superfood pickle is packed with Vitamin C and antioxidants. A tangy, mildly spicy pickle that is as healthy as it is delicious — a traditional Andhra winter specialty.",
    ingredients: ["Amla (Indian Gooseberry)", "Green Chilli", "Mustard", "Fenugreek", "Sesame Oil", "Salt", "Turmeric"],
    allergens: ["Mustard", "Sesame"],
    tags: ["superfood", "vitamin-c", "seasonal", "veg", "immunity"],
    nutrition: { energy: "42 kcal", fat: "3g", carbs: "4g", protein: "0.3g", serving: "15g", vitaminC: "28mg" },
    shelfLife: "8 months",
    storage: "Store in a cool, dry place. Refrigerate after opening.",
    process: "Amla is washed, cut, salted for 2 days, mixed with ground spices, tempered in sesame oil, and packed.",
    images: ["/products/amla-1.jpg", "/products/amla-2.jpg", "/products/amla-3.jpg"],
    isVeg: true,
    isFeatured: false,
    isBestSeller: false,
    variants: [
      { weight: "250g", sku: "UHT-AML-250", mrp: 199, price: 169, stock: 85 },
      { weight: "500g", sku: "UHT-AML-500", mrp: 369, price: 319, stock: 50 },
    ],
  },
  {
    name: "Andhra Pachallu Combo (3-Pack)",
    slug: "andhra-pachallu-combo-3-pack",
    categorySlug: "combo-packs",
    shortDescription: "Avakaya + Gongura + Lemon — the essential Andhra trio at 18% off.",
    description: "Our most-loved combination brings together three iconic Andhra pickles: the fiery Avakaya Mango, the tangy Gongura Leaf, and the classic Lemon Turmeric. Each jar is 250g, carefully packed in a premium box with tamper-proof seals. Perfect for stocking your kitchen or gifting to a fellow pickle lover.",
    ingredients: ["See individual product labels"],
    allergens: ["Mustard", "Sesame", "Groundnut"],
    tags: ["combo", "value", "bestseller", "gift-worthy"],
    nutrition: { note: "See individual product labels for nutrition information" },
    shelfLife: "6 months (shortest jar)",
    storage: "See individual jar labels.",
    process: "Each pickle is prepared independently following its traditional recipe, then curated and boxed together.",
    images: ["/products/combo-3-1.jpg", "/products/combo-3-2.jpg"],
    isVeg: true,
    isFeatured: true,
    isBestSeller: true,
    variants: [
      { weight: "3 × 250g", sku: "UHT-CMB3-750", mrp: 599, price: 489, stock: 50 },
    ],
  },
  {
    name: "Premium Gift Box (6-Pack)",
    slug: "premium-gift-box-6-pack",
    categorySlug: "gift-packs",
    shortDescription: "Six signature pickles in a handcrafted gift box with a personalized note.",
    description: "The ultimate pickle gift for festivals, housewarmings, and special occasions. This premium box includes 6 curated 250g jars: Avakaya Mango, Gongura Leaf, Lemon Turmeric, Spicy Garlic, Tomato, and Mixed Vegetable. Presented in a handcrafted wooden-finish box with a personalized gift note. Free delivery and gift wrapping included.",
    ingredients: ["See individual product labels"],
    allergens: ["Mustard", "Sesame", "Groundnut"],
    tags: ["gift", "premium", "festival", "housewarming"],
    nutrition: { note: "See individual product labels for nutrition information" },
    shelfLife: "6 months (shortest jar)",
    storage: "See individual jar labels.",
    process: "Each pickle is prepared independently. All jars are quality-checked, labelled, and assembled in a premium gift box.",
    images: ["/products/gift-6-1.jpg", "/products/gift-6-2.jpg", "/products/gift-6-3.jpg"],
    isVeg: true,
    isFeatured: true,
    isBestSeller: false,
    variants: [
      { weight: "6 × 250g", sku: "UHT-GFT6-1500", mrp: 1299, price: 999, stock: 30 },
    ],
  },
];

const coupons = [
  { code: "UHTWELCOME", description: "Welcome discount — 10% off your first order", percentOff: 10, minOrder: 299, maxDiscount: 150, perUserLimit: 1 },
  { code: "FIRST10", description: "Flat ₹100 off on orders above ₹500", amountOff: 100, minOrder: 500, perUserLimit: 1 },
  { code: "COMBO20", description: "20% off on combo and gift packs", percentOff: 20, minOrder: 499, maxDiscount: 300, perUserLimit: 3 },
  { code: "PICKLE50", description: "Flat ₹50 off — no minimum order", amountOff: 50, minOrder: 0, perUserLimit: 2 },
];

async function main() {
  console.log("🌶️  Seeding Ur Home Taste database...\n");

  // Admin user
  const passwordHash = await bcrypt.hash("UrHomeTaste@123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@urhometaste.in" },
    update: {},
    create: {
      name: "Ur Home Taste Admin",
      email: "admin@urhometaste.in",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
      referralCode: "UHTADMIN",
    },
  });
  console.log(`✅ Admin user: ${admin.email}`);

  // Test customer
  const customerHash = await bcrypt.hash("Customer@123", 12);
  const customer = await prisma.user.upsert({
    where: { email: "customer@test.com" },
    update: {},
    create: {
      name: "Test Customer",
      email: "customer@test.com",
      phone: "9876543210",
      passwordHash: customerHash,
      role: "CUSTOMER",
      isVerified: true,
      referralCode: "UHTCUST01",
    },
  });
  console.log(`✅ Test customer: ${customer.email}`);

  // Test address for customer
  await prisma.address.upsert({
    where: { id: "test-addr-1" },
    update: {},
    create: {
      id: "test-addr-1",
      userId: customer.id,
      fullName: "Test Customer",
      phone: "9876543210",
      line1: "12-3-456, Flat 201",
      line2: "Gandhi Nagar",
      city: "Vijayawada",
      state: "Andhra Pradesh",
      pincode: "520001",
      landmark: "Near Kanaka Durga Temple",
      isDefault: true,
    },
  });

  // Categories
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { description: cat.description, image: cat.image },
      create: { ...cat },
    });
  }
  console.log(`✅ ${categories.length} categories seeded`);

  // Products
  for (const prod of products) {
    const category = await prisma.category.findUniqueOrThrow({ where: { slug: prod.categorySlug } });
    const { categorySlug, variants, ...productData } = prod;
    await prisma.product.upsert({
      where: { slug: prod.slug },
      update: {},
      create: {
        ...productData,
        categoryId: category.id,
        variants: { create: variants },
      },
    });
  }
  console.log(`✅ ${products.length} products seeded (with ${products.reduce((s, p) => s + p.variants.length, 0)} variants)`);

  // Coupons
  const now = new Date();
  const yearFromNow = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365);
  for (const coup of coupons) {
    await prisma.coupon.upsert({
      where: { code: coup.code },
      update: {},
      create: {
        ...coup,
        amountOff: coup.amountOff ?? undefined,
        percentOff: coup.percentOff ?? undefined,
        maxDiscount: coup.maxDiscount ?? undefined,
        startsAt: now,
        endsAt: yearFromNow,
        isActive: true,
      },
    });
  }
  console.log(`✅ ${coupons.length} coupons seeded`);

  // Shipping config
  await prisma.shippingConfig.upsert({
    where: { id: "default-shipping" },
    update: {},
    create: {
      id: "default-shipping",
      flatRate: 59,
      freeShippingAbove: 999,
      estimatedDays: "2-5 business days",
      isActive: true,
    },
  });
  console.log("✅ Shipping config seeded");

  // Sample reviews
  const avakaya = await prisma.product.findUnique({ where: { slug: "andhra-avakaya-mango-pickle" } });
  if (avakaya) {
    await prisma.review.upsert({
      where: { productId_userId: { productId: avakaya.id, userId: customer.id } },
      update: {},
      create: {
        productId: avakaya.id,
        userId: customer.id,
        rating: 5,
        title: "Tastes exactly like my grandmother's avakaya",
        body: "The oil and spice balance is beautiful. Authentic Andhra flavour that reminds me of home. Will definitely order again!",
        isApproved: true,
      },
    });
  }
  console.log("✅ Sample reviews seeded");

  console.log("\n🎉 Seed complete!\n");
  console.log("Admin login:    admin@urhometaste.in / UrHomeTaste@123");
  console.log("Customer login: customer@test.com / Customer@123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
