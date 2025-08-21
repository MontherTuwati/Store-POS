// Home View Module - Handles home-specific functionality
const { api, notiflix, Swal, moment } = require('./app.js');

class HomeModule {
    constructor() {
        this.charts = {};
        this.isInitialized = false;
    }

    // Initialize home module
    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.initializeCharts();
        this.isInitialized = true;
    }

    // Setup home-specific event listeners
    setupEventListeners() {
        // Statistics period buttons
        $('#btnradio1').on('change', () => this.updateStatistics('week'));
        $('#btnradio2').on('change', () => this.updateStatistics('month'));
        $('#btnradio3').on('change', () => this.updateStatistics('year'));
    }

    // Initialize charts
    initializeCharts() {
        const ctx = document.getElementById('salesChart');
        if (ctx) {
            this.charts.sales = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Sales',
                        data: [],
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    // Update statistics based on period
    async updateStatistics(period) {
        try {
            const data = await this.fetchStatisticsData(period);
            this.updateCharts(data);
        } catch (error) {
            console.error('Error updating statistics:', error);
            notiflix.Notify.failure('Failed to update statistics');
        }
    }

    // Fetch statistics data
    async fetchStatisticsData(period) {
        return $.get(`${api}statistics/${period}`);
    }

    // Update charts with new data
    updateCharts(data) {
        if (this.charts.sales && data.sales) {
            this.charts.sales.data.labels = data.sales.labels;
            this.charts.sales.data.datasets[0].data = data.sales.values;
            this.charts.sales.update();
        }
    }

    // Update dashboard counters
    updateCounters(salesData, transactionData, productData) {
        $('#total_sales .counter').text(this.formatCurrency(salesData.total || 0));
        $('#total_items .counter').text(transactionData.count || 0);
        $('#total_transactions .counter').text(transactionData.total || 0);
        $('#total_products .counter').text(productData.length || 0);
    }

    // Update product sales table
    updateProductSalesTable(products) {
        const tbody = $('#product_sales');
        tbody.empty();

        if (!products || products.length === 0) {
            tbody.append('<tr><td colspan="4" class="text-center">No products sold today</td></tr>');
            return;
        }

        products.slice(0, 10).forEach(product => {
            tbody.append(`
                <tr>
                    <td>${product.name || 'Unknown'}</td>
                    <td>${product.sold || 0}</td>
                    <td>${product.stock || 0}</td>
                    <td>${this.formatCurrency(product.sales || 0)}</td>
                </tr>
            `);
        });
    }

    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    // Cleanup when leaving home view
    cleanup() {
        // Destroy charts to free memory
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        this.charts = {};
        this.isInitialized = false;
    }
}

// Create and export the home module
window.homeModule = new HomeModule();

module.exports = HomeModule;