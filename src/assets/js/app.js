// Main Application Entry Point
const { ipcRenderer } = require('electron');

// Verify IPC is working
console.log('IPC Renderer loaded:', typeof ipcRenderer);

// Global variables (only essential ones)
let api = "http://localhost:8001/api/";
let notiflix = require("notiflix");
let Swal = require("sweetalert2");
let moment = require("moment");

// Current view tracking
let currentView = 'home';

// Initialize application
$(document).ready(function() {
    console.log('StorePOS Application Starting...');
    
    try {
        // Show that the app is loading
        $('#currentDateTime').text('Loading StorePOS...');
        
        // Setup navigation
        setupNavigation();
        
        // Update current date/time
        updateDateTime();
        setInterval(updateDateTime, 1000);
        
        // Detect current view and set active button with a small delay
        setTimeout(() => {
            detectCurrentView();
        }, 100);
        
        // Load initial data for home view
        loadHomeData();
        
        console.log('StorePOS Application Started Successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        $('#currentDateTime').text('Error loading application');
    }
});

// Detect current view based on URL
function detectCurrentView() {
    // Get the current file path from the window location
    const currentPath = window.location.pathname;
    const fileName = currentPath.split('/').pop();
    
    // Map file names to view names
    const viewMap = {
        'home.html': 'home',
        'pos.html': 'pos',
        'stocks.html': 'stocks',
        'transactions.html': 'transactions',
        'statistics.html': 'statistics',
        'settings.html': 'settings'
    };
    
    if (fileName && viewMap[fileName]) {
        currentView = viewMap[fileName];
        setActiveButton(currentView);
        console.log(`Detected current view: ${currentView}`);
    } else {
        // Fallback: detect based on visible content
        if ($('#home_view').is(':visible')) {
            currentView = 'home';
            setActiveButton('home');
        } else if ($('#pos_view').is(':visible')) {
            currentView = 'pos';
            setActiveButton('pos');
        } else if ($('#stock_view').is(':visible')) {
            currentView = 'stocks';
            setActiveButton('stocks');
        } else if ($('#transactions_view').is(':visible')) {
            currentView = 'transactions';
            setActiveButton('transactions');
        } else if ($('#statistics_view').is(':visible')) {
            currentView = 'statistics';
            setActiveButton('statistics');
        }
    }
}

// Setup navigation
function setupNavigation() {
    console.log('Setting up navigation event handlers...');
    
    // Navigation buttons
    $('#dashboard').on('click', (e) => {
        e.preventDefault();
        console.log('Dashboard clicked');
        switchView('home');
    });
    
    $('#pointofsale').on('click', (e) => {
        e.preventDefault();
        console.log('POS clicked');
        switchView('pos');
    });
    
    $('#stocks').on('click', (e) => {
        e.preventDefault();
        console.log('Stocks clicked');
        switchView('stocks');
    });
    
    $('#transactions').on('click', (e) => {
        e.preventDefault();
        console.log('Transactions clicked');
        switchView('transactions');
    });
    
    $('#statistics').on('click', (e) => {
        e.preventDefault();
        console.log('Statistics clicked');
        switchView('statistics');
    });
    
    $('#settings').on('click', (e) => {
        e.preventDefault();
        console.log('Settings clicked');
        showSettingsModal();
    });
    
    $('#logout-options').on('click', (e) => {
        e.preventDefault();
        console.log('Logout clicked');
        if (confirm('Are you sure you want to logout?')) {
            ipcRenderer.send('app-quit');
        }
    });
    
    console.log('Navigation event handlers set up successfully');
}

// Switch to a different view
function switchView(viewName) {
    if (currentView === viewName) return;
    
    console.log(`Switching from ${currentView} to ${viewName}`);
    
    // Map view names to file names
    const viewMap = {
        'home': 'home.html',
        'pos': 'pos.html',
        'stocks': 'stocks.html',
        'transactions': 'transactions.html',
        'statistics': 'statistics.html',
        'settings': 'settings.html'
    };
    
    const fileName = viewMap[viewName];
    if (fileName) {
        console.log('Loading file:', fileName);
        // Use relative path to navigate
        window.location.href = `../views/${fileName}`;
    } else {
        console.error('Unknown view:', viewName);
    }
    
    currentView = viewName;
}

// Set active button based on current view
function setActiveButton(viewName) {
    $('.btn-square').removeClass('active');
    $(`#${viewName === 'home' ? 'dashboard' : viewName}`).addClass('active');
}

// Load home data
function loadHomeData() {
    console.log('Loading home data...');
    
    // Update counters with sample data
    $('#total_sales .counter').text('$1,234.56');
    $('#total_items .counter').text('45');
    $('#total_transactions .counter').text('$5,678.90');
    $('#total_products .counter').text('123');
    
    // Update product sales table with sample data
    const sampleProducts = [
        { name: 'Sample Product 1', sold: 10, stock: 50, sales: 100.00 },
        { name: 'Sample Product 2', sold: 5, stock: 25, sales: 75.00 },
        { name: 'Sample Product 3', sold: 8, stock: 30, sales: 120.00 }
    ];
    
    updateProductSalesTable(sampleProducts);
}

// Update product sales table
function updateProductSalesTable(products) {
    const tbody = $('#product_sales');
    tbody.empty();

    if (!products || products.length === 0) {
        tbody.append('<tr><td colspan="4" class="text-center">No products sold today</td></tr>');
        return;
    }

    products.forEach(product => {
        tbody.append(`
            <tr>
                <td>${product.name || 'Unknown'}</td>
                <td>${product.sold || 0}</td>
                <td>${product.stock || 0}</td>
                <td>$${product.sales || 0}</td>
            </tr>
        `);
    });
}

// Update current date/time
function updateDateTime() {
    const now = moment();
    $('#currentDateTime').text(now.format('dddd, MMMM Do YYYY, h:mm:ss a'));
}

// Export for use in other modules
module.exports = {
    api,
    notiflix,
    Swal,
    moment
};
