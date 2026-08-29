export const categories = [
    "Mango Pickle",
    "Lemon Pickle",
    "Garlic Pickle",
    "Tomato Pickle",
    "Gongura Pickle",
    "Chicken Pickle",
    "Mutton Pickle",
    "Fish Pickle",
    "Prawn Pickle",
    "Mixed Pickle",
    "Amla Pickle",
    "Green Chilli Pickle",
    "Seasonal Specials",
    "Gift Boxes"
];

export const filterCategories = ["Seasonal", "Unseasonal", "Non veg"];

export const products = [
    {
        name: "Andhra Avakaya Mango Pickle",
        slug: "andhra-avakaya-mango-pickle",
        category: "Mango Pickle",
        price: 189,
        mrp: 229,
        rating: 4.9,
        image: "/products/avakaya.png",
        tag: "Best seller",
        description: "Sun-cured mango, cold-pressed sesame oil, mustard, chilli, and family spice balance.",
        ingredients: ["Raw mango", "Sesame oil", "Mustard", "Red chilli", "Rock salt"],
        nutrition: "Energy 62 kcal, fat 5g, carbohydrates 3g per serving",
        shelfLife: "9 months",
        storage: "Use a dry spoon and store in a cool place.",
        process: "Washed, air-dried, hand-cut, spice-coated, oil-matured, and batch-tested."
    },
    {
        name: "Gongura Leaf Pickle",
        slug: "gongura-leaf-pickle",
        category: "Gongura Pickle",
        price: 169,
        mrp: 199,
        rating: 4.8,
        image: "/products/gongura.png",
        tag: "Tangy",
        description: "Sour gongura leaves tempered with garlic, chilli, and roasted lentil spice.",
        ingredients: ["Gongura", "Garlic", "Chilli", "Fenugreek", "Groundnut oil"],
        nutrition: "Energy 54 kcal, fat 4g, iron-rich greens per serving",
        shelfLife: "6 months",
        storage: "Refrigerate after opening for freshest aroma.",
        process: "Leaves are cleaned, wilted, stone-ground, tempered, and rested overnight."
    },
    {
        name: "Natu Kodi Chicken Pickle",
        slug: "natu-kodi-chicken-pickle",
        category: "Chicken Pickle",
        price: 349,
        mrp: 399,
        rating: 4.9,
        image: "/products/chicken.png",
        tag: "Protein rich",
        description: "Boneless chicken cooked low and slow in a deeply aromatic Andhra masala.",
        ingredients: ["Chicken", "Ginger garlic", "Chilli", "Garam masala", "Oil"],
        nutrition: "Energy 110 kcal, protein 9g, fat 7g per serving",
        shelfLife: "4 months",
        storage: "Keep refrigerated after opening.",
        process: "Marinated, slow-cooked, oil-sealed, packed in sterilized jars."
    },
    {
        name: "Lemon Turmeric Pickle",
        slug: "lemon-turmeric-pickle",
        category: "Lemon Pickle",
        price: 149,
        mrp: 179,
        rating: 4.7,
        image: "/products/lemon.png",
        tag: "Classic",
        description: "Juicy lemons aged with turmeric, mustard, chilli, and mineral salt.",
        ingredients: ["Lemon", "Turmeric", "Mustard", "Chilli", "Salt"],
        nutrition: "Energy 38 kcal, vitamin C source per serving",
        shelfLife: "8 months",
        storage: "Store away from direct sunlight.",
        process: "Quartered lemons are salt-cured, spiced, and matured naturally."
    }
];

export const reviews = [
    { name: "Ananya R.", text: "Tastes exactly like my grandmother's avakaya. The oil and spice balance is beautiful.", rating: 5 },
    { name: "Vikram S.", text: "Fast delivery, premium packing, and the gongura has that proper home kitchen punch.", rating: 5 },
    { name: "Meera K.", text: "Gifted the pickle box for a housewarming. Everyone asked where it came from.", rating: 5 }
];

export const processSteps = ["Select seasonal produce", "Wash and sun-dry", "Hand-cut every batch", "Roast and grind spices", "Oil mature naturally", "Pack in sterilized jars"];
