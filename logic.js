// API endpoint - Using exchangerate-api.com (free, no API key required)
const API_BASE_URL = 'https://api.exchangerate-api.com/v4/latest/';

// DOM Elements
const amountInput = document.getElementById('amount');
const fromCurrencySelect = document.getElementById('fromCurrency');
const toCurrencySelect = document.getElementById('toCurrency');
const convertBtn = document.getElementById('convertBtn');
const swapBtn = document.getElementById('swapBtn');
const resultValue = document.getElementById('resultValue');
const exchangeRate = document.getElementById('exchangeRate');
const errorMessage = document.getElementById('errorMessage');

// Cache for exchange rates
let exchangeRatesCache = {};
let lastFetchTime = null;
const CACHE_DURATION = 60000; // 1 minute cache

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Event listeners
    convertBtn.addEventListener('click', convertCurrency);
    swapBtn.addEventListener('click', swapCurrencies);
    
    // Allow Enter key to convert
    amountInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            convertCurrency();
        }
    });
});

// Swap currencies
function swapCurrencies() {
    const temp = fromCurrencySelect.value;
    fromCurrencySelect.value = toCurrencySelect.value;
    toCurrencySelect.value = temp;
    // Clear result when swapping
    resultValue.textContent = '-';
    exchangeRate.textContent = '';
}

// Fetch exchange rates
async function fetchExchangeRates(baseCurrency) {
    // Check cache
    const now = Date.now();
    if (exchangeRatesCache[baseCurrency] && lastFetchTime && (now - lastFetchTime) < CACHE_DURATION) {
        return exchangeRatesCache[baseCurrency];
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${baseCurrency}`);
        if (!response.ok) {
            throw new Error('Failed to fetch exchange rates');
        }
        const data = await response.json();
        exchangeRatesCache[baseCurrency] = data.rates;
        lastFetchTime = now;
        return data.rates;
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        throw error;
    }
}

// Convert currency
async function convertCurrency() {
    const amount = parseFloat(amountInput.value);
    const fromCurrency = fromCurrencySelect.value;
    const toCurrency = toCurrencySelect.value;
    
    // Hide error message
    errorMessage.classList.remove('show');
    
    // Validate amount
    if (isNaN(amount) || amount < 0) {
        showError('Please enter a valid amount');
        resultValue.textContent = '-';
        exchangeRate.textContent = '';
        return;
    }
    
    if (amount === 0) {
        resultValue.textContent = '0.00';
        exchangeRate.textContent = '';
        return;
    }
    
    // Disable button during conversion
    convertBtn.disabled = true;
    convertBtn.textContent = 'Converting...';
    
    try {
        // If same currency, no conversion needed
        if (fromCurrency === toCurrency) {
            resultValue.textContent = formatCurrency(amount, toCurrency);
            exchangeRate.textContent = `1 ${fromCurrency} = 1 ${toCurrency}`;
            convertBtn.disabled = false;
            convertBtn.textContent = 'Convert';
            return;
        }
        
        // Fetch exchange rates
        const rates = await fetchExchangeRates(fromCurrency);
        
        if (!rates[toCurrency]) {
            throw new Error('Exchange rate not available for selected currency');
        }
        
        // Calculate converted amount
        const rate = rates[toCurrency];
        const convertedAmount = amount * rate;
        
        // Display result
        resultValue.textContent = formatCurrency(convertedAmount, toCurrency);
        exchangeRate.textContent = `1 ${fromCurrency} = ${formatCurrency(rate, toCurrency)}`;
        
    } catch (error) {
        console.error('Conversion error:', error);
        showError('Failed to convert currency. Please check your internet connection and try again.');
        resultValue.textContent = '-';
        exchangeRate.textContent = '';
    } finally {
        convertBtn.disabled = false;
        convertBtn.textContent = 'Convert';
    }
}

// Format currency
function formatCurrency(amount, currency) {
    // For currencies with very small values (like JPY, KRW, VND, IDR, etc.), don't show decimals
    const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'CLP', 'IDR', 'UGX', 'TZS', 'MMK', 'ISK'];
    const decimals = noDecimalCurrencies.includes(currency) ? 0 : 2;
    
    // Handle very large numbers for currencies with small unit values
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(amount);
    } catch (error) {
        // Fallback formatting if Intl.NumberFormat fails
        return `${currency} ${amount.toFixed(decimals)}`;
    }
}

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

