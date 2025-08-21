// POS View Module - Handles POS-specific functionality
const { api, notiflix, Swal, moment } = require('./app.js');

class POSModule {
    constructor() {
        this.cart = [];
        this.products = [];
        this.categories = [];
        this.customers = [];
        this.isInitialized = false;
    }

    // Initialize POS module
    init(products, categories, customers) {
        if (this.isInitialized) return;
        
        this.products = products || [];
        this.categories = categories || [];
        this.customers = customers || [];
        
        this.setupEventListeners();
        this.initializeProductGrid();
        this.initializeCart();
        this.isInitialized = true;
    }

    // Setup POS-specific event listeners
    setupEventListeners() {
        // Exit button functionality
        console.log('Setting up exit button listener...');
        const exitButton = $('#exit-pos');
        console.log('Exit button found:', exitButton.length > 0);
        
        exitButton.on('click', (e) => {
            console.log('Exit button clicked!');
            e.preventDefault();
            this.exitPOS();
        });

        // Category filter
        $('#category-filter').on('change', (e) => {
            this.filterProducts(e.target.value);
        });

        // Search functionality
        $('#product-search').on('input', (e) => {
            this.searchProducts(e.target.value);
        });

        // Cart actions
        $('#clear-cart').on('click', () => this.clearCart());
        $('#checkout').on('click', () => this.checkout());
    }

    // Initialize product grid
    initializeProductGrid() {
        const container = $('#product-grid');
        container.empty();

        this.products.forEach(product => {
            const productCard = this.createProductCard(product);
            container.append(productCard);
        });
    }

    // Create product card
    createProductCard(product) {
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image">
                    <img src="${product.image || '../../assets/images/default.jpg'}" alt="${product.name}">
                </div>
                <div class="product-info">
                    <h5>${product.name}</h5>
                    <p class="price">$${product.price}</p>
                    <p class="stock">Stock: ${product.stock}</p>
                    <button class="btn btn-primary add-to-cart" data-product-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `;
    }

    // Filter products by category
    filterProducts(categoryId) {
        const filteredProducts = categoryId === 'all' 
            ? this.products 
            : this.products.filter(p => p.category_id == categoryId);
        
        this.renderProducts(filteredProducts);
    }

    // Search products
    searchProducts(query) {
        const filteredProducts = this.products.filter(p => 
            p.name.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderProducts(filteredProducts);
    }

    // Render products
    renderProducts(products) {
        const container = $('#product-grid');
        container.empty();

        products.forEach(product => {
            const productCard = this.createProductCard(product);
            container.append(productCard);
        });

        // Reattach event listeners
        this.attachProductEventListeners();
    }

    // Attach product event listeners
    attachProductEventListeners() {
        $('.add-to-cart').on('click', (e) => {
            const productId = $(e.target).data('product-id');
            this.addToCart(productId);
        });
    }

    // Add product to cart
    addToCart(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id == productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.updateCartDisplay();
        notiflix.Notify.success(`${product.name} added to cart`);
    }

    // Initialize cart display
    initializeCart() {
        this.updateCartDisplay();
    }

    // Update cart display
    updateCartDisplay() {
        const tbody = $('#cart-items');
        tbody.empty();

        this.cart.forEach(item => {
            const row = `
                <tr>
                    <td>${item.name}</td>
                    <td>$${item.price}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-secondary decrease-quantity" data-id="${item.id}">-</button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary increase-quantity" data-id="${item.id}">+</button>
                    </td>
                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger remove-item" data-id="${item.id}">Remove</button>
                    </td>
                </tr>
            `;
            tbody.append(row);
        });

        this.updateCartTotal();
        this.attachCartEventListeners();
    }

    // Update cart total
    updateCartTotal() {
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        $('#cart-total').text(`$${total.toFixed(2)}`);
    }

    // Attach cart event listeners
    attachCartEventListeners() {
        $('.increase-quantity').on('click', (e) => {
            const productId = $(e.target).data('id');
            this.updateQuantity(productId, 1);
        });

        $('.decrease-quantity').on('click', (e) => {
            const productId = $(e.target).data('id');
            this.updateQuantity(productId, -1);
        });

        $('.remove-item').on('click', (e) => {
            const productId = $(e.target).data('id');
            this.removeFromCart(productId);
        });
    }

    // Update item quantity
    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id == productId);
        if (!item) return;

        item.quantity += change;
        
        if (item.quantity <= 0) {
            this.removeFromCart(productId);
        } else {
            this.updateCartDisplay();
        }
    }

    // Remove item from cart
    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id != productId);
        this.updateCartDisplay();
    }

    // Clear cart
    clearCart() {
        Swal.fire({
            title: 'Clear Cart',
            text: 'Are you sure you want to clear the cart?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, clear it',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.cart = [];
                this.updateCartDisplay();
                notiflix.Notify.success('Cart cleared');
            }
        });
    }

    // Checkout process
    async checkout() {
        if (this.cart.length === 0) {
            notiflix.Notify.warning('Cart is empty');
            return;
        }

        try {
            const orderData = {
                items: this.cart,
                total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                timestamp: new Date().toISOString()
            };

            const response = await $.post(`${api}transactions`, orderData);
            
            if (response.success) {
                notiflix.Notify.success('Order completed successfully');
                this.cart = [];
                this.updateCartDisplay();
                this.printReceipt(orderData);
            } else {
                notiflix.Notify.failure('Failed to complete order');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            notiflix.Notify.failure('Failed to complete order');
        }
    }

    // Print receipt
    printReceipt(orderData) {
        // Implementation for receipt printing
        console.log('Printing receipt:', orderData);
    }

    // Exit POS and return to home
    exitPOS() {
        // Check if there are items in cart
        if (this.cart.length > 0) {
            Swal.fire({
                title: 'Unsaved Items',
                text: 'You have items in your cart. Are you sure you want to exit?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, exit',
                cancelButtonText: 'Stay in POS',
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.navigateToHome();
                }
            });
        } else {
            this.navigateToHome();
        }
    }

    // Navigate back to home
    navigateToHome() {
        // Use the same navigation method as the main app
        window.location.href = '../views/home.html';
    }

    // Cleanup when leaving POS view
    cleanup() {
        this.cart = [];
        this.products = [];
        this.categories = [];
        this.customers = [];
        this.isInitialized = false;
    }
}

// Create and export the POS module
window.posModule = new POSModule();

// Initialize the POS module when the page loads
$(document).ready(() => {
    console.log('Initializing POS module...');
    window.posModule.init();
});

module.exports = POSModule;