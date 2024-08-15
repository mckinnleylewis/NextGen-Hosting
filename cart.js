document.addEventListener('DOMContentLoaded', () => {
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const cartContainer = document.getElementById('cart-items');

    function renderCart() {
        cartContainer.innerHTML = '';
        if (cartItems.length === 0) {
            cartContainer.innerHTML = '<p>Your cart is empty</p>';
            return;
        }

        cartItems.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <p>${item.product} - $${item.price}</p>
                <button class="remove-from-cart" data-product="${item.product}">Remove</button>
            `;
            cartContainer.appendChild(cartItem);
        });
    }

    function updateCart() {
        localStorage.setItem('cart', JSON.stringify(cartItems));
        renderCart();
    }

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const product = button.getAttribute('data-product');
            const price = button.getAttribute('data-price');
            cartItems.push({ product, price });
            updateCart();
        });
    });

    cartContainer.addEventListener('click', event => {
        if (event.target.classList.contains('remove-from-cart')) {
            const product = event.target.getAttribute('data-product');
            const index = cartItems.findIndex(item => item.product === product);
            if (index !== -1) {
                cartItems.splice(index, 1);
                updateCart();
            }
        }
    });

    document.getElementById('buy-button').addEventListener('click', () => {
        if (cartItems.length === 0) {
            alert('Your cart is empty');
            return;
        }
        alert('Your Server Is Being Installed Open A Ticket In Our Discord For Your IP To Connect To Start Deving');
        cartItems.length = 0;
        updateCart();
        alert('SERVER INSTALLED PLEASE OPEN A TICKET IN OUR DISCORD TO CLAIM');
        cartItems.length = 0;
        updateCart();
    });

    renderCart();
});

