// =============================================
// Variáveis Globais
// =============================================
let cartItems = JSON.parse(localStorage.getItem('encantos-cart'))?.items || [];
let wishlist = JSON.parse(localStorage.getItem('encantos-wishlist')) || [];
let bannerInterval;
let currentProduct = null;
let isModalOpen = false;

// =============================================
// Funções do Carrinho (Corrigidas)
// =============================================

function openCart() {
    document.getElementById('cart').classList.add('open');
    document.body.style.overflow = 'hidden';
    updateCart();
}

function closeCart() {
    document.getElementById('cart').classList.remove('open');
    document.body.style.overflow = 'auto';
}

function addToCart(productName, productPrice, event, weight = null) {
    if (!productName || isNaN(productPrice)) {
        console.error('Dados do produto inválidos');
        return;
    }

    const fromModal = event?.target?.closest('.modal');
    const productCard = event?.target?.closest('.product-card');

    // Usa 'unit' de forma segura
    let unit = 'un';
    if (fromModal && currentProduct) {
        unit = currentProduct.unit;
    } else {
        unit = productCard?.querySelector('.product-actions')?.dataset.unit || 'un';
    }

    // Quantidade
    let quantity = 1;
    if (fromModal) {
        const modalQty = document.querySelector('.modal .quantity-input');
        quantity = modalQty ? parseInt(modalQty.value) || 1 : 1;
    } else {
        const cardQty = productCard?.querySelector('.quantity-input');
        quantity = cardQty ? parseInt(cardQty.value) || 1 : 1;
    }

    // Cálculo de preço
    let finalPrice = productPrice;
    let displayName = productName;
    let itemWeight = null;

    if (unit === 'kg') {
        itemWeight = weight !== null ? weight : 1000;
        finalPrice = parseFloat((productPrice * (itemWeight / 1000)).toFixed(2));
        displayName = `${productName} (${itemWeight}g)`;
    }

    // Adiciona como novo item SEMPRE
    const newItem = {
        name: displayName,
        price: finalPrice,
        quantity: quantity,
        unit: unit,
        basePrice: productPrice
    };

    if (unit === 'kg') {
        newItem.weight = itemWeight;
    }

    cartItems.push(newItem);
    saveCartToLocalStorage();
    updateCart();
    showAddedToCartMessage(displayName, quantity);

}
function removeFromCart(index, event) {
    if (event) event.stopPropagation();

    if (index >= 0 && index < cartItems.length) {
        cartItems.splice(index, 1);
        saveCartToLocalStorage();
        updateCart();
    }
}

function updateCart() {
    const cartList = document.getElementById('cart-items');
    if (!cartList) return;

    cartList.innerHTML = '';

    if (cartItems.length === 0) {
        cartList.innerHTML = '<li style="color:#777; text-align:center;">Seu carrinho está vazio</li>';
        updateCartCounter();
        return;
    }

    cartItems.forEach((item, index) => {
        const li = document.createElement('li');
        li.className = 'cart-item';

        let priceText = '';
        if (item.unit === 'kg' && item.weight) {
            const pricePerKg = item.basePrice.toFixed(2);
            priceText = `${item.weight}g (R$ ${pricePerKg}/kg)`;
        } else {
            priceText = `R$ ${item.price.toFixed(2)}`;
        }

        li.innerHTML = `
            <div class="cart-item-info">
                <strong>${item.name}</strong>
                <small>${item.quantity}x ${priceText}</small>
            </div>
            <div class="cart-item-actions">
                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
                <button class="remove-item" data-index="${index}" aria-label="Remover item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;

        cartList.appendChild(li);
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFromCart(parseInt(e.currentTarget.dataset.index), e);
        });
    });

    const totalLi = document.createElement('li');
    totalLi.className = 'cart-total';
    totalLi.innerHTML = `<span>Total:</span> <span>R$ ${calculateTotal()}</span>`;
    cartList.appendChild(totalLi);

    updateCartCounter();
}

function calculateTotal() {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2);
}

function saveCartToLocalStorage() {
    localStorage.setItem('encantos-cart', JSON.stringify({
        items: cartItems,
        lastUpdate: new Date().toISOString()
    }));
}

function updateCartCounter() {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const counter = document.querySelector('.cart-counter');

    if (counter) {
        counter.textContent = totalItems > 99 ? '99+' : totalItems;
        counter.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}

function checkout() {
    if (cartItems.length === 0) {
        showAlert('Seu carrinho está vazio!', 'error');
        return;
    }

    const itemsText = cartItems.map(item => {
        let itemText = `➡ ${item.name} - ${item.quantity}x`;

        if (item.unit === 'kg' && item.weight) {
            const pricePerKg = item.basePrice.toFixed(2);
            itemText += ` (${item.weight}g a R$ ${pricePerKg}/kg)`;
        }

        itemText += ` - R$ ${(item.price * item.quantity).toFixed(2)}`;
        return itemText;
    }).join('\\n');

    const total = calculateTotal();
    const message = `Olá, gostaria de fazer o seguinte pedido:\\n\\n${itemsText}\\n\\n💵 *Total: R$ ${total}*\\n\\nPor favor, confirme a disponibilidade.`;

    window.open(`https://wa.me/SEUNUMERO?text=${encodeURIComponent(message)}`, '_blank');
}
function openProductModal(product) {
    if (isModalOpen) return;

    isModalOpen = true;
    currentProduct = product;

    const modal = document.getElementById('productModal');
    const modalImg = document.getElementById('modalProductImage');
    const modalName = document.getElementById('modalProductName');
    const modalPrice = document.getElementById('modalProductPrice');
    const modalUnit = document.getElementById('modalProductUnit');
    const weightInput = document.getElementById('product-weight');
    const weightSelector = document.getElementById('weightSelector');
    const calculatedPrice = document.getElementById('modalCalculatedPrice');
    const quantityInput = document.querySelector('.modal .quantity-input');

    modalImg.src = product.image;
    modalImg.alt = product.name;
    modalName.textContent = product.name;
    modalPrice.textContent = `R$ ${product.price.toFixed(2)}`;
    quantityInput.value = 1;

    const isWeightProduct = product.unit === 'kg';

    if (isWeightProduct) {
        modalUnit.textContent = 'Preço por kg:';
        weightSelector.style.display = 'flex';
        weightInput.value = 1000;
        updateModalPrice(product.price, weightInput.value);

        weightInput.addEventListener('input', () => {
            updateModalPrice(product.price, weightInput.value);
        });
    } else {
        modalUnit.textContent = 'Preço unitário:';
        weightSelector.style.display = 'none';
        calculatedPrice.textContent = `Total: R$ ${product.price.toFixed(2)}`;
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function updateModalPrice(pricePerKg, grams) {
    const weight = parseFloat(grams) || 1000;
    const total = (pricePerKg * (weight / 1000)).toFixed(2);
    document.getElementById('modalCalculatedPrice').textContent = `Total: R$ ${total}`;
}

function closeProductModal() {
    if (!isModalOpen) return;
    const modal = document.getElementById('productModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    isModalOpen = false;
}

function setupProductModals() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.closest('.wishlist-btn') || 
                e.target.closest('.product-actions') || 
                e.target.tagName === 'BUTTON' || 
                e.target.tagName === 'INPUT') {
                return;
            }

            const product = {
                name: card.querySelector('h3').textContent,
                price: parseFloat(card.querySelector('p').textContent.replace('R$ ', '').replace(',', '.')),
                image: card.querySelector('img').src,
                category: card.dataset.category,
                unit: card.querySelector('.product-actions').dataset.unit
            };

            openProductModal(product);
        });
    });

    document.querySelector('.close-modal').addEventListener('click', closeProductModal);

    window.addEventListener('click', function(e) {
        if (e.target === document.getElementById('productModal')) {
            closeProductModal();
        }
    });

   document.querySelector('.modal .add-to-cart-btn').addEventListener('click', function() {
    if (currentProduct) {
        const weightInput = document.getElementById('product-weight');
        const weight = weightInput ? parseInt(weightInput.value) : null;

        const quantityInput = document.querySelector('.modal .quantity-input');
        const quantity = quantityInput ? parseInt(quantityInput.value) || 1 : 1;

        addToCart(currentProduct.name, currentProduct.price, {
            target: document.querySelector('.modal')
        }, weight);

        closeProductModal();
    }
});


    const weightInput = document.getElementById('product-weight');
    if (weightInput) {
        weightInput.addEventListener('change', function() {
            if (this.value < 100) this.value = 100;
            if (this.value > 10000) this.value = 10000;
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateCart();
    updateWishlistIcons();
    setupEventListeners();
    setupCategoryFilters();
    setupSearch();
    setupBannerRotation();
    setupProductModals();

    const banners = document.querySelectorAll('.promo-banner');
    if (banners.length > 0) {
        banners[0].classList.add('active');
    }
});
// =============================================
// Funções de Wishlist (Favoritos)
// =============================================

function toggleWishlist(productName, element) {
    const index = wishlist.indexOf(productName);

    if (index === -1) {
        wishlist.push(productName);
        showAlert(`${productName} adicionado aos favoritos!`);
        if (element) element.textContent = '❤️';
    } else {
        wishlist.splice(index, 1);
        showAlert(`${productName} removido dos favoritos!`);
        if (element) element.textContent = '🤍';
    }

    localStorage.setItem('encantos-wishlist', JSON.stringify(wishlist));
}

function updateWishlistIcons() {
    document.querySelectorAll('.wishlist-btn').forEach(btn => {
        const productName = btn.dataset.product;
        btn.textContent = wishlist.includes(productName) ? '❤️' : '🤍';
    });
}

// =============================================
// Funções do Menu Lateral
// =============================================

function openSidebar() {
    document.getElementById('sidebar').classList.add('open');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        document.addEventListener('click', closeOnClickOutside);
    }, 100);
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.body.style.overflow = 'auto';
    document.removeEventListener('click', closeOnClickOutside);
}

function closeOnClickOutside(event) {
    if (!document.getElementById('sidebar').contains(event.target) &&
        !document.querySelector('.menu-btn').contains(event.target)) {
        closeSidebar();
    }
}

// =============================================
// Funções dos Banners
// =============================================

function rotateBanners() {
    const banners = document.querySelectorAll('.promo-banner');
    if (!banners.length) return;

    const current = document.querySelector('.promo-banner.active');
    const next = current.nextElementSibling || banners[0];

    current.classList.remove('active');
    next.classList.add('active');
}

function setupBannerRotation() {
    clearInterval(bannerInterval);
    bannerInterval = setInterval(rotateBanners, 5000);

    const bannerContainer = document.querySelector('.banners-container');
    if (bannerContainer) {
        bannerContainer.addEventListener('mouseenter', () => clearInterval(bannerInterval));
        bannerContainer.addEventListener('mouseleave', setupBannerRotation);
    }
}

// =============================================
// Funções de Filtro e Busca
// =============================================

function filterProducts(category) {
    const products = document.querySelectorAll('.product-card');
    const categoryTitle = document.querySelector('.category-title');

    if (categoryTitle) {
        const activeButton = document.querySelector('.category-btn.active');
        if (activeButton) {
            categoryTitle.textContent = `(${activeButton.textContent})`;
        }
    }

    products.forEach(product => {
        if (category === 'todos' || product.dataset.category === category) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}

function setupSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        document.querySelectorAll('.product-card').forEach(card => {
            const name = card.querySelector('h3').textContent.toLowerCase();
            const isVisible = name.includes(searchTerm);
            card.style.display = isVisible ? 'block' : 'none';
        });
    });
}

// =============================================
// Notificações e Alertas
// =============================================

function showAddedToCartMessage(productName, quantity) {
    const message = document.createElement('div');
    message.className = 'cart-notification';
    message.innerHTML = `
        <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="green" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
        <div>
            <strong>${quantity}x ${productName}</strong> adicionado(s) ao carrinho!
        </div>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(message);
    setTimeout(() => message.classList.add('show'), 10);
    setTimeout(() => message.remove(), 3000);
}

function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert-message ${type}`;
    alert.textContent = message;
    document.body.appendChild(alert);

    setTimeout(() => alert.classList.add('show'), 10);
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => document.body.removeChild(alert), 300);
    }, 3000);
}

// =============================================
// Eventos Globais
// =============================================

function setupEventListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('.remove-item')) return;

        const sidebar = document.getElementById('sidebar');
        const cart = document.getElementById('cart');

        if (sidebar?.classList.contains('open') &&
            !e.target.closest('.sidebar') && !e.target.closest('.menu-btn')) {
            closeSidebar();
        }

        if (cart?.classList.contains('open') &&
            !e.target.closest('.cart') && !e.target.closest('.cart-btn')) {
            closeCart();
        }
    });

    document.querySelector('.cart-footer')?.addEventListener('click', (e) => {
        if (e.target.classList.contains('checkout-btn')) {
            checkout();
        } else if (e.target.classList.contains('continue-btn')) {
            closeCart();
        }
    });
}

function setupCategoryFilters() {
    document.querySelectorAll('.category-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            button.classList.add('active');
            filterProducts(button.dataset.category);
        });
    });
}
