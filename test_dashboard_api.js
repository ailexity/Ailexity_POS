// Quick test script to check if statistics endpoint is working
// Run this in browser console (F12 → Console tab)

// Test 1: Check if API is accessible
fetch('/api/invoices/statistics', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(res => res.json())
.then(data => {
    console.log('✅ Statistics endpoint response:', data);
    if (data.totalOrders === 0) {
        console.log('ℹ️ No invoices found - create some orders first');
    }
})
.catch(err => {
    console.error('❌ Statistics endpoint error:', err);
});

// Test 2: Check if invoices exist
fetch('/api/invoices/?limit=10', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('token')
    }
})
.then(res => res.json())
.then(data => {
    console.log('✅ Invoices response:', data);
    console.log(`Found ${data.length} invoices`);
})
.catch(err => {
    console.error('❌ Invoices endpoint error:', err);
});

// Test 3: Check for console errors
console.log('Token:', localStorage.getItem('token') ? 'Present ✅' : 'Missing ❌');
