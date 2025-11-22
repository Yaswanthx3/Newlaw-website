document.addEventListener('DOMContentLoaded', function () {
    // --- PAYMENT PAGE INTERACTIVITY ---
    const checkoutSummaryContainer = document.getElementById('checkout-summary');
    const placeOrderBtn = document.getElementById('place-order-btn');

    // --- Login & Shipping Section Logic ---
    const loginPromptContainer = document.getElementById('checkout-login-prompt');
    const shippingDisplay = document.getElementById('shipping-display');

    if (loginPromptContainer && shippingDisplay) {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (isLoggedIn) {
            loginPromptContainer.innerHTML = `<p>Welcome back! Please confirm your shipping details below.</p>`;
            const userProfile = JSON.parse(localStorage.getItem('userProfile'));
            if (userProfile && userProfile.address && userProfile.address.name) {
                const addr = userProfile.address;
                shippingDisplay.innerHTML = `
                    <p><strong>${addr.name}</strong></p>
                    <p>${addr.address1}</p>
                    <p>${addr.city}, ${addr.pincode}</p>
                    <p>Phone: ${addr.phone}</p>
                    <a href="profile.html" style="font-size: 0.9rem; text-decoration: underline; margin-top: 1rem; display: inline-block;">Edit Address</a>
                `;
            } else {
                shippingDisplay.innerHTML = `
                    <p style="color: #e74c3c;">No shipping address found.</p>
                    <p>Please go to your profile to add an address before placing an order.</p>
                    <a href="profile.html" class="btn btn-secondary" style="margin-top: 1rem;">Go to Profile</a>
                `;
                placeOrderBtn.disabled = true;
                placeOrderBtn.style.opacity = '0.5';
                placeOrderBtn.style.cursor = 'not-allowed';
            }
        } else {
            loginPromptContainer.innerHTML = `
                <p>Have an account? <a href="login.html" style="text-decoration: underline;">Login</a> for a faster checkout.</p>
                <a href="signup.html" class="btn btn-secondary">Sign Up</a>
            `;
            shippingDisplay.innerHTML = `<p>Please log in to use a saved address.</p>`;
            placeOrderBtn.disabled = true;
            placeOrderBtn.style.opacity = '0.5';
            placeOrderBtn.style.cursor = 'not-allowed';
        }
    }

    if (checkoutSummaryContainer) {
        // Load order details from localStorage
        const orderDetails = JSON.parse(localStorage.getItem('uniqueOrder'));
        if (orderDetails) {
            checkoutSummaryContainer.innerHTML = orderDetails.summary;
            document.getElementById('checkout-total-price').textContent = orderDetails.total;
        } else {
            checkoutSummaryContainer.innerHTML = '<p>Your cart is empty. Please go back to the design page to create your product.</p>';
        }

        // Handle payment option selection
        const paymentOptions = document.querySelectorAll('.payment-option');
        paymentOptions.forEach(option => {
            option.addEventListener('click', () => {
                document.querySelector('.payment-option.active').classList.remove('active');
                option.classList.add('active');

                document.querySelector('.payment-method-form:not(.hidden)').classList.add('hidden');
                document.getElementById(`${option.dataset.method}-form`).classList.remove('hidden');
            });
        });

        // Handle final order placement
        const backToHomeBtn = document.getElementById('back-to-home-btn');
        if (placeOrderBtn) {

            placeOrderBtn.addEventListener('click', () => {
                // --- VALIDATION LOGIC ---
                const activePaymentMethod = document.querySelector('.payment-option.active').dataset.method;
                let isFormValid = true;

                // Helper function to show/hide errors
                const validateField = (input, condition, message) => {
                    const errorSpan = input.nextElementSibling;
                    if (!condition) {
                        input.classList.add('invalid');
                        errorSpan.textContent = message;
                        errorSpan.style.display = 'block';
                        isFormValid = false;
                    } else {
                        input.classList.remove('invalid');
                        errorSpan.style.display = 'none';
                    }
                };

                // Clear previous errors
                document.querySelectorAll('#payment-details .form-input').forEach(input => {
                    input.classList.remove('invalid');
                    if (input.nextElementSibling && input.nextElementSibling.classList.contains('error-message')) {
                        input.nextElementSibling.style.display = 'none';
                    }
                });

                // Get saved shipping address
                const userProfile = JSON.parse(localStorage.getItem('userProfile'));
                if (!userProfile || !userProfile.address || !userProfile.address.name) {
                    alert('Please save a shipping address in your profile first.');
                    return;
                }
                const addr = userProfile.address;
                const shippingAddressHTML = `
                    <p><strong>${addr.name}</strong></p>
                    <p>${addr.address1}</p>
                    <p>${addr.city}, ${addr.pincode}</p>
                    <p>Phone: ${addr.phone}</p>`;

                if (activePaymentMethod === 'card') {
                    const cardNumber = document.getElementById('card-number');
                    const cardName = document.getElementById('card-name');
                    const expiryDate = document.getElementById('card-expiry');
                    const cvv = document.getElementById('card-cvv');

                    validateField(cardNumber, /^\d{16}$/.test(cardNumber.value.trim()), 'Enter a valid 16-digit card number.');
                    validateField(cardName, cardName.value.trim() !== '', 'Name on card is required.');
                    validateField(expiryDate, /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate.value.trim()), 'Use MM/YY format.');
                    validateField(cvv, /^\d{3,4}$/.test(cvv.value.trim()), 'Enter a valid CVV.');

                    // Check if card is expired
                    if (/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate.value.trim())) {
                        const [month, year] = expiryDate.value.trim().split('/');
                        // Create a date for the last day of the expiry month.
                        // JS month is 0-indexed, so we pass the month directly to get the *next* month, then go back one day.
                        const expiryDateObj = new Date(`20${year}`, month, 0);
                        const currentDate = new Date();
                        // Set current date to the beginning of the day to avoid time-of-day issues.
                        currentDate.setHours(0, 0, 0, 0);
                        if (expiryDateObj < currentDate) {
                            validateField(expiryDate, false, 'Card is expired.');
                        }
                    }
                }

                if (activePaymentMethod === 'upi') {
                    const upiId = document.getElementById('upi-id');
                    validateField(upiId, /^[\w.-]+@[\w.-]+$/.test(upiId.value.trim()), 'Enter a valid UPI ID (e.g., user@bank).');
                }
                // --- END OF VALIDATION ---

                // Stop if form is not valid
                if (!isFormValid) {
                    // Scroll to the first error if you want
                    document.querySelector('.form-input.invalid')?.focus();
                    return;
                }

                // Save all details to localStorage
                const orderDetails = JSON.parse(localStorage.getItem('uniqueOrder'));
                if (orderDetails) {
                    orderDetails.shippingAddress = shippingAddressHTML;
                    localStorage.setItem('uniqueOrder', JSON.stringify(orderDetails));
                }

                // Show the confirmation modal with a quote
                const confirmationModal = document.getElementById('confirmation-modal');
                if (confirmationModal) {
                    // Array of motivating quotes
                    const quotes = [
                        "Style is a way to say who you are without having to speak. — Rachel Zoe",
                        "Fashion is what you buy. Style is what you do with it.",
                        "Creativity is intelligence having fun. — Albert Einstein",
                        "To be irreplaceable, one must always be different. — Coco Chanel",
                        "Your imagination is the only limit to your style. Wear it proudly."
                    ];

                    // Select a random quote and display it
                    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                    document.getElementById('payment-confirmation-quote').textContent = `"${randomQuote}"`;

                    // Show the modal
                    confirmationModal.classList.remove('hidden');

                    // Redirect to the confirmation page after a delay
                    setTimeout(() => {
                        window.location.href = 'order-confirmation.html';
                    }, 4000); // 4-second delay
                }
            });

            backToHomeBtn.addEventListener('click', () => {
                localStorage.removeItem('uniqueOrder'); // Clear storage
                window.location.href = 'index.html'; // Redirect to home
            });
        }
    }
});