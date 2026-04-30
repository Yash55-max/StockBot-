console.log('script.js loaded');
/* Persisted shopping cart and products system */
let products = {
    individual: [],
    case: []
};

const defaultProducts = {
    individual: [
        { id: 1, brand: 'Sprite', category: 'Drinks', volume: 250, unit: 'ml', quantity: 50, price: 20, image: '🥤' },
        { id: 2, brand: 'Basmati Rice', category: 'Groceries', volume: 5, unit: 'Kg', quantity: 20, price: 650, image: '🌾' },
        { id: 3, brand: 'Fortune Oil', category: 'Groceries', volume: 1, unit: 'Litre', quantity: 40, price: 180, image: '🛢️' },
        { id: 4, brand: "Lay's Chips", category: 'Snacks', volume: 50, unit: 'Gm', quantity: 150, price: 20, image: '🍟' },
        { id: 10, brand: 'AA Batteries', category: 'Electronics', volume: 4, unit: 'Pcs', quantity: 25, price: 150, image: '🔋' }
    ],
    case: [
        { id: 5, brand: 'Sprite', category: 'Drinks', volume: 250, unit: 'ml', cases: 5, bottlesPerCase: 28, price: 480, image: '📦' },
        { id: 6, brand: 'Coke', category: 'Drinks', volume: 750, unit: 'ml', cases: 3, bottlesPerCase: 24, price: 880, image: '📦' }
    ]
};

function loadProducts() {
    const storedProducts = localStorage.getItem('products');
    console.log('loadProducts: storedProducts from localStorage:', storedProducts);
    if (storedProducts) {
        try {
            products = JSON.parse(storedProducts);
            console.log('Loaded products from localStorage:', products);

            // Deduplicate individual products by brand and volume
            const uniqueIndividual = [];
            const seen = new Set();
            products.individual.forEach(p => {
                const key = p.brand.toLowerCase() + '-' + p.volume;
                if (!seen.has(key)) {
                    uniqueIndividual.push(p);
                    seen.add(key);
                }
            });
            products.individual = uniqueIndividual;

            // Deduplicate case products by brand and volume
            const uniqueCase = [];
            const seenCase = new Set();
            products.case.forEach(p => {
                const key = p.brand.toLowerCase() + '-' + p.volume;
                if (!seenCase.has(key)) {
                    uniqueCase.push(p);
                    seenCase.add(key);
                }
            });
            products.case = uniqueCase;

        } catch (e) {
            console.error('Failed to parse products from localStorage:', e);
            products = JSON.parse(JSON.stringify(defaultProducts));
        }
    } else {
        console.log('No products found in localStorage, loading defaultProducts');
        products = JSON.parse(JSON.stringify(defaultProducts));
    }
}

function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
    console.log('Saved products to localStorage:', products);
}

let cart = [];

// Load cart from localStorage on initialization
const savedCart = localStorage.getItem('cart');
console.log('=== INITIAL CART LOAD ===');
console.log('Initial cart load - savedCart from localStorage:', savedCart);
console.log('Initial cart load - savedCart type:', typeof savedCart);
console.log('Initial cart load - savedCart length:', savedCart ? savedCart.length : 'null');
console.log('Initial cart load - localStorage keys:', Object.keys(localStorage));

if (savedCart) {
    try {
        cart = JSON.parse(savedCart);
        console.log('Cart loaded successfully from localStorage:', cart);
        console.log('Cart length after load:', cart.length);
        console.log('Cart is array:', Array.isArray(cart));

        // Check for case items specifically
        if (Array.isArray(cart) && cart.length > 0) {
            const caseItems = cart.filter(item => item.type === 'case');
            const individualItems = cart.filter(item => item.type === 'individual');
            console.log('Case items found on load:', caseItems.length);
            console.log('Individual items found on load:', individualItems.length);

            if (caseItems.length > 0) {
                console.log('Case items details:', caseItems);
            }
        }
    } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
        cart = [];
    }
} else {
    console.log('No saved cart found in localStorage');
}
console.log('=== END INITIAL CART LOAD ===');
let salesData = [];