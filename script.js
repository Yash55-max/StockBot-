console.log('script.js loaded');
/* Persisted shopping cart and products system */
let products = {
    individual: [],
    case: []
};

const defaultProducts = {
    individual: [
        { id: 1, brand: 'Sprite', volume: 250, quantity: 50, price: 20 },
        { id: 2, brand: 'Sprite', volume: 750, quantity: 30, price: 45 },
        { id: 3, brand: 'Thumbs Up', volume: 250, quantity: 40, price: 20 },
        { id: 4, brand: 'Thumbs Up', volume: 750, quantity: 35, price: 45 }
    ],
    case: [
        { id: 5, brand: 'Sprite', volume: 250, cases: 5, bottlesPerCase: 28, price: 480 },
        { id: 6, brand: 'Sprite', volume: 750, cases: 3, bottlesPerCase: 24, price: 880 },
        { id: 7, brand: 'Thumbs Up', volume: 250, cases: 2, bottlesPerCase: 28, price: 480 },
        { id: 8, brand: 'Thumbs Up', volume: 750, cases: 1, bottlesPerCase: 24, price: 880 },
        { id: 9, brand: 'Thumbs Up', volume: 2250, cases: 10, bottlesPerCase: 9, price: 760 }
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
console.log('Initial cart load - savedCart:', savedCart);
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

// Transaction history system
let transactions = [];

// Load transactions from localStorage
function loadTransactions() {
    const storedTransactions = localStorage.getItem('transactions');
    if (storedTransactions) {
        try {
            transactions = JSON.parse(storedTransactions);
        } catch (e) {
            console.error('Failed to parse transactions from localStorage:', e);
            transactions = [];
        }
    }
}

// Save transactions to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Create a new transaction
function createTransaction(cart, totalAmount, paymentMethod = 'Cash', customerName = 'Walk-in Customer') {
    const transaction = {
        id: generateTransactionId(),
        date: new Date().toISOString(),
        customer: customerName,
        items: cart.map(item => ({
            id: item.id,
            type: item.type,
            brand: item.brand,
            volume: item.volume,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        })),
        totalAmount: totalAmount,
        paymentMethod: paymentMethod,
        status: 'Completed'
    };
    
    transactions.push(transaction);
    saveTransactions();
    return transaction;
}

// Generate unique transaction ID
function generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `TXN-${timestamp}-${random}`;
}

// Display transaction history
function displayTransactionHistory() {
    const tableBody = document.getElementById('transactionTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        const date = new Date(transaction.date).toLocaleString();
        
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${date}</td>
            <td>${transaction.customer}</td>
            <td>${transaction.items.length} items</td>
            <td>₹${transaction.totalAmount.toFixed(2)}</td>
            <td>${transaction.paymentMethod}</td>
            <td><span class="status-${transaction.status.toLowerCase()}">${transaction.status}</span></td>
            <td>
                <button onclick="viewTransactionDetails('${transaction.id}')" class="btn-view">View</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
    
    updateTransactionStats();
}

// Update transaction statistics
function updateTransactionStats() {
    const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalTransactions = transactions.length;
    const itemsSold = transactions.reduce((sum, t) => sum + t.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    
    const totalRevenueElement = document.getElementById('totalRevenue');
    const totalTransactionsElement = document.getElementById('totalTransactions');
    const itemsSoldElement = document.getElementById('itemsSold');
    
    if (totalRevenueElement) totalRevenueElement.textContent = `₹${totalRevenue.toFixed(2)}`;
    if (totalTransactionsElement) totalTransactionsElement.textContent = totalTransactions;
    if (itemsSoldElement) itemsSoldElement.textContent = itemsSold;
}

// View transaction details
function viewTransactionDetails(transactionId) {
    const transaction = transactions.find(t => t.id === transactionId);
    if (!transaction) return;
    
    const modal = document.getElementById('transactionDetailsModal');
    const content = document.getElementById('transactionDetailsContent');
    
    if (!modal || !content) return;
    
    const date = new Date(transaction.date).toLocaleString();
    
    content.innerHTML = `
        <div class="transaction-details">
            <p><strong>Transaction ID:</strong> ${transaction.id}</p>
            <p><strong>Date & Time:</strong> ${date}</p>
            <p><strong>Customer:</strong> ${transaction.customer}</p>
            <p><strong>Payment Method:</strong> ${transaction.paymentMethod}</p>
            <p><strong>Status:</strong> ${transaction.status}</p>
            <hr>
            <h4>Items:</h4>
            <table class="transaction-items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Type</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${transaction.items.map(item => `
                        <tr>
                            <td>${item.brand} ${item.volume}ml</td>
                            <td>${item.type === 'individual' ? 'Bottle' : 'Case'}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.price}</td>
                            <td>₹${item.total.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <hr>
            <p class="total-amount"><strong>Total Amount: ₹${transaction.totalAmount.toFixed(2)}</strong></p>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Close transaction modal
function closeTransactionModal() {
    const modal = document.getElementById('transactionDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Filter transactions
function filterTransactions() {
    const filterValue = document.getElementById('transactionFilter').value;
    const tableBody = document.getElementById('transactionTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    let filteredTransactions = [...transactions];
    const now = new Date();
    
    switch (filterValue) {
        case 'today':
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            filteredTransactions = transactions.filter(t => new Date(t.date) >= today);
            break;
        case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredTransactions = transactions.filter(t => new Date(t.date) >= weekAgo);
            break;
        case 'month':
            const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            filteredTransactions = transactions.filter(t => new Date(t.date) >= monthAgo);
            break;
        default:
            // 'all' - no filtering needed
            break;
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        const date = new Date(transaction.date).toLocaleString();
        
        row.innerHTML = `
            <td>${transaction.id}</td>
            <td>${date}</td>
            <td>${transaction.customer}</td>
            <td>${transaction.items.length} items</td>
            <td>₹${transaction.totalAmount.toFixed(2)}</td>
            <td>${transaction.paymentMethod}</td>
            <td><span class="status-${transaction.status.toLowerCase()}">${transaction.status}</td>
            <td>
                <button onclick="viewTransactionDetails('${transaction.id}')" class="btn-view">View</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Export transaction history to CSV
function exportTransactionHistory() {
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }
    
    const headers = ['Transaction ID', 'Date', 'Customer', 'Items Count', 'Total Amount', 'Payment Method', 'Status'];
    const csvContent = [
        headers.join(','),
        ...transactions.map(t => [
            t.id,
            new Date(t.date).toLocaleString(),
            t.customer,
            t.items.length,
            t.totalAmount.toFixed(2),
            t.paymentMethod,
            t.status
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// Create sample transaction data for testing
function createSampleTransactions() {
    if (transactions.length > 0) {
        console.log('Sample transactions already exist, skipping creation');
        return;
    }
    
    const sampleTransactions = [
        {
            id: 'TXN-1703123456789-001',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
            customer: 'John Doe',
            mobile: '9876543210',
            address: '123 Main St, City',
            items: [
                {
                    id: 1,
                    type: 'individual',
                    brand: 'Sprite',
                    volume: 250,
                    quantity: 5,
                    price: 20,
                    total: 100
                }
            ],
            totalAmount: 100,
            paymentMethod: 'CASH',
            status: 'Completed'
        },
        {
            id: 'TXN-1703123456789-002',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            customer: 'Jane Smith',
            mobile: '9876543211',
            address: '456 Oak Ave, Town',
            items: [
                {
                    id: 5,
                    type: 'case',
                    brand: 'Sprite',
                    volume: 250,
                    quantity: 2,
                    price: 480,
                    total: 960
                }
            ],
            totalAmount: 960,
            paymentMethod: 'UPI',
            status: 'Completed'
        },
        {
            id: 'TXN-1703123456789-003',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
            customer: 'Mike Johnson',
            mobile: '9876543212',
            address: '789 Pine Rd, Village',
            items: [
                {
                    id: 3,
                    type: 'individual',
                    brand: 'Thumbs Up',
                    volume: 250,
                    quantity: 3,
                    price: 20,
                    total: 60
                },
                {
                    id: 4,
                    type: 'individual',
                    brand: 'Thumbs Up',
                    volume: 750,
                    quantity: 2,
                    price: 45,
                    total: 90
                }
            ],
            totalAmount: 150,
            paymentMethod: 'CASH',
            status: 'Completed'
        }
    ];
    
    transactions.push(...sampleTransactions);
    saveTransactions();
    console.log('Sample transactions created:', sampleTransactions.length);
}

// Check if we're on the admin page and initialize transaction history
function initializeAdminPage() {
    // Check if we're on the admin page
    if (window.location.pathname.includes('admin.html') || document.getElementById('transactionTableBody')) {
        console.log('Admin page detected, initializing transaction history');
        displayTransactionHistory();
        
        // Create sample transactions for testing (only if none exist)
        if (transactions.length === 0) {
            createSampleTransactions();
            displayTransactionHistory(); // Refresh display after creating samples
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadTransactions();
    
    // Check for duplicate IDs and fix them automatically
    if (fixDuplicateIds()) {
        console.log('Duplicate IDs were fixed, reloading products...');
        loadProducts();
    }
    
    // Log current product state for debugging
    logProductState();
    
    displayProducts();
    updateCartDisplay();
    displaySalesReport();

    // Delay displayStock to ensure DOM is fully ready
    setTimeout(() => {
        console.log('Calling displayStock()');
        displayStock();
        // Remove product grids display in admin.html as per user request
        // displayIndividualProducts();
        // displayCaseProducts();
        
        // Initialize admin page features if applicable
        initializeAdminPage();
    }, 100);

    // Excel file input handler
    const excelInput = document.getElementById('excelFileInput');
    if (excelInput) {
        excelInput.addEventListener('change', handleExcelFile, false);
    }

    // Theme toggle button event listener (only if element exists)
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function() {
            document.body.classList.toggle('dark-theme');
            if (document.body.classList.contains('dark-theme')) {
                themeToggleBtn.textContent = '☀️';
            } else {
                themeToggleBtn.textContent = '🌙';
            }
        });
    }
});

// Listen for localStorage changes to update stock dynamically (for index.html)
window.addEventListener('storage', function(event) {
    if (event.key === 'products') {
        console.log('Detected products update in localStorage, reloading products and updating display.');
        loadProducts();
        displayProducts();
        displayStock();
    }
});

// Handle Excel file input
function handleExcelFile(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('No file selected');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});

        // Assuming first sheet contains the stock data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {defval: ''});
        console.log('Parsed Excel data:', jsonData);

        // Process JSON data to update products
        updateProductsFromExcel(jsonData);
    };
    reader.readAsArrayBuffer(file);
}

// Handle CSV file input
function handleCSVFile(event) {
    const file = event.target.files[0];
    if (!file) {
        alert('No file selected');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((header, idx) => {
                obj[header] = values[idx];
            });
            return obj;
        });
        console.log('Parsed CSV data:', data);

        // Process CSV data to update products
        updateProductsFromCSV(data);
    };
    reader.readAsText(file);
}

// Update products from parsed CSV data
function updateProductsFromCSV(data) {
    // Clear current products
    products.individual = [];
    products.case = [];

    data.forEach(item => {
        // Expecting columns: Brand, Type, Volume (ml), Price (₹)per unit
        const type = item.Type ? item.Type.toLowerCase() : '';
        const brand = item.Brand || '';
        const volume = parseInt(item['Volume (ml)']) || 0;
        const price = parseFloat(item['Price (₹)per unit']) || 0;
        const quantity = 0; // Quantity not provided in CSV, default to 0

        if (type === 'individual') {
            // Check for existing product to merge
            let existingProduct = products.individual.find(p =>
                p.brand.toLowerCase() === brand.toLowerCase() &&
                p.volume === volume
            );
            if (existingProduct) {
                existingProduct.quantity += quantity;
                if (existingProduct.price !== price) {
                    existingProduct.price = price;
                }
            } else {
                products.individual.push({
                    id: generateNewId(),
                    brand: brand,
                    volume: volume,
                    quantity: quantity,
                    price: price,
                    image: '🥤'
                });
            }
        } else if (type === 'case') {
            // Check for existing product to merge
            let existingProduct = products.case.find(p =>
                p.brand.toLowerCase() === brand.toLowerCase() &&
                p.volume === volume
            );
            if (existingProduct) {
                existingProduct.cases += quantity;
                if (existingProduct.price !== price) {
                    existingProduct.price = price;
                }
            } else {
                products.case.push({
                    id: generateNewId(),
                    brand: brand,
                    volume: volume,
                    cases: quantity,
                    bottlesPerCase: 1,
                    price: price,
                    image: '📦'
                });
            }
        }
    });

    saveProducts();
    displayProducts();
    displayStock();
}

// Update products from parsed Excel JSON data
function updateProductsFromExcel(data) {
    // Clear current products
    products.individual = [];
    products.case = [];

    data.forEach(item => {
        // Expecting columns: Type, Brand, Volume, Quantity, Price, BottlesPerCase (optional)
        const type = item.Type ? item.Type.toLowerCase() : '';
        const brand = item.Brand || '';
        const volume = parseInt(item.Volume) || 0;
        const quantity = parseInt(item.Quantity) || 0;
        const price = parseFloat(item.Price) || 0;
        const bottlesPerCase = parseInt(item.BottlesPerCase) || 1;

        if (type === 'individual') {
            products.individual.push({
                id: generateNewId(),
                brand: brand,
                volume: volume,
                quantity: quantity,
                price: price,
                image: '🥤'
            });
        } else if (type === 'case') {
            products.case.push({
                id: generateNewId(),
                brand: brand,
                volume: volume,
                cases: quantity,
                bottlesPerCase: bottlesPerCase,
                price: price,
                image: '📦'
            });
        }
    });

    saveProducts();
    displayProducts();
    displayStock();
}

// Generate new unique ID for products
function generateNewId() {
    const allIds = products.individual.map(p => p.id).concat(products.case.map(p => p.id));
    return allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
}

// Display products in cart style
function displayProducts() {
    displayIndividualProducts();
    displayCaseProducts();
    // Reset all quantities to ensure clean state
    setTimeout(() => {
        resetAllQuantities();
        verifyUniqueIds();
    }, 100);
}

function displayIndividualProducts() {
    const container = document.getElementById('individualProducts');
    container.innerHTML = '';
    
    products.individual.forEach(product => {
        const card = createProductCard(product, 'individual');
        container.appendChild(card);
    });

    // Remove Add All to Cart button if exists
    let addButton = document.getElementById('addToCartIndividual');
    if (addButton) {
        addButton.remove();
    }
}

function displayCaseProducts() {
    const container = document.getElementById('caseProducts');
    container.innerHTML = '';
    
    products.case.forEach(product => {
        const card = createProductCard(product, 'case');
        container.appendChild(card);
    });

    // Remove Add All to Cart button if exists
    let addButton = document.getElementById('addToCartCase');
    if (addButton) {
        addButton.remove();
    }
}

function createProductCard(product, type) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    const maxQuantity = type === 'individual' ? product.quantity : product.cases;
    const unitText = type === 'individual' ? 'bottle' : 'case';
    
    // Create unique IDs for this product's quantity controls
    const quantityId = `qty-${type}-${product.id}`;
    const decreaseBtnId = `decrease-${type}-${product.id}`;
    const increaseBtnId = `increase-${type}-${product.id}`;
    const addToCartBtnId = `add-${type}-${product.id}`;
    
    console.log(`Creating product card for ${product.brand} ${product.volume}ml (${type})`);
    console.log(`Quantity ID: ${quantityId}`);
    console.log(`Decrease button ID: ${decreaseBtnId}`);
    console.log(`Increase button ID: ${increaseBtnId}`);
    console.log(`Add to cart button ID: ${addToCartBtnId}`);
    
    card.innerHTML = `
        <div class="product-info">
            <div class="product-name">${product.brand}</div>
            <div class="product-volume">${product.volume}ml</div>
            <div class="product-price">₹${product.price}</div>
            <div class="product-stock">${maxQuantity} ${unitText}${maxQuantity !== 1 ? 's' : ''} available</div>
            <div class="quantity-controls">
                <button class="quantity-btn" id="${decreaseBtnId}" data-product-id="${product.id}" data-type="${type}">-</button>
                <span class="quantity-display" id="${quantityId}">0</span>
                <button class="quantity-btn" id="${increaseBtnId}" data-product-id="${product.id}" data-type="${type}">+</button>
            </div>
            <button class="add-to-cart-btn" id="${addToCartBtnId}" data-product-id="${product.id}" data-type="${type}">Add to Cart</button>
        </div>
    `;
    
    // Add event listeners after creating the DOM elements
    const decreaseBtn = card.querySelector(`#${decreaseBtnId}`);
    const increaseBtn = card.querySelector(`#${increaseBtnId}`);
    const addToCartBtn = card.querySelector(`#${addToCartBtnId}`);
    
    console.log(`Attaching event listeners for ${product.brand} ${product.volume}ml (${type})`);
    console.log(`Decrease button found:`, decreaseBtn);
    console.log(`Increase button found:`, increaseBtn);
    console.log(`Add to cart button found:`, addToCartBtn);
    
    decreaseBtn.addEventListener('click', function() {
        console.log(`Decrease button clicked for ${product.brand} ${product.volume}ml (${type})`);
        decreaseQuantity(product.id, type);
    });
    
    increaseBtn.addEventListener('click', function() {
        console.log(`Increase button clicked for ${product.brand} ${product.volume}ml (${type})`);
        increaseQuantity(product.id, type);
    });
    
    addToCartBtn.addEventListener('click', function() {
        console.log(`Add to cart button clicked for ${product.brand} ${product.volume}ml (${type})`);
        addToCart(product.id, type);
    });
    
    return card;
}

// Cart management
function increaseQuantity(productId, type) {
    console.log(`Increasing quantity for product ${productId} of type ${type}`);
    const product = findProduct(productId, type);
    const display = document.getElementById(`qty-${type}-${productId}`);
    
    if (!display) {
        console.error(`Quantity display element not found for product ${productId} of type ${type}`);
        return;
    }
    
    const currentQty = parseInt(display.textContent);
    const maxQty = type === 'individual' ? product.quantity : product.cases;
    
    console.log(`Current quantity: ${currentQty}, Max quantity: ${maxQty}`);
    
    if (currentQty < maxQty) {
        display.textContent = currentQty + 1;
        console.log(`Quantity increased to: ${currentQty + 1}`);
    } else {
        console.log(`Cannot increase quantity beyond ${maxQty}`);
    }
}

function decreaseQuantity(productId, type) {
    console.log(`Decreasing quantity for product ${productId} of type ${type}`);
    const display = document.getElementById(`qty-${type}-${productId}`);
    
    if (!display) {
        console.error(`Quantity display element not found for product ${productId} of type ${type}`);
        return;
    }
    
    const currentQty = parseInt(display.textContent);
    
    if (currentQty > 0) {
        display.textContent = currentQty - 1;
        console.log(`Quantity decreased to: ${currentQty - 1}`);
    } else {
        console.log(`Cannot decrease quantity below 0`);
    }
}

function addToCart(productId, type) {
    console.log(`Adding to cart: product ${productId} of type ${type}`);
    const product = findProduct(productId, type);
    const quantityDisplay = document.getElementById(`qty-${type}-${productId}`);
    
    if (!quantityDisplay) {
        console.error(`Quantity display element not found for product ${productId} of type ${type}`);
        return;
    }
    
    const quantity = parseInt(quantityDisplay.textContent);
    console.log(`Quantity to add: ${quantity}`);
    
    if (quantity === 0) {
        alert('Please select a quantity');
        return;
    }
    
    const maxQuantity = type === 'individual' ? product.quantity : product.cases;
    if (quantity > maxQuantity) {
        alert(`Only ${maxQuantity} ${type === 'individual' ? 'bottles' : 'cases'} available`);
        return;
    }
    
    const existingItem = cart.find(item => item.id === productId && item.type === type);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: productId,
            type: type,
            brand: product.brand,
            volume: product.volume,
            price: product.price,
            quantity: quantity,
            bottlesPerCase: type === 'case' ? product.bottlesPerCase : 1,
            image: product.image
        });
    }
    
    // Update product stock
    if (type === 'individual') {
        product.quantity -= quantity;
    } else {
        product.cases -= quantity;
    }
    
    quantityDisplay.textContent = '0';
    displayProducts();
    updateCartDisplay();

    // Save cart to localStorage after update
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('=== CART SAVE DEBUG ===');
    console.log('Cart saved to localStorage:', JSON.stringify(cart));
    console.log('Cart array length:', cart.length);
    console.log('Current cart contents:', cart);
    
    // Verify localStorage was actually updated
    const savedData = localStorage.getItem('cart');
    console.log('localStorage verification - saved data:', savedData);
    console.log('localStorage verification - parsed data:', JSON.parse(savedData));
    console.log('=== END CART SAVE DEBUG ===');
    
    // Additional debugging for case items
    if (type === 'case') {
        console.log('=== CASE ITEM ADDED TO CART ===');
        console.log('Product added:', product);
        console.log('Cart item created:', {
            id: productId,
            type: type,
            brand: product.brand,
            volume: product.volume,
            price: product.price,
            quantity: quantity,
            bottlesPerCase: product.bottlesPerCase,
            image: product.image
        });
        console.log('Full cart after adding case item:', cart);
        console.log('localStorage cart data:', localStorage.getItem('cart'));
        
        // Double-check the case item was saved correctly
        const caseItems = cart.filter(item => item.type === 'case');
        console.log('Case items in cart after save:', caseItems);
        console.log('=== END CASE ITEM DEBUG ===');
    }
}

function addAllToCart(type) {
    const productsOfType = products[type];
    let addedAny = false;

    productsOfType.forEach(product => {
        const quantityDisplay = document.getElementById(`qty-${type}-${product.id}`);
        const quantity = parseInt(quantityDisplay.textContent);

        if (quantity > 0) {
            const maxQuantity = type === 'individual' ? product.quantity : product.cases;
            if (quantity > maxQuantity) {
                alert(`Only ${maxQuantity} ${type === 'individual' ? 'bottles' : 'cases'} available for ${product.brand} ${product.volume}ml`);
                return;
            }

            const existingItem = cart.find(item => item.id === product.id && item.type === type);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    id: product.id,
                    type: type,
                    brand: product.brand,
                    volume: product.volume,
                    price: product.price,
                    quantity: quantity,
                    bottlesPerCase: type === 'case' ? product.bottlesPerCase : 1,
                    image: product.image
                });
            }

            // Update product stock
            if (type === 'individual') {
                product.quantity -= quantity;
            } else {
                product.cases -= quantity;
            }

            quantityDisplay.textContent = '0';
            addedAny = true;
        }
    });

    if (!addedAny) {
        alert('Please select quantity for at least one product');
        return;
    }

    displayProducts();
    updateCartDisplay();

    // Save cart to localStorage after update
    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Cart saved to localStorage:', JSON.stringify(cart));
    console.log('Cart array length:', cart.length);
    console.log('Current cart contents:', cart);
}

function findProduct(productId, type) {
    return products[type].find(p => p.id === productId);
}

function updateCartDisplay() {
    console.log('=== UPDATE CART DISPLAY ===');
    console.log('Cart in updateCartDisplay:', cart);
    console.log('Cart length:', cart.length);
    console.log('Cart is array:', Array.isArray(cart));
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    console.log('Total items calculated:', totalItems);
    console.log('Total amount calculated:', totalAmount);
    
    const cartCountElement = document.getElementById('cartCount');
    const cartTotalElement = document.getElementById('cartTotal');
    
    if (cartCountElement && cartTotalElement) {
        cartCountElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
        cartTotalElement.textContent = `₹${totalAmount.toFixed(2)}`;
        console.log('Cart display updated successfully');
    } else {
        console.error('Cart display elements not found');
    }
    
    console.log('=== END UPDATE CART DISPLAY ===');
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    let totalAmount = 0;
    cart.forEach(item => {
        const total = item.price * item.quantity;
        totalAmount += total;
        
        salesData.push({
            type: item.type,
            brand: item.brand,
            volume: item.volume,
            quantity: item.quantity,
            price: item.price,
            total: total,
            date: new Date().toLocaleString()
        });
    });
    
    // Create transaction record
    createTransaction(cart, totalAmount);
    
    // Save cart to localStorage before checkout
    localStorage.setItem('cart', JSON.stringify(cart));
    alert(`Checkout successful! Total: ₹${totalAmount.toFixed(2)}`);
    cart = [];
    displayProducts();
    updateCartDisplay();
    displaySalesReport();
    
    // Update transaction history if on admin page
    if (document.getElementById('transactionTableBody')) {
        displayTransactionHistory();
    }
}

// Admin functions
function convertVolume() {
    const volumeLiters = parseFloat(document.getElementById('volumeLiters').value);
    const volumeMl = parseInt(document.getElementById('volume').value);
    
    if (volumeLiters && volumeLiters > 0) {
        // Convert litres to ml
        document.getElementById('volume').value = Math.round(volumeLiters * 1000);
        document.getElementById('volumeLiters').value = '';
    } else if (volumeMl && volumeMl > 0) {
        // Convert ml to litres
        document.getElementById('volumeLiters').value = (volumeMl / 1000).toFixed(1);
        document.getElementById('volume').value = '';
    } else {
        alert('Please enter a value in either litres or ml field to convert');
    }
}

function addProduct() {
    const type = document.getElementById('itemType').value;
    const brand = document.getElementById('brand').value;
    const volumeLiters = parseFloat(document.getElementById('volumeLiters').value);
    const volumeMl = parseInt(document.getElementById('volume').value);
    
    let volume;
    if (volumeMl && volumeMl > 0) {
        volume = volumeMl;
    } else if (volumeLiters && volumeLiters > 0) {
        volume = Math.round(volumeLiters * 1000);
    } else {
        alert('Please enter volume in either litres or ml');
        return;
    }
    const quantity = parseInt(document.getElementById('quantity').value);
    const price = parseFloat(document.getElementById('price').value);
    
    if (!brand || !volume || !quantity || !price) {
        alert('Please fill all fields');
        return;
    }
    
    // Check if product already exists
    let existingProduct;
    
    if (type === 'individual') {
        existingProduct = products.individual.find(p => 
            p.brand.toLowerCase() === brand.toLowerCase() && 
            p.volume === volume
        );
        
        if (existingProduct) {
            // Product exists, increment quantity
            existingProduct.quantity += quantity;
            // Optionally update price if different
            if (existingProduct.price !== price) {
                existingProduct.price = price;
            }
        } else {
            // Product doesn't exist, create new
            const newId = Math.max(...products.individual.map(p => p.id), ...products.case.map(p => p.id)) + 1;
            products.individual.push({
                id: newId,
                brand: brand,
                volume: volume,
                quantity: quantity,
                price: price,
                image: '🥤'
            });
        }
    } else {
        const bottlesPerCase = parseInt(document.getElementById('bottlesPerCase').value);
        if (!bottlesPerCase) {
            alert('Please enter bottles per case');
            return;
        }
        
        existingProduct = products.case.find(p => 
            p.brand.toLowerCase() === brand.toLowerCase() && 
            p.volume === volume
        );
        
        if (existingProduct) {
            // Product exists, increment quantity
            const oldCases = existingProduct.cases;
            existingProduct.cases += quantity;
            // Optionally update price and bottlesPerCase if different
            if (existingProduct.price !== price) {
                existingProduct.price = price;
            }
            if (existingProduct.bottlesPerCase !== bottlesPerCase) {
                existingProduct.bottlesPerCase = bottlesPerCase;
            }
            
            // Update corresponding individual bottles
            updateIndividualFromCase(brand, volume, bottlesPerCase, existingProduct.cases - oldCases);
        } else {
            // Product doesn't exist, create new
            const newId = Math.max(...products.individual.map(p => p.id), ...products.case.map(p => p.id)) + 1;
            products.case.push({
                id: newId,
                brand: brand,
                volume: volume,
                cases: quantity,
                bottlesPerCase: bottlesPerCase,
                price: price,
                image: '📦'
            });
            
            // Create corresponding individual bottles for new case
            createIndividualFromCase(brand, volume, bottlesPerCase, quantity, price);
        }
    }
    
    // Update initial stock as well
    saveProducts();
    displayProducts();
    displayStock();
    clearInputs();
    
    // Provide feedback to user
    const productType = type === 'individual' ? 'bottle' : 'case';
    const action = existingProduct ? 'updated' : 'added';
    alert(`Product ${action} successfully!`);
}

function clearInputs() {
    document.getElementById('brand').value = '';
    document.getElementById('volumeLiters').value = '';
    document.getElementById('volume').value = '';
    document.getElementById('quantity').value = '';
    document.getElementById('price').value = '';
    document.getElementById('bottlesPerCase').value = '';
}

// Display stock for admin
function displayStock() {
    console.log('displayStock called');
    console.log('products.individual:', products.individual);
    console.log('products.case:', products.case);
    displayIndividualStock();
    displayCaseStock();
}

function displayIndividualStock() {
    console.log('displayIndividualStock called');
    try {
        const container = document.getElementById('individualStockDisplay');
        if (!container) {
            console.error('displayIndividualStock: container with id "individualStockDisplay" not found in DOM');
            return;
        }
        container.innerHTML = '<table><tr><th>Brand</th><th>Volume</th><th>Stock</th><th>Price</th></tr>' +
            products.individual.map(p => 
                `<tr><td>${p.brand}</td><td>${p.volume}ml</td><td>${p.quantity}</td><td>₹${p.price}</td></tr>`
            ).join('') + '</table>';
    } catch (error) {
        console.error('Error in displayIndividualStock:', error);
    }
}

function displayCaseStock() {
    console.log('displayCaseStock called');
    try {
        const container = document.getElementById('caseStockDisplay');
        if (!container) {
            console.error('displayCaseStock: container with id "caseStockDisplay" not found in DOM');
            return;
        }
        container.innerHTML = '<table><tr><th>Brand</th><th>Volume</th><th>Cases</th><th>Bottles/Case</th><th>Price</th></tr>' +
            products.case.map(p => 
                `<tr><td>${p.brand}</td><td>${p.volume}ml</td><td>${p.cases}</td><td>${p.bottlesPerCase}</td><td>₹${p.price}</td></tr>`
            ).join('') + '</table>';
    } catch (error) {
        console.error('Error in displayCaseStock:', error);
    }
}

// Display sales report
function displaySalesReport() {
    const reportDiv = document.getElementById('salesReport');
    let totalSales = 0;
    
    let reportHTML = '<h3>Recent Sales:</h3>';
    salesData.slice(-10).reverse().forEach(sale => {
        const typeText = sale.type === 'individual' ? 'bottle' : 'case';
        reportHTML += `
            <p>${sale.date}: ${sale.quantity} ${typeText}${sale.quantity !== 1 ? 's' : ''} of ${sale.brand} ${sale.volume}ml - ₹${sale.total.toFixed(2)}</p>
        `;
        totalSales += sale.total;
    });
    
    reportHTML += `<h4>Total Sales: ₹${totalSales.toFixed(2)}</h4>`;
    reportDiv.innerHTML = reportHTML;
}

function addAllToCart(type) {
    const productsOfType = products[type];
    let addedAny = false;

    productsOfType.forEach(product => {
        const quantityDisplay = document.getElementById(`qty-${type}-${product.id}`);
        const quantity = parseInt(quantityDisplay.textContent);

        if (quantity > 0) {
            const maxQuantity = type === 'individual' ? product.quantity : product.cases;
            if (quantity > maxQuantity) {
                alert(`Only ${maxQuantity} ${type === 'individual' ? 'bottles' : 'cases'} available for ${product.brand} ${product.volume}ml`);
                return;
            }

            const existingItem = cart.find(item => item.id === product.id && item.type === type);

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    id: product.id,
                    type: type,
                    brand: product.brand,
                    volume: product.volume,
                    price: product.price,
                    quantity: quantity,
                    bottlesPerCase: type === 'case' ? product.bottlesPerCase : 1,
                    image: product.image
                });
            }

            // Update product stock
            if (type === 'individual') {
                product.quantity -= quantity;
            } else {
                product.cases -= quantity;
            }

            quantityDisplay.textContent = '0';
            addedAny = true;
        }
    });

    if (!addedAny) {
        alert('Please select quantity for at least one product');
        return;
    }

    displayProducts();
    updateCartDisplay();
}

function showCartItems() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }

    let message = 'Items in your cart:\n\n';
    cart.forEach(item => {
        message += `${item.brand} ${item.volume}ml - Quantity: ${item.quantity} - Price: ₹${item.price}\n`;
    });

    alert(message);
}

function toggleCartItems() {
    const container = document.getElementById('cartItemsContainer');
    if (container.style.display === 'none' || container.style.display === '') {
        renderCartItems();
        container.style.display = 'block';
        document.getElementById('showCartItemsBtn').textContent = 'Hide Added Items';
    } else {
        container.style.display = 'none';
        document.getElementById('showCartItemsBtn').textContent = 'Show Added Items';
    }
}

function renderCartItems() {
    const container = document.getElementById('cartItemsContainer');
    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }

    cart.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.style.display = 'flex';
        itemDiv.style.justifyContent = 'flex-start';
        itemDiv.style.alignItems = 'center';
        itemDiv.style.marginBottom = '8px';

        const itemInfo = document.createElement('span');
        itemInfo.textContent = `${item.brand} ${item.volume}ml - Quantity: ${item.quantity} - Price: ₹${item.price}`;

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.style.background = '#ff6b6b';
        removeBtn.style.color = 'white';
        removeBtn.style.border = 'none';
        removeBtn.style.borderRadius = '5px';
        removeBtn.style.padding = '2px 8px';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.marginLeft = '15px';
        removeBtn.onclick = () => removeCartItem(index);

        itemDiv.appendChild(itemInfo);
        itemDiv.appendChild(removeBtn);
        container.appendChild(itemDiv);
    });
}

function removeCartItem(index) {
    const item = cart[index];
    // Restore stock
    const product = findProduct(item.id, item.type);
    if (item.type === 'individual') {
        product.quantity += item.quantity;
    } else {
        product.cases += item.quantity;
    }
    // Remove from cart
    cart.splice(index, 1);
    updateCartDisplay();
    displayProducts();
    renderCartItems();
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('itemType').addEventListener('change', function() {
        const bottlesPerCaseInput = document.getElementById('bottlesPerCase');
        bottlesPerCaseInput.style.display = this.value === 'case' ? 'block' : 'none';
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            themeToggleBtn.textContent = '☀️';
        } else {
            themeToggleBtn.textContent = '🌙';
        }
    });
});

// Initialize displays
function displayStock() {
    displayIndividualStock();
    displayCaseStock();
    populateRemoveIndividualBrand();
    populateRemoveCaseBrand();
}

// Populate brand dropdown for removing individual stock
function populateRemoveIndividualBrand() {
    const brandSelect = document.getElementById('removeIndividualBrand');
    const volumeSelect = document.getElementById('removeIndividualVolume');
    const quantitySelect = document.getElementById('removeIndividualQuantity');
    if (!brandSelect || !quantitySelect || !volumeSelect) return;

    // Clear existing options
    brandSelect.innerHTML = '';
    volumeSelect.innerHTML = '';
    quantitySelect.innerHTML = '';

    // Get unique brands from individual products
    const brands = [...new Set(products.individual.map(p => p.brand))];

    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandSelect.appendChild(option);
    });

    // Populate volume for the first brand
    if (brands.length > 0) {
        populateRemoveIndividualVolume(brands[0]);
    }

    // Add event listener to update volume and quantity when brand changes
    brandSelect.onchange = function() {
        populateRemoveIndividualVolume(this.value);
    };
}

function populateRemoveIndividualVolume(brand) {
    const volumeSelect = document.getElementById('removeIndividualVolume');
    const quantitySelect = document.getElementById('removeIndividualQuantity');
    if (!volumeSelect || !quantitySelect) return;

    volumeSelect.innerHTML = '';
    quantitySelect.innerHTML = '';

    const filteredProducts = products.individual.filter(p => p.brand === brand);

    filteredProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.volume;
        option.textContent = product.volume + ' ml';
        volumeSelect.appendChild(option);
    });

    // Populate quantity for the first volume
    if (filteredProducts.length > 0) {
        populateRemoveIndividualQuantity(brand, filteredProducts[0].volume);
    }

    volumeSelect.onchange = function() {
        populateRemoveIndividualQuantity(brand, parseInt(this.value));
    };
}

function populateRemoveIndividualQuantity(brand, volume) {
    const quantitySelect = document.getElementById('removeIndividualQuantity');
    if (!quantitySelect) return;

    quantitySelect.innerHTML = '';

    const product = products.individual.find(p => p.brand === brand && p.volume === volume);
    if (product) {
        for (let i = 1; i <= product.quantity; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            quantitySelect.appendChild(option);
        }
    }
}

function populateRemoveCaseBrand() {
    const brandSelect = document.getElementById('removeCaseBrand');
    const volumeSelect = document.getElementById('removeCaseVolume');
    const quantitySelect = document.getElementById('removeCaseQuantity');
    if (!brandSelect || !quantitySelect || !volumeSelect) return;

    brandSelect.innerHTML = '';
    volumeSelect.innerHTML = '';
    quantitySelect.innerHTML = '';

    const brands = [...new Set(products.case.map(p => p.brand))];

    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        brandSelect.appendChild(option);
    });

    if (brands.length > 0) {
        populateRemoveCaseVolume(brands[0]);
    }

    brandSelect.onchange = function() {
        populateRemoveCaseVolume(this.value);
    };
}

function populateRemoveCaseVolume(brand) {
    const volumeSelect = document.getElementById('removeCaseVolume');
    const quantitySelect = document.getElementById('removeCaseQuantity');
    if (!volumeSelect || !quantitySelect) return;

    volumeSelect.innerHTML = '';
    quantitySelect.innerHTML = '';

    const filteredProducts = products.case.filter(p => p.brand === brand);

    filteredProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.volume;
        option.textContent = product.volume + ' ml';
        volumeSelect.appendChild(option);
    });

    if (filteredProducts.length > 0) {
        populateRemoveCaseQuantity(brand, filteredProducts[0].volume);
    }

    volumeSelect.onchange = function() {
        populateRemoveCaseQuantity(brand, parseInt(this.value));
    };
}

function populateRemoveCaseQuantity(brand, volume) {
    const quantitySelect = document.getElementById('removeCaseQuantity');
    if (!quantitySelect) return;

    quantitySelect.innerHTML = '';

    const product = products.case.find(p => p.brand === brand && p.volume === volume);
    if (product) {
        for (let i = 1; i <= product.cases; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            quantitySelect.appendChild(option);
        }
    }
}

function removeIndividualStock() {
    const brandSelect = document.getElementById('removeIndividualBrand');
    const volumeSelect = document.getElementById('removeIndividualVolume');
    const quantitySelect = document.getElementById('removeIndividualQuantity');
    if (!brandSelect || !quantitySelect || !volumeSelect) return;

    const brand = brandSelect.value;
    const volume = parseInt(volumeSelect.value);
    const quantity = parseInt(quantitySelect.value);

    const product = products.individual.find(p => p.brand === brand && p.volume === volume);
    if (product && quantity > 0 && quantity <= product.quantity) {
        product.quantity -= quantity;
        if (product.quantity === 0) {
            products.individual = products.individual.filter(p => p !== product);
        }
        saveProducts();
        displayStock();
        populateRemoveIndividualBrand();
    } else {
        alert('Invalid quantity selected for removal.');
    }
}

function removeCaseStock() {
    const brandSelect = document.getElementById('removeCaseBrand');
    const volumeSelect = document.getElementById('removeCaseVolume');
    const quantitySelect = document.getElementById('removeCaseQuantity');
    if (!brandSelect || !quantitySelect || !volumeSelect) return;

    const brand = brandSelect.value;
    const volume = parseInt(volumeSelect.value);
    const quantity = parseInt(quantitySelect.value);

    const product = products.case.find(p => p.brand === brand && p.volume === volume);
    if (product && quantity > 0 && quantity <= product.cases) {
        product.cases -= quantity;
        if (product.cases === 0) {
            products.case = products.case.filter(p => p !== product);
        }
        saveProducts();
        displayStock();
        populateRemoveCaseBrand();
    } else {
        alert('Invalid quantity selected for removal.');
    }
}

function displayIndividualStock() {
    const container = document.getElementById('individualStockDisplay');
    container.innerHTML = '<table><tr><th>Brand</th><th>Volume</th><th>Stock</th><th>Price</th></tr>' +
        products.individual.map(p => 
            `<tr><td>${p.brand}</td><td>${p.volume}ml</td><td>${p.quantity}</td><td>₹${p.price}</td></tr>`
        ).join('') + '</table>';
}

function displayCaseStock() {
    const container = document.getElementById('caseStockDisplay');
    container.innerHTML = '<table><tr><th>Brand</th><th>Volume</th><th>Cases</th><th>Bottles/Case</th><th>Price</th></tr>' +
        products.case.map(p => 
            `<tr><td>${p.brand}</td><td>${p.volume}ml</td><td>${p.cases}</td><td>${p.bottlesPerCase}</td><td>₹${p.price}</td></tr>`
        ).join('') + '</table>';
}

document.addEventListener('DOMContentLoaded', function() {
    displayProducts();
    displayStock();
    displaySalesReport();
    displayTransactionHistory();
    
    // Create sample transactions for testing (only if none exist)
    if (transactions.length === 0) {
        createSampleTransactions();
        displayTransactionHistory(); // Refresh display after creating samples
    }
});

// Helper function to create individual bottles from case
function createIndividualFromCase(brand, volume, bottlesPerCase, cases, casePrice) {
    const individualQuantity = bottlesPerCase * cases;
    const individualPrice = Math.round((casePrice / bottlesPerCase) * 100) / 100;
    
    // Check if individual product already exists
    let existingIndividual = products.individual.find(p => 
        p.brand.toLowerCase() === brand.toLowerCase() && 
        p.volume === volume
    );
    
    if (existingIndividual) {
        // Update existing individual product
        existingIndividual.quantity += individualQuantity;
    } else {
        // Create new individual product
        const newId = Math.max(...products.individual.map(p => p.id), ...products.case.map(p => p.id)) + 1;
        products.individual.push({
            id: newId,
            brand: brand,
            volume: volume,
            quantity: individualQuantity,
            price: individualPrice,
            image: '🥤'
        });
    }
}

// Helper function to update individual bottles when case quantity changes
function updateIndividualFromCase(brand, volume, bottlesPerCase, additionalCases) {
    const additionalQuantity = bottlesPerCase * additionalCases;
    
    // Find the corresponding individual product
    let individualProduct = products.individual.find(p => 
        p.brand.toLowerCase() === brand.toLowerCase() && 
        p.volume === volume
    );
    
    if (individualProduct) {
        // Update existing individual product
        individualProduct.quantity += additionalQuantity;
    } else {
        // Create new individual product if it doesn't exist
        const newId = Math.max(...products.individual.map(p => p.id), ...products.case.map(p => p.id)) + 1;
        const caseProduct = products.case.find(p => 
            p.brand.toLowerCase() === brand.toLowerCase() && 
            p.volume === volume
        );
        
        if (caseProduct) {
            const individualPrice = Math.round((caseProduct.price / bottlesPerCase) * 100) / 100;
            products.individual.push({
                id: newId,
                brand: brand,
                volume: volume,
                quantity: additionalQuantity,
                price: individualPrice,
                image: '🥤'
            });
        }
    }
}

// Reset all quantities to 0
function resetAllQuantities() {
    // Reset individual product quantities
    products.individual.forEach(product => {
        const display = document.getElementById(`qty-individual-${product.id}`);
        if (display) {
            display.textContent = '0';
        }
    });
    
    // Reset case product quantities
    products.case.forEach(product => {
        const display = document.getElementById(`qty-case-${product.id}`);
        if (display) {
            display.textContent = '0';
        }
    });
}

// Verify unique IDs for all product cards
function verifyUniqueIds() {
    console.log('=== VERIFYING UNIQUE IDs ===');
    
    const allQuantityDisplays = document.querySelectorAll('[id^="qty-"]');
    const allDecreaseBtns = document.querySelectorAll('[id^="decrease-"]');
    const allIncreaseBtns = document.querySelectorAll('[id^="increase-"]');
    const allAddToCartBtns = document.querySelectorAll('[id^="add-"]');
    
    console.log('Quantity displays found:', allQuantityDisplays.length);
    console.log('Decrease buttons found:', allDecreaseBtns.length);
    console.log('Increase buttons found:', allIncreaseBtns.length);
    console.log('Add to cart buttons found:', allAddToCartBtns.length);
    
    // Check for duplicate IDs
    const quantityIds = Array.from(allQuantityDisplays).map(el => el.id);
    const decreaseIds = Array.from(allDecreaseBtns).map(el => el.id);
    const increaseIds = Array.from(allIncreaseBtns).map(el => el.id);
    const addToCartIds = Array.from(allAddToCartBtns).map(el => el.id);
    
    const allIds = [...quantityIds, ...decreaseIds, ...increaseIds, ...addToCartIds];
    const uniqueIds = new Set(allIds);
    
    console.log('Total IDs:', allIds.length);
    console.log('Unique IDs:', uniqueIds.size);
    
    if (allIds.length !== uniqueIds.size) {
        console.error('DUPLICATE IDs FOUND!');
        const duplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
        console.error('Duplicate IDs:', duplicates);
    } else {
        console.log('All IDs are unique ✓');
    }
    
    console.log('=== END VERIFYING UNIQUE IDs ===');
}

// Test function for debugging quantity controls
function testQuantityControls() {
    console.log('=== TESTING QUANTITY CONTROLS ===');
    
    // Test individual products
    products.individual.forEach(product => {
        console.log(`Testing individual product: ${product.brand} ${product.volume}ml`);
        const display = document.getElementById(`qty-individual-${product.id}`);
        if (display) {
            console.log(`Quantity display found: ${display.id}, current value: ${display.textContent}`);
            
            // Test increase
            console.log('Testing increase...');
            increaseQuantity(product.id, 'individual');
            console.log(`After increase: ${display.textContent}`);
            
            // Test decrease
            console.log('Testing decrease...');
            decreaseQuantity(product.id, 'individual');
            console.log(`After decrease: ${display.textContent}`);
        } else {
            console.error(`Quantity display NOT found for individual product ${product.id}`);
        }
        console.log('---');
    });
    
    // Test case products
    products.case.forEach(product => {
        console.log(`Testing case product: ${product.brand} ${product.volume}ml`);
        const display = document.getElementById(`qty-case-${product.id}`);
        if (display) {
            console.log(`Quantity display found: ${display.id}, current value: ${display.textContent}`);
            
            // Test increase
            console.log('Testing increase...');
            increaseQuantity(product.id, 'case');
            console.log(`After increase: ${display.textContent}`);
            
            // Test decrease
            console.log('Testing decrease...');
            decreaseQuantity(product.id, 'case');
            console.log(`After decrease: ${display.textContent}`);
        } else {
            console.error(`Quantity display NOT found for case product ${product.id}`);
        }
        console.log('---');
    });
    
    console.log('=== END TESTING QUANTITY CONTROLS ===');
}

// Make test functions available globally for debugging
window.testQuantityControls = testQuantityControls;
window.verifyUniqueIds = verifyUniqueIds;
window.resetAllQuantities = resetAllQuantities;
window.resetProductIds = resetProductIds;
window.fixDuplicateIds = fixDuplicateIds;
window.logProductState = logProductState;

// Log current product state for debugging
function logProductState() {
    console.log('=== CURRENT PRODUCT STATE ===');
    console.log('Individual Products:');
    products.individual.forEach(product => {
        console.log(`  ID: ${product.id}, Brand: ${product.brand}, Volume: ${product.volume}ml, Stock: ${product.quantity}`);
    });
    
    console.log('Case Products:');
    products.case.forEach(product => {
        console.log(`  ID: ${product.id}, Brand: ${product.brand}, Volume: ${product.volume}ml, Stock: ${product.cases}`);
    });
    
    console.log('All Product IDs:', {
        individual: products.individual.map(p => p.id),
        case: products.case.map(p => p.id)
    });
    console.log('=== END PRODUCT STATE ===');
}

// Reset product IDs and clear localStorage to fix quantity control issues
function resetProductIds() {
    console.log('Resetting product IDs to fix quantity control issues...');
    
    // Clear localStorage to start fresh
    localStorage.removeItem('products');
    localStorage.removeItem('cart');
    
    // Reset products to default
    products = JSON.parse(JSON.stringify(defaultProducts));
    
    // Ensure unique IDs
    products.individual.forEach((product, index) => {
        product.id = index + 1;
    });
    
    products.case.forEach((product, index) => {
        product.id = index + 100; // Start case IDs from 100
    });
    
    // Save fresh products
    saveProducts();
    
    // Reset cart
    cart = [];
    
    console.log('Product IDs reset successfully');
    console.log('Individual product IDs:', products.individual.map(p => p.id));
    console.log('Case product IDs:', products.case.map(p => p.id));
    
    // Refresh display
    displayProducts();
    updateCartDisplay();
}

// Automatically detect and fix duplicate product IDs
function fixDuplicateIds() {
    console.log('Checking for duplicate product IDs...');
    
    let hasDuplicates = false;
    
    // Check individual products
    const individualIds = products.individual.map(p => p.id);
    const individualDuplicates = individualIds.filter((id, index) => individualIds.indexOf(id) !== index);
    
    if (individualDuplicates.length > 0) {
        console.error('Duplicate IDs found in individual products:', individualDuplicates);
        hasDuplicates = true;
    }
    
    // Check case products
    const caseIds = products.case.map(p => p.id);
    const caseDuplicates = caseIds.filter((id, index) => caseIds.indexOf(id) !== index);
    
    if (caseDuplicates.length > 0) {
        console.error('Duplicate IDs found in case products:', caseDuplicates);
        hasDuplicates = true;
    }
    
    // Check for conflicts between individual and case products
    const allIds = [...individualIds, ...caseIds];
    const allDuplicates = allIds.filter((id, index) => allIds.indexOf(id) !== index);
    
    if (allDuplicates.length > 0) {
        console.error('Conflicts between individual and case products:', allDuplicates);
        hasDuplicates = true;
    }
    
    if (hasDuplicates) {
        console.log('Fixing duplicate IDs...');
        resetProductIds();
        return true;
    } else {
        console.log('No duplicate IDs found ✓');
        return false;
    }
}

