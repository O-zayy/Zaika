document.addEventListener('DOMContentLoaded', function () {
    var cartToggle = document.getElementById('cart-toggle');
    var cartCountElement = document.querySelector('.cart-count');
    var cartItemsList = document.querySelector('.cart-items');
    var cartTotalElement = document.querySelector('.cart-total');
    var cartCheckoutButton = document.querySelector('.cart-checkout');
    var navOrderButton = document.getElementById('nav-order-btn');
    var allAddToCartButtons = document.querySelectorAll('.hot-card .card-btn');
    var filterSelect = document.getElementById('filter-select');
    var sortSelect = document.getElementById('sort-select');
    var resetButton = document.getElementById('reset-btn');
    var hotGrid = document.getElementById('hot-grid');
    var feedbackElement = document.getElementById('hot-feedback');

    var cart = [];
    var originalOrderButtonDisplay = navOrderButton ? getComputedStyle(navOrderButton).display : '';
    var notificationStylesAdded = false;
    var originalOrder = collectOriginalCardOrder();

    function formatCurrency(value) {
        return '₹' + value;
    }

    function addNotificationStylesIfNeeded() {
        if (notificationStylesAdded) {
            return;
        }
        notificationStylesAdded = true;
        var style = document.createElement('style');
        style.textContent = '' +
            '@keyframes slideIn {\n' +
            '    from { transform: translateX(400px); opacity: 0; }\n' +
            '    to { transform: translateX(0); opacity: 1; }\n' +
            '}\n' +
            '@keyframes slideOut {\n' +
            '    from { transform: translateX(0); opacity: 1; }\n' +
            '    to { transform: translateX(400px); opacity: 0; }\n' +
            '}\n';
        document.head.appendChild(style);
    }

    function showNotification(message) {
        addNotificationStylesIfNeeded();
        var notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '80px';
        notification.style.right = '20px';
        notification.style.background = 'linear-gradient(135deg, #FF6B35 0%, #FF8C42 100%)';
        notification.style.color = 'white';
        notification.style.padding = '12px 24px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 4px 12px rgba(255, 107, 53, 0.3)';
        notification.style.fontSize = '14px';
        notification.style.fontWeight = '500';
        notification.style.zIndex = '10000';
        notification.style.animation = 'slideIn 0.3s ease-out';
        document.body.appendChild(notification);
        setTimeout(function () {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(function () {
                notification.remove();
            }, 300);
        }, 2000);
    }

    function findCard(element) {
        var current = element;
        while (current && !current.classList.contains('hot-card')) {
            current = current.parentElement;
        }
        return current;
    }

    function readCardName(card) {
        if (!card) {
            return 'item';
        }
        var name = card.dataset.name;
        if (name && name.trim() !== '') {
            return name.trim();
        }
        var titleElement = card.querySelector('.card-title');
        if (titleElement) {
            return titleElement.textContent.trim();
        }
        return 'item';
    }

    function readCardPrice(card) {
        if (!card) {
            return 0;
        }
        var priceFromData = Number(card.dataset.price);
        if (!isNaN(priceFromData) && priceFromData > 0) {
            return priceFromData;
        }
        var priceElement = card.querySelector('.current-price');
        if (priceElement) {
            var digits = priceElement.textContent.replace(/[^\d]/g, '');
            return Number(digits) || 0;
        }
        return 0;
    }

    function findCartIndex(name) {
        for (var i = 0; i < cart.length; i++) {
            if (cart[i].name === name) {
                return i;
            }
        }
        return -1;
    }

    function setButtonToAdd(button) {
        button.textContent = 'add to cart';
        button.dataset.mode = 'add';
    }

    function createQuantityButton(label, handler) {
        var btn = document.createElement('button');
        btn.className = 'qty-btn';
        btn.textContent = label;
        btn.style.background = 'rgba(255,255,255,0.2)';
        btn.style.border = 'none';
        btn.style.color = 'white';
        btn.style.width = '32px';
        btn.style.height = '32px';
        btn.style.borderRadius = '6px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '18px';
        btn.style.fontWeight = 'bold';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.addEventListener('click', function (event) {
            event.stopPropagation();
            handler();
        });
        return btn;
    }

    function setButtonToQuantity(button, quantity, name) {
        button.innerHTML = '';
        button.dataset.mode = 'quantity';
        var wrapper = document.createElement('div');
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.justifyContent = 'space-between';
        wrapper.style.width = '100%';
        wrapper.style.gap = '8px';

        var decreaseButton = createQuantityButton('−', function () {
            decreaseQuantity(name);
        });

        var quantityLabel = document.createElement('span');
        quantityLabel.style.fontWeight = '600';
        quantityLabel.style.fontSize = '15px';
        quantityLabel.textContent = String(quantity);

        var increaseButton = createQuantityButton('+', function () {
            increaseQuantity(name);
        });

        wrapper.appendChild(decreaseButton);
        wrapper.appendChild(quantityLabel);
        wrapper.appendChild(increaseButton);
        button.appendChild(wrapper);
    }

    function updateCardButtons() {
        for (var i = 0; i < allAddToCartButtons.length; i++) {
            var button = allAddToCartButtons[i];
            var card = findCard(button);
            var name = readCardName(card);
            var cartIndex = findCartIndex(name);
            if (cartIndex === -1) {
                setButtonToAdd(button);
            } else {
                setButtonToQuantity(button, cart[cartIndex].quantity, name);
            }
        }
    }

    function createEmptyCartMessage() {
        var emptyMessage = document.createElement('li');
        emptyMessage.className = 'cart-item';
        emptyMessage.style.justifyContent = 'center';
        emptyMessage.style.opacity = '0.7';
        emptyMessage.textContent = 'Your cart is empty';
        return emptyMessage;
    }

    function createCartQuantityButton(text, name, action) {
        var btn = document.createElement('button');
        btn.className = 'cart-qty-btn';
        btn.textContent = text;
        btn.style.background = 'rgba(255,107,53,0.1)';
        btn.style.border = '1px solid rgba(255,107,53,0.3)';
        btn.style.color = '#FF6B35';
        btn.style.width = '24px';
        btn.style.height = '24px';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '16px';
        btn.style.fontWeight = 'bold';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.addEventListener('click', function () {
            action(name);
        });
        return btn;
    }

    function createCartItemElement(item) {
        var listItem = document.createElement('li');
        listItem.className = 'cart-item';

        var infoSection = document.createElement('div');
        infoSection.className = 'cart-item-info';
        var nameSpan = document.createElement('span');
        nameSpan.className = 'cart-item-name';
        nameSpan.textContent = item.name;
        var metaSpan = document.createElement('span');
        metaSpan.className = 'cart-item-meta';
        metaSpan.textContent = formatCurrency(item.price) + ' × ' + item.quantity;
        infoSection.appendChild(nameSpan);
        infoSection.appendChild(metaSpan);

        var actionsSection = document.createElement('div');
        actionsSection.className = 'cart-item-actions';

        var quantityContainer = document.createElement('div');
        quantityContainer.className = 'cart-quantity-controls';
        quantityContainer.style.display = 'flex';
        quantityContainer.style.alignItems = 'center';
        quantityContainer.style.gap = '8px';
        quantityContainer.style.marginRight = '8px';

        var decreaseButton = createCartQuantityButton('−', item.name, decreaseQuantity);
        var quantityLabel = document.createElement('span');
        quantityLabel.style.minWidth = '20px';
        quantityLabel.style.textAlign = 'center';
        quantityLabel.style.fontWeight = '600';
        quantityLabel.textContent = String(item.quantity);
        var increaseButton = createCartQuantityButton('+', item.name, increaseQuantity);

        quantityContainer.appendChild(decreaseButton);
        quantityContainer.appendChild(quantityLabel);
        quantityContainer.appendChild(increaseButton);

        var subtotalSpan = document.createElement('span');
        subtotalSpan.className = 'cart-item-subtotal';
        subtotalSpan.textContent = formatCurrency(item.price * item.quantity);

        var removeButton = document.createElement('button');
        removeButton.className = 'cart-item-remove';
        removeButton.setAttribute('aria-label', 'Remove ' + item.name);
        removeButton.textContent = '×';
        removeButton.addEventListener('click', function () {
            removeFromCart(item.name);
        });

        actionsSection.appendChild(quantityContainer);
        actionsSection.appendChild(subtotalSpan);
        actionsSection.appendChild(removeButton);

        listItem.appendChild(infoSection);
        listItem.appendChild(actionsSection);
        return listItem;
    }

    function updateCartUI() {
        var totalItems = 0;
        var totalPrice = 0;
        for (var i = 0; i < cart.length; i++) {
            totalItems += cart[i].quantity;
            totalPrice += cart[i].price * cart[i].quantity;
        }

        if (cartCountElement) {
            cartCountElement.textContent = String(totalItems);
        }

        if (cartItemsList) {
            cartItemsList.innerHTML = '';
            if (cart.length === 0) {
                cartItemsList.appendChild(createEmptyCartMessage());
            } else {
                for (var j = 0; j < cart.length; j++) {
                    cartItemsList.appendChild(createCartItemElement(cart[j]));
                }
            }
        }

        if (cartTotalElement) {
            cartTotalElement.textContent = formatCurrency(totalPrice);
        }

        if (navOrderButton) {
            navOrderButton.style.display = cart.length > 0 ? 'none' : originalOrderButtonDisplay;
        }

        updateCardButtons();
    }

    function addToCart(name, price) {
        var numericPrice = Number(price);
        if (!numericPrice) {
            numericPrice = 0;
        }
        var index = findCartIndex(name);
        if (index === -1) {
            cart.push({ name: name, price: numericPrice, quantity: 1 });
        } else {
            cart[index].quantity += 1;
        }
        showNotification('✓ Added to cart');
        updateCartUI();
    }

    function increaseQuantity(name) {
        var index = findCartIndex(name);
        if (index !== -1) {
            cart[index].quantity += 1;
            updateCartUI();
        }
    }

    function decreaseQuantity(name) {
        var index = findCartIndex(name);
        if (index === -1) {
            return;
        }
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
            updateCartUI();
        } else {
            removeFromCart(name);
        }
    }

    function removeFromCart(name) {
        var index = findCartIndex(name);
        if (index !== -1) {
            cart.splice(index, 1);
            updateCartUI();
        }
    }

    function handleCardButtonClick(event) {
        if (event.target.classList.contains('qty-btn')) {
            return;
        }
        var button = event.currentTarget;
        if (button.dataset.mode === 'quantity') {
            return;
        }
        var card = findCard(button);
        var name = readCardName(card);
        var price = readCardPrice(card);
        addToCart(name, price);
        if (cartToggle) {
            cartToggle.checked = true;
        }
    }

    function setupCardButtons() {
        for (var i = 0; i < allAddToCartButtons.length; i++) {
            setButtonToAdd(allAddToCartButtons[i]);
            allAddToCartButtons[i].addEventListener('click', handleCardButtonClick);
        }
    }

    function setupCheckoutButton() {
        if (!cartCheckoutButton) {
            return;
        }
        cartCheckoutButton.addEventListener('click', function (event) {
            event.preventDefault();
            var hotCornerSection = document.getElementById('hot-corner');
            if (hotCornerSection) {
                hotCornerSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    function collectOriginalCardOrder() {
        var cards = document.querySelectorAll('.hot-card');
        var order = [];
        for (var i = 0; i < cards.length; i++) {
            order.push(cards[i]);
        }
        return order;
    }

    function applyFilterAndSort() {
        if (!hotGrid) {
            return;
        }
        var filterValue = filterSelect ? filterSelect.value : 'all';
        var sortValue = sortSelect ? sortSelect.value : 'featured';

        var filteredCards = [];
        for (var i = 0; i < originalOrder.length; i++) {
            var card = originalOrder[i];
            var cardType = card.dataset.type;
            var cardPrice = Number(card.dataset.price) || 0;
            var includeCard = false;

            if (filterValue === 'all') {
                includeCard = true;
            } else if (filterValue === 'veg') {
                includeCard = cardType === 'veg';
            } else if (filterValue === 'non-veg') {
                includeCard = cardType === 'non-veg';
            } else if (filterValue === 'under-200') {
                includeCard = cardPrice < 200;
            }

            if (includeCard) {
                filteredCards.push(card);
            }
        }

        if (sortValue !== 'featured') {
            filteredCards.sort(function (cardA, cardB) {
                var priceA = Number(cardA.dataset.price) || 0;
                var priceB = Number(cardB.dataset.price) || 0;
                var nameA = cardA.dataset.name || '';
                var nameB = cardB.dataset.name || '';
                var discountA = Number(cardA.dataset.discount) || 0;
                var discountB = Number(cardB.dataset.discount) || 0;

                if (sortValue === 'price-asc') {
                    return priceA - priceB;
                }
                if (sortValue === 'price-desc') {
                    return priceB - priceA;
                }
                if (sortValue === 'name-asc') {
                    return nameA.localeCompare(nameB);
                }
                if (sortValue === 'discount-desc') {
                    return discountB - discountA;
                }
                return 0;
            });
        } else {
            filteredCards.sort(function (cardA, cardB) {
                return originalOrder.indexOf(cardA) - originalOrder.indexOf(cardB);
            });
        }

        hotGrid.innerHTML = '';
        for (var j = 0; j < filteredCards.length; j++) {
            hotGrid.appendChild(filteredCards[j]);
        }

        if (feedbackElement) {
            feedbackElement.textContent = 'showing ' + filteredCards.length + ' items';
        }
    }

    function setupFilterControls() {
        if (filterSelect) {
            filterSelect.addEventListener('change', applyFilterAndSort);
        }
        if (sortSelect) {
            sortSelect.addEventListener('change', applyFilterAndSort);
        }
        if (resetButton) {
            resetButton.addEventListener('click', function () {
                if (filterSelect) {
                    filterSelect.value = 'all';
                }
                if (sortSelect) {
                    sortSelect.value = 'featured';
                }
                applyFilterAndSort();
            });
        }
    }

    setupCardButtons();
    setupCheckoutButton();
    updateCartUI();
    setupFilterControls();
    applyFilterAndSort();
});
