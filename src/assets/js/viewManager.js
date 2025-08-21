// View Manager for StorePOS - Handles lazy loading and view switching
const { ipcRenderer } = require('electron');
const path = require('path');

// Global API configuration
const api = "http://localhost:8001/api/";

class ViewManager {
    constructor() {
        this.currentView = null;
        this.loadedViews = new Set();
        this.viewData = new Map();
        this.isLoading = false;
    }

    // Initialize the view manager
    init() {
        this.setupEventListeners();
        this.loadView('home'); // Start with home view
    }

    // Setup navigation event listeners
    setupEventListeners() {
        // Navigation buttons
        $('#dashboard').on('click', () => this.switchView('home'));
        $('#pointofsale').on('click', () => this.switchView('pos'));
        $('#stocks').on('click', () => this.switchView('stocks'));
        $('#transactions').on('click', () => this.switchView('transactions'));
        $('#statistics').on('click', () => this.switchView('statistics'));
        $('#settings').on('click', () => this.showSettingsModal());
        $('#logout-options').on('click', () => this.logout());
    }

    // Switch to a different view
    async switchView(viewName) {
        if (this.isLoading || this.currentView === viewName) return;
        
        this.isLoading = true;
        this.showGlobalLoader();

        try {
            // Hide current view
            if (this.currentView) {
                $(`#${this.currentView}_view`).hide();
                $(`#${this.currentView}`).removeClass('active');
            }

            // Show new view button as active
            $(`#${viewName}`).addClass('active');

            // Load view if not already loaded
            if (!this.loadedViews.has(viewName)) {
                await this.loadViewContent(viewName);
                this.loadedViews.add(viewName);
            }

            // Show the view
            $(`#${viewName}_view`).show();
            this.currentView = viewName;

            // Load view-specific data
            await this.loadViewData(viewName);

        } catch (error) {
            console.error(`Error switching to view ${viewName}:`, error);
            notiflix.Notify.failure('Failed to load view');
        } finally {
            this.hideGlobalLoader();
            this.isLoading = false;
        }
    }

    // Load view content dynamically
    async loadViewContent(viewName) {
        return new Promise((resolve, reject) => {
            $.get(`../../renderer/views/${viewName}.html`)
                .done((content) => {
                    // Extract the body content and append to main container
                    const $content = $(content);
                    const viewContent = $content.find(`#${viewName}_view`);
                    
                    if (viewContent.length) {
                        $('.main_app').append(viewContent);
                        
                        // Load view-specific JavaScript
                        this.loadViewScript(viewName);
                        resolve();
                    } else {
                        reject(new Error(`View content not found for ${viewName}`));
                    }
                })
                .fail((error) => {
                    reject(error);
                });
        });
    }

    // Load view-specific JavaScript
    loadViewScript(viewName) {
        const scriptPath = `../../assets/js/${viewName}.js`;
        
        // Check if script already loaded
        if (document.querySelector(`script[src*="${viewName}.js"]`)) {
            return;
        }

        const script = document.createElement('script');
        script.src = scriptPath;
        script.onload = () => {
            console.log(`Loaded script for ${viewName}`);
        };
        script.onerror = (error) => {
            console.error(`Failed to load script for ${viewName}:`, error);
        };
        document.head.appendChild(script);
    }

    // Load data specific to the view
    async loadViewData(viewName) {
        switch (viewName) {
            case 'home':
                await this.loadHomeData();
                break;
            case 'pos':
                await this.loadPOSData();
                break;
            case 'stocks':
                await this.loadStocksData();
                break;
            case 'transactions':
                await this.loadTransactionsData();
                break;
            case 'statistics':
                await this.loadStatisticsData();
                break;
            default:
                console.log(`No specific data loading for view: ${viewName}`);
        }
    }

    // Load home view data
    async loadHomeData() {
        try {
            // Load only essential data for home view
            const [salesData, productData, transactionData] = await Promise.all([
                this.fetchSalesData(),
                this.fetchProductData(),
                this.fetchTransactionData()
            ]);

            this.updateHomeDashboard(salesData, productData, transactionData);
        } catch (error) {
            console.error('Error loading home data:', error);
        }
    }

    // Load POS view data
    async loadPOSData() {
        try {
            // Load only POS-specific data
            const [products, categories, customers] = await Promise.all([
                this.fetchProducts(),
                this.fetchCategories(),
                this.fetchCustomers()
            ]);

            this.initializePOS(products, categories, customers);
        } catch (error) {
            console.error('Error loading POS data:', error);
        }
    }

    // Load stocks view data
    async loadStocksData() {
        try {
            const products = await this.fetchProducts();
            this.initializeStocks(products);
        } catch (error) {
            console.error('Error loading stocks data:', error);
        }
    }

    // Load transactions view data
    async loadTransactionsData() {
        try {
            const transactions = await this.fetchTransactions();
            this.initializeTransactions(transactions);
        } catch (error) {
            console.error('Error loading transactions data:', error);
        }
    }

    // Load statistics view data
    async loadStatisticsData() {
        try {
            const statsData = await this.fetchStatisticsData();
            this.initializeStatistics(statsData);
        } catch (error) {
            console.error('Error loading statistics data:', error);
        }
    }

    // API calls for data fetching
    async fetchSalesData() {
        return $.get(`${api}statistics/sales`);
    }

    async fetchProductData() {
        return $.get(`${api}inventory/products`);
    }

    async fetchTransactionData() {
        return $.get(`${api}transactions/recent`);
    }

    async fetchProducts() {
        return $.get(`${api}inventory/products`);
    }

    async fetchCategories() {
        return $.get(`${api}categories`);
    }

    async fetchCustomers() {
        return $.get(`${api}customers`);
    }

    async fetchTransactions() {
        return $.get(`${api}transactions`);
    }

    async fetchStatisticsData() {
        return $.get(`${api}statistics/overview`);
    }

    // Update home dashboard
    updateHomeDashboard(salesData, productData, transactionData) {
        // Initialize home module if not already done
        if (window.homeModule) {
            window.homeModule.init();
            
            // Update counters
            window.homeModule.updateCounters(salesData, transactionData, productData);
            
            // Update product sales table
            window.homeModule.updateProductSalesTable(productData);
        }
    }

    // Initialize POS
    initializePOS(products, categories, customers) {
        // Initialize POS-specific functionality
        if (window.posModule) {
            window.posModule.init(products, categories, customers);
        }
    }

    // Initialize stocks
    initializeStocks(products) {
        if (window.stocksModule) {
            window.stocksModule.init(products);
        }
    }

    // Initialize transactions
    initializeTransactions(transactions) {
        if (window.transactionsModule) {
            window.transactionsModule.init(transactions);
        }
    }

    // Initialize statistics
    initializeStatistics(statsData) {
        if (window.statisticsModule) {
            window.statisticsModule.init(statsData);
        }
    }

    // Show settings modal
    showSettingsModal() {
        $('#settingsModal').modal('show');
    }

    // Logout functionality
    logout() {
        Swal.fire({
            title: 'Logout',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, logout',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                // Clear stored data
                this.clearViewData();
                // Redirect to login or restart app
                ipcRenderer.send('logout');
            }
        });
    }

    // Clear view data
    clearViewData() {
        this.viewData.clear();
        this.loadedViews.clear();
    }

    // Show global loader
    showGlobalLoader() {
        $('#global-loader').show();
    }

    // Hide global loader
    hideGlobalLoader() {
        $('#global-loader').hide();
    }
}

// Export the ViewManager
module.exports = ViewManager;
