const $ = require('jquery');
require('./src/assets/js/pos.js');
require('./src/assets/js/product-filter.js');
require('print-js');

// Load initial view
$(document).ready(() => {
  loadView('home');
  loadModals(); // preload all modals
});

// Load Views
function loadView(viewName) {
  $('#view_container').load(`src/app/views/${viewName}.html`, () => {
    console.log(`${viewName} view loaded`);
    });
}

// Preload All Modals (or pick individually if you prefer)
function loadModals() {
  const modals = [
    'addCustomer', 'editCustomer', 'holdOrder', 'holdOrders', 'categories',
    'newCategory', 'products', 'newProduct', 'customerModal',
    'orderModal', 'userModal', 'users', 'settings'
  ];

  modals.forEach(modal => {
    $.get(`src/app/views/modals/${modal}.html`, (data) => {
      $('body').append(data);
    });
  });
}

// Menu Navigation Binding
$(document).on('click', '#dashboard', () => loadView('home'));
$(document).on('click', '#pointofsale', () => loadView('pos'));
$(document).on('click', '#stocks', () => loadView('stocks'));
$(document).on('click', '#transactions', () => loadView('transactions'));
$(document).on('click', '#statistics', () => loadView('statistics'));
