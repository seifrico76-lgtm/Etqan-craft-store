document.addEventListener('DOMContentLoaded', () => {
    
    // ------------------------------------
    // متغيرات حالة سلة التسوق 
    // ------------------------------------
    const cartItems = []; 
    
    // عناصر الواجهة الرئيسية
    const cartIcon = document.querySelector('.cart-icon');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart-btn');
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartTotalAmount = document.getElementById('cart-total-amount');
    const checkoutBtn = document.querySelector('.checkout-btn'); // زر إتمام الشراء
    
    // عناصر الفلترة والمنتجات
    const allProducts = document.querySelectorAll('.product-card');
    const viewAllButton = document.getElementById('view-all-products');
    const categoryCards = document.querySelectorAll('.category-card');

    // ------------------------------------
    // 1. منطق نافذة تسجيل الدخول (Login Modal)
    // ------------------------------------
    const loginModalOverlay = document.getElementById('login-modal-overlay');
    const closeLoginBtn = document.getElementById('close-login-btn');
    const continueBtn = document.getElementById('continue-btn');
    const userEmailInput = document.getElementById('user-email');

    // **فحص الجلسة عند التحميل (لتطبيق شرط "مرة واحدة لكل شخص")**
    const storedSession = localStorage.getItem('etqan_user_session');

    if (storedSession && loginModalOverlay) {
        // إذا كان هناك بيانات مسجلة في المتصفح، يتم إخفاء النافذة فوراً
        loginModalOverlay.style.display = 'none';
        console.log(`Resuming session for: ${storedSession}`);
    } else if (loginModalOverlay) {
        // إذا لم يكن هناك جلسة مسجلة، تأكد من عرض النافذة
        loginModalOverlay.style.display = 'flex';
    }
    
    // دالة إغلاق النافذة (مع حفظ الجلسة)
    function closeLoginModal(e) {
        if (e && e.preventDefault) {
            e.preventDefault(); 
        }
        
        // حفظ البيانات في الـ localStorage لإنشاء الجلسة
        if (userEmailInput && userEmailInput.value) {
            // حفظ البريد كمعرّف للجلسة
            localStorage.setItem('etqan_user_session', userEmailInput.value);
            console.log(`New session started for: ${userEmailInput.value}`);
        } else {
            // إذا لم يدخل بريد، نعتبره زائر ونحفظ جلسة مؤقتة لتجنب إعادة ظهور النافذة
            localStorage.setItem('etqan_user_session', 'guest_session');
        }
        
        // إخفاء النافذة
        if (loginModalOverlay) {
            loginModalOverlay.style.display = 'none';
        }
    }

    // ربط أحداث نافذة الدخول
    if (closeLoginBtn) {
        closeLoginBtn.addEventListener('click', closeLoginModal);
    }
    
    if (continueBtn) {
        continueBtn.addEventListener('click', closeLoginModal);
    }
    
    // ------------------------------------
    // 2. وظائف العرض والتحكم في السلة
    // ------------------------------------

    // تحديث رقم العربة في الهيدر (يشمل كل الكميات)
    function updateCartCount() {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartIcon.textContent = `🛒 (${totalItems})`;
    }

    // فتح شريط السلة الجانبي
    function openCart() {
        cartOverlay.classList.add('show');
        renderCart(); 
    }

    // إغلاق شريط السلة الجانبي
    function closeCart() {
        cartOverlay.classList.remove('show');
    }
    
    // وظيفة معالجة النقر على زر إتمام الشراء (تفعيل واتساب)
    function handleCheckout() {
        if (cartItems.length === 0) {
            alert('السلة فارغة! الرجاء إضافة منتجات قبل إتمام الشراء.');
            return;
        }

        // بناء ملخص الطلب كنص واحد (URL-Encoded)
        let orderDetails = "أهلاً Etqan Craft! أرغب في طلب المنتجات التالية:\n\n";
        let total = 0;
        
        cartItems.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            orderDetails += `* ${item.name} (${item.quantity} قطعة) | ${itemTotal.toFixed(2)} EGP\n`;
        });
        
        orderDetails += `\n*الإجمالي الكلي: ${total.toFixed(2)} EGP*`;
        
        const userEmail = localStorage.getItem('etqan_user_session');
        if (userEmail && userEmail !== 'guest_session') {
            orderDetails += `\n\n(تم تسجيل هذا الطلب عبر: ${userEmail})`;
        }
        
        // ====================================================================
        // 🚨 هام: قم بتغيير هذا الرقم إلى رقم واتساب الخاص بك مع كود الدولة
        const yourWhatsappNumber = "+201001234567"; 
        // ====================================================================
        
        // تشفير النص لجعله صالحاً للرابط (URL Encoding)
        const encodedMessage = encodeURIComponent(orderDetails);
        
        // بناء رابط واتساب
        const whatsappLink = `https://wa.me/${yourWhatsappNumber}?text=${encodedMessage}`;

        // فتح نافذة جديدة برابط الواتساب
        window.open(whatsappLink, '_blank');
        
        // مسح السلة بعد "إتمام الطلب"
        cartItems.length = 0;
        renderCart();
        updateCartCount();
        closeCart();
    }

    // عرض محتويات السلة في الشريط الجانبي
    function renderCart() {
        let total = 0;
        let cartContent = '';

        if (cartItems.length === 0) {
            cartContent = '<p class="empty-cart-message">سلة التسوق فارغة.</p>';
        } else {
            cartItems.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;

                cartContent += `
                    <div class="cart-item" data-id="${item.id}">
                        <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                        <div class="item-details">
                            <h5>${item.name}</h5>
                            <p class="item-price">السعر الكلي: EGP${itemTotal.toFixed(2)}</p>
                            
                            <div class="quantity-control">
                                <button class="qty-btn decrement-btn" data-id="${item.id}">-</button>
                                <span class="item-qty">${item.quantity}</span>
                                <button class="qty-btn increment-btn" data-id="${item.id}">+</button>
                            </div>
                            <button class="remove-item-btn" data-id="${item.id}">حذف من السلة</button>
                        </div>
                    </div>
                `;
            });
        }

        cartItemsContainer.innerHTML = cartContent;
        cartTotalAmount.textContent = `EGP${total.toFixed(2)}`;

        bindRemoveButtons();
        bindQuantityControls(); 
    }
    
    // ------------------------------------
    // 3. وظائف الإضافة والحذف وتعديل الكمية
    // ------------------------------------

    function addItemToCart(productId, name, price, image) {
        const existingItem = cartItems.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cartItems.push({ 
                id: productId, 
                name: name, 
                price: price, 
                quantity: 1, 
                image: image 
            });
        }

        updateCartCount();
        console.log(`تم إضافة "${name}" إلى السلة!`);
    }

    function incrementQuantity(id) {
        const item = cartItems.find(item => item.id === id);
        if (item) {
            item.quantity += 1;
            renderCart();
            updateCartCount();
        }
    }

    function decrementQuantity(id) {
        const itemIndex = cartItems.findIndex(item => item.id === id);
        if (itemIndex > -1) {
            if (cartItems[itemIndex].quantity > 1) {
                cartItems[itemIndex].quantity -= 1;
            } else {
                removeItemFromCart(id);
                return; 
            }
            renderCart();
            updateCartCount();
        }
    }

    function removeItemFromCart(id) {
        const index = cartItems.findIndex(item => item.id === id);
        if (index > -1) {
            cartItems.splice(index, 1); 
            renderCart(); 
            updateCartCount();
        }
    }

    // ربط أزرار الحذف في السلة
    function bindRemoveButtons() {
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.getAttribute('data-id');
                removeItemFromCart(itemId);
            });
        });
    }

    // ربط أزرار تعديل الكمية
    function bindQuantityControls() {
        document.querySelectorAll('.increment-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.getAttribute('data-id');
                incrementQuantity(itemId);
            });
        });

        document.querySelectorAll('.decrement-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.getAttribute('data-id');
                decrementQuantity(itemId);
            });
        });
    }

    // ------------------------------------
    // 4. ربط الأحداث الرئيسية
    // ------------------------------------
    
    // تفعيل أزرار الإضافة إلى العربة (Add to Cart)
    document.querySelectorAll('.secondary-btn').forEach(button => {
        if (button.textContent.trim() === 'Add to Cart') {
            button.addEventListener('click', (e) => {
                e.preventDefault(); 
                
                const card = e.target.closest('.product-card');
                
                const id = card.getAttribute('data-id'); 
                const name = card.querySelector('h4').textContent;
                
                let priceElement = card.querySelector('.sale-price') || card.querySelector('.price');
                let priceText = priceElement.textContent.replace(/[^\d.]/g, ''); 
                                
                const price = parseFloat(priceText.trim());
                const image = card.querySelector('.product-img').getAttribute('src');

                if (id && name && !isNaN(price)) {
                    addItemToCart(id, name, price, image);
                } else {
                    console.error("Could not get product details or price.");
                }
            });
        }
    });

    // تفعيل فتح وإغلاق السلة
    cartIcon.addEventListener('click', openCart);
    if (closeCartBtn) closeCartBtn.addEventListener('click', closeCart);
    if (cartOverlay) {
        cartOverlay.addEventListener('click', (e) => {
            if (e.target.id === 'cart-overlay') {
                closeCart();
            }
        });
    }

    // تفعيل زر إتمام عملية الشراء (Checkout)
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleCheckout();
        });
    }

    // تفعيل وظيفة زر "View All Products"
    if (viewAllButton) {
        viewAllButton.addEventListener('click', () => {
            allProducts.forEach(product => {
                product.style.display = 'block';
            });
        });
    }

    // تفعيل فلترة الفئات
    categoryCards.forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault(); 
            const categoryName = card.querySelector('h4').textContent.trim();
            let filterClass;
            if (categoryName === 'Macrame Mirrors') {
                filterClass = 'category-mirrors';
            } else if (categoryName === 'Wall Hangings') {
                filterClass = 'category-hangings';
            } else if (categoryName === 'Home Accessories') {
                filterClass = 'category-accessories';
            }
            allProducts.forEach(product => {
                product.style.display = 'none';
            });
            const filteredProducts = document.querySelectorAll(`.${filterClass}`);
            if (filteredProducts.length > 0) {
                filteredProducts.forEach(product => {
                    product.style.display = 'block'; 
                });
            }
        });
    });

    // تحديث عدد السلة عند التحميل الأولي
    updateCartCount();
});