// Зберігання товарів у кошику
let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    initProductCards();
    initCartEvents();
    initModalEvents();
});

// 1. ЛОГІКА КАРТОК ТОВАРУ (Вибір ваги та зміна ціни)
function initProductCards() {
    const cards = document.querySelectorAll('.product-card');
    
    cards.forEach(card => {
        const weightButtons = card.querySelectorAll('.weight-btn');
        const priceValue = card.querySelector('.price-value');
        const currentWeightLabel = card.querySelector('.current-weight-label');
        const addToCartBtn = card.querySelector('.add-to-cart-btn');
        
        weightButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Знімаємо активний клас у всіх кнопок цієї картки
                weightButtons.forEach(b => b.classList.remove('active'));
                // Додаємо активний клас поточній кнопці
                btn.classList.add('active');
                
                // Оновлюємо ціну на картці
                const price = btn.getAttribute('data-price');
                const weight = btn.getAttribute('data-weight');
                priceValue.textContent = price;
                currentWeightLabel.textContent = `Ціна за ${weight}`;
            });
        });

        // Додавання у кошик при кліку
        addToCartBtn.addEventListener('click', () => {
            const productId = card.getAttribute('data-product-id');
            const productName = card.getAttribute('data-product-name');
            const activeWeightBtn = card.querySelector('.weight-btn.active');
            const selectedWeight = activeWeightBtn.getAttribute('data-weight');
            const selectedPrice = parseInt(activeWeightBtn.getAttribute('data-price'));

            addToCart(productId, productName, selectedWeight, selectedPrice);
        });
    });
}

// 2. ФУНКЦІЇ РОБОТИ З КОШИКОМ
function addToCart(id, name, weight, price) {
    // Шукаємо, чи є вже такий мед з ТАКОЮ Ж вагою у кошику
    const existingItem = cart.find(item => item.id === id && item.weight === weight);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: id,
            name: name,
            weight: weight,
            price: price,
            quantity: 1
        });
    }
    
    updateCart();
    openCartSidebar();
}

function updateCart() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCountBadge = document.getElementById('cart-count');
    const cartTotalPriceElement = document.getElementById('cart-total-price');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-message">Кошик поки що порожній</p>';
        cartCountBadge.textContent = '0';
        cartTotalPriceElement.textContent = '0';
        return;
    }
    
    let totalItems = 0;
    let totalPrice = 0;
    let html = '';
    
    cart.forEach((item, index) => {
        totalItems += item.quantity;
        totalPrice += (item.price * item.quantity);
        
        html += `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.weight} — ${item.price} ₴ / шт.</p>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn" onclick="changeQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="changeQuantity(${index}, 1)">+</button>
                    <button class="cart-item-remove" onclick="removeCartItem(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = html;
    cartCountBadge.textContent = totalItems;
    cartTotalPriceElement.textContent = totalPrice;
}

function changeQuantity(index, delta) {
    cart[index].quantity += delta;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCart();
}

function removeCartItem(index) {
    cart.splice(index, 1);
    updateCart();
}

// Події відкриття/закриття кошика
function initCartEvents() {
    const trigger = document.getElementById('cart-trigger');
    const sidebar = document.getElementById('cart-sidebar');
    const closeBtn = document.getElementById('close-cart');
    const overlay = document.getElementById('cart-overlay');
    
    trigger.addEventListener('click', openCartSidebar);
    closeBtn.addEventListener('click', closeCartSidebar);
    overlay.addEventListener('click', closeCartSidebar);
}

function openCartSidebar() {
    document.getElementById('cart-sidebar').classList.add('active');
    document.getElementById('cart-overlay').classList.add('active');
}

function closeCartSidebar() {
    document.getElementById('cart-sidebar').classList.remove('active');
    document.getElementById('cart-overlay').classList.remove('active');
}

// 3. ЛОГІКА МОДАЛЬНОГО ВІКНА ТА ВІДПРАВКИ ФОРМИ
function initModalEvents() {
    const checkoutTrigger = document.getElementById('checkout-trigger');
    const modal = document.getElementById('checkout-modal');
    const closeModals = document.querySelectorAll('#close-modal');
    const orderForm = document.getElementById('order-form');

    // Клік на "Оформити замовлення" в кошику
    checkoutTrigger.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Ваш кошик порожній! Додайте мед для замовлення.');
            return;
        }
        
        // Готуємо текстовий звіт про товари для надсилання в імейлі
        let cartSummaryText = '';
        let totalPrice = 0;
        
        cart.forEach(item => {
            const itemSum = item.price * item.quantity;
            totalPrice += itemSum;
            cartSummaryText += `• ${item.name} (${item.weight}) x ${item.quantity} шт. = ${itemSum} ₴\n`;
        });
        
        // Записуємо дані у приховані поля форми
        document.getElementById('hidden-cart-data').value = cartSummaryText;
        document.getElementById('hidden-total-price').value = `${totalPrice} ₴`;
        
        // Закриваємо кошик і відкриваємо фінальне вікно форми
        closeCartSidebar();
        modal.classList.add('active');
    });

    // Закриття модального вікна
    closeModals.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });

    // Обробка відправки форми на пошту
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault(); // Зупиняємо стандартне перезавантаження
        
        const submitBtn = document.getElementById('submit-order-btn');
        submitBtn.textContent = 'Надсилається...';
        submitBtn.disabled = true;

        // Збираємо дані форми
        const formData = new FormData(orderForm);

        // Відправляємо дані на безкоштовний шлюз Formspree
        fetch(orderForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                alert('Дякуємо! Ваше замовлення успішно надіслано. Ми зв\'яжемося з вами найближчим часом!');
                // Очищаємо кошик та закриваємо вікно
                cart = [];
                updateCart();
                orderForm.reset();
                modal.classList.remove('active');
            } else {
                alert('Ой! Сталася помилка при відправці. Будь ласка, зателефонуйте нам прямо зараз.');
            }
        })
        .catch(error => {
            alert('Помилка з\'єднання. Перевірте інтернет або зателефонуйте нам.');
        })
        .finally(() => {
            submitBtn.textContent = 'Підтвердити та надіслати';
            submitBtn.disabled = false;
        });
    });
}