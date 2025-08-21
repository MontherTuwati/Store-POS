// Stocks View Module - Handles inventory management functionality
const { api, notiflix, Swal, moment } = require('./app.js');

class StocksModule {
    constructor() {
        this.products = [];
        this.categories = [];
        this.isInitialized = false;
        this.currentFilter = 'all';
    }

    // Initialize stocks module
    init(products) {
        if (this.isInitialized) return;
        
        this.products = products || [];
        this.setupEventListeners();
        this.initializeProductTable();
        this.initializeFilters();
        this.isInitialized = true;
    }

    // Setup stocks-specific event listeners
    setupEventListeners() {
        // Filter events
        $('#category-filter').on('change', (e) => {
            this.filterByCategory(e.target.value);
        });

        $('#stock-filter').on('change', (e) => {
            this.filterByStockLevel(e.target.value);
        });

        // Search functionality
        $('#product-search').on('input', (e) => {
            this.searchProducts(e.target.value);
        });

        // Add product button
        $('#add-product').on('click', () => {
            this.showAddProductModal();
        });

        // Bulk actions
        $('#bulk-edit').on('click', () => {
            this.bulkEdit();
        });

        $('#export-stocks').on('click', () => {
            this.exportStocks();
        });
    }

    // Initialize product table
    initializeProductTable() {
        const tbody = $('#stocks-table tbody');
        tbody.empty();

        this.products.forEach(product => {
            const row = this.createProductRow(product);
            tbody.append(row);
        });

        this.attachTableEventListeners();
    }

    // Create product table row
    createProductRow(product) {
        const stockLevel = this.getStockLevel(product.stock);
        const stockClass = this.getStockClass(product.stock);
        
        return `
            <tr data-product-id="${product.id}">
                <td>
                    <img src="${product.image || '../../assets/images/default.jpg'}" 
                         alt="${product.name}" 
                         class="product-thumbnail" 
                         width="40" height="40">
                </td>
                <td>${product.name}</td>
                <td>${product.category || 'Uncategorized'}</td>
                <td>$${product.price}</td>
                <td>
                    <span class="badge ${stockClass}">${product.stock}</span>
                </td>
                <td>${stockLevel}</td>
                <td>${product.sku || 'N/A'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-product" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-warning adjust-stock" data-id="${product.id}">
                        <i class="fas fa-boxes"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-product" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }

    // Get stock level description
    getStockLevel(stock) {
        if (stock <= 0) return 'Out of Stock';
        if (stock <= 10) return 'Low Stock';
        if (stock <= 50) return 'Medium Stock';
        return 'In Stock';
    }

    // Get stock level CSS class
    getStockClass(stock) {
        if (stock <= 0) return 'bg-danger';
        if (stock <= 10) return 'bg-warning';
        if (stock <= 50) return 'bg-info';
        return 'bg-success';
    }

    // Initialize filters
    initializeFilters() {
        // Category filter
        const categories = [...new Set(this.products.map(p => p.category).filter(Boolean))];
        const categorySelect = $('#category-filter');
        
        categorySelect.append('<option value="all">All Categories</option>');
        categories.forEach(category => {
            categorySelect.append(`<option value="${category}">${category}</option>`);
        });

        // Stock level filter
        const stockSelect = $('#stock-filter');
        stockSelect.html(`
            <option value="all">All Stock Levels</option>
            <option value="out">Out of Stock</option>
            <option value="low">Low Stock (≤10)</option>
            <option value="medium">Medium Stock (11-50)</option>
            <option value="high">High Stock (>50)</option>
        `);
    }

    // Filter by category
    filterByCategory(category) {
        this.currentFilter = category;
        this.applyFilters();
    }

    // Filter by stock level
    filterByStockLevel(level) {
        this.currentFilter = level;
        this.applyFilters();
    }

    // Search products
    searchProducts(query) {
        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.sku?.toLowerCase().includes(query.toLowerCase())
        );
        
        this.renderProducts(filteredProducts);
    }

    // Apply all filters
    applyFilters() {
        let filteredProducts = this.products;

        // Apply category filter
        if (this.currentFilter !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.category === this.currentFilter);
        }

        // Apply stock level filter
        const stockFilter = $('#stock-filter').val();
        if (stockFilter !== 'all') {
            filteredProducts = filteredProducts.filter(p => {
                switch (stockFilter) {
                    case 'out': return p.stock <= 0;
                    case 'low': return p.stock > 0 && p.stock <= 10;
                    case 'medium': return p.stock > 10 && p.stock <= 50;
                    case 'high': return p.stock > 50;
                    default: return true;
                }
            });
        }

        this.renderProducts(filteredProducts);
    }

    // Render filtered products
    renderProducts(products) {
        const tbody = $('#stocks-table tbody');
        tbody.empty();

        if (products.length === 0) {
            tbody.append(`
                <tr>
                    <td colspan="8" class="text-center text-muted">
                        No products found matching the current filters
                    </td>
                </tr>
            `);
            return;
        }

        products.forEach(product => {
            const row = this.createProductRow(product);
            tbody.append(row);
        });

        this.attachTableEventListeners();
    }

    // Attach table event listeners
    attachTableEventListeners() {
        // Edit product
        $('.edit-product').on('click', (e) => {
            const productId = $(e.target).closest('button').data('id');
            this.editProduct(productId);
        });

        // Adjust stock
        $('.adjust-stock').on('click', (e) => {
            const productId = $(e.target).closest('button').data('id');
            this.adjustStock(productId);
        });

        // Delete product
        $('.delete-product').on('click', (e) => {
            const productId = $(e.target).closest('button').data('id');
            this.deleteProduct(productId);
        });
    }

    // Edit product
    editProduct(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;

        // Show edit modal with product data
        $('#editProductModal').modal('show');
        $('#edit-product-name').val(product.name);
        $('#edit-product-price').val(product.price);
        $('#edit-product-stock').val(product.stock);
        $('#edit-product-category').val(product.category);
        $('#edit-product-sku').val(product.sku);
        
        // Store product ID for save operation
        $('#editProductModal').data('product-id', productId);
    }

    // Adjust stock
    adjustStock(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;

        Swal.fire({
            title: `Adjust Stock for ${product.name}`,
            html: `
                <div class="form-group">
                    <label>Current Stock: ${product.stock}</label>
                    <input type="number" id="new-stock" class="form-control" value="${product.stock}">
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Update Stock',
            cancelButtonText: 'Cancel',
            preConfirm: () => {
                const newStock = document.getElementById('new-stock').value;
                return { stock: parseInt(newStock) };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                this.updateStock(productId, result.value.stock);
            }
        });
    }

    // Update stock
    async updateStock(productId, newStock) {
        try {
            const response = await $.ajax({
                url: `${api}inventory/products/${productId}/stock`,
                method: 'PUT',
                data: { stock: newStock }
            });

            if (response.success) {
                // Update local data
                const product = this.products.find(p => p.id == productId);
                if (product) {
                    product.stock = newStock;
                }

                // Refresh table
                this.applyFilters();
                notiflix.Notify.success('Stock updated successfully');
            } else {
                notiflix.Notify.failure('Failed to update stock');
            }
        } catch (error) {
            console.error('Error updating stock:', error);
            notiflix.Notify.failure('Failed to update stock');
        }
    }

    // Delete product
    deleteProduct(productId) {
        const product = this.products.find(p => p.id == productId);
        if (!product) return;

        Swal.fire({
            title: 'Delete Product',
            text: `Are you sure you want to delete "${product.name}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                this.performDelete(productId);
            }
        });
    }

    // Perform delete operation
    async performDelete(productId) {
        try {
            const response = await $.ajax({
                url: `${api}inventory/products/${productId}`,
                method: 'DELETE'
            });

            if (response.success) {
                // Remove from local data
                this.products = this.products.filter(p => p.id != productId);
                
                // Refresh table
                this.applyFilters();
                notiflix.Notify.success('Product deleted successfully');
            } else {
                notiflix.Notify.failure('Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            notiflix.Notify.failure('Failed to delete product');
        }
    }

    // Show add product modal
    showAddProductModal() {
        $('#addProductModal').modal('show');
    }

    // Bulk edit
    bulkEdit() {
        const selectedProducts = $('.product-checkbox:checked').map(function() {
            return $(this).val();
        }).get();

        if (selectedProducts.length === 0) {
            notiflix.Notify.warning('Please select products to edit');
            return;
        }

        // Show bulk edit modal
        $('#bulkEditModal').modal('show');
    }

    // Export stocks
    exportStocks() {
        const filteredProducts = this.getFilteredProducts();
        
        // Create CSV content
        const csvContent = this.createCSV(filteredProducts);
        
        // Download file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stocks_export_${moment().format('YYYY-MM-DD')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        
        notiflix.Notify.success('Stocks exported successfully');
    }

    // Get filtered products
    getFilteredProducts() {
        // Return currently filtered products
        return this.products; // This should be the filtered list
    }

    // Create CSV content
    createCSV(products) {
        const headers = ['Name', 'Category', 'Price', 'Stock', 'SKU'];
        const rows = products.map(p => [
            p.name,
            p.category || '',
            p.price,
            p.stock,
            p.sku || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    // Cleanup when leaving stocks view
    cleanup() {
        this.products = [];
        this.categories = [];
        this.isInitialized = false;
    }
}

// Create and export the stocks module
window.stocksModule = new StocksModule();

module.exports = StocksModule;