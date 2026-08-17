const products = [
    {
        id: 1, name: "iPhone 15", brand: "Apple", category: "Smartphone",
        price: "₹69,999", availability: "In Stock", icon: "📱",
        description: "A powerful smartphone with a beautiful display, excellent camera system and fast performance.",
        color: "Black", storage: "128 GB", warranty: "1 Year"
    },
    {
        id: 2, name: "Galaxy S24", brand: "Samsung", category: "Smartphone",
        price: "₹74,999", availability: "In Stock", icon: "📱",
        description: "A premium Android smartphone with a bright display, advanced cameras and flagship performance.",
        color: "Onyx Black", storage: "256 GB", warranty: "1 Year"
    },
    {
        id: 3, name: "MacBook Air", brand: "Apple", category: "Laptop",
        price: "₹99,999", availability: "In Stock", icon: "💻",
        description: "A thin and lightweight laptop designed for everyday productivity, study, development and creative work.",
        color: "Midnight", storage: "256 GB SSD", warranty: "1 Year"
    },
    {
        id: 4, name: "WH-1000XM5", brand: "Sony", category: "Headphones",
        price: "₹29,999", availability: "Out of Stock", icon: "🎧",
        description: "Premium wireless headphones featuring industry-leading noise cancellation and immersive sound.",
        color: "Black", storage: "Wireless", warranty: "1 Year"
    }
];

const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));
const product = products.find(item => item.id === id);
const container = document.getElementById("productDetails");

if (!product) {
    container.innerHTML = `
        <div class="details-card">
            <div class="details-info">
                <h1>Product Not Found</h1>
                <p class="description">The product you are looking for does not exist.</p>
            </div>
        </div>
    `;
} else {
    container.innerHTML = `
        <div class="details-card">
            <div class="details-top">
                <div class="product-image">${product.icon}</div>

                <div class="details-info">
                    <p class="eyebrow">${product.category}</p>
                    <h1>${product.name}</h1>
                    <p class="brand">by ${product.brand}</p>

                    <span class="status ${product.availability === "In Stock" ? "in-stock" : "out-stock"}">
                        ${product.availability}
                    </span>

                    <div class="detail-price">${product.price}</div>

                    <p class="description">${product.description}</p>

                    <table class="specs">
                        <tr>
                            <td>Brand</td>
                            <td>${product.brand}</td>
                        </tr>
                        <tr>
                            <td>Category</td>
                            <td>${product.category}</td>
                        </tr>
                        <tr>
                            <td>Color</td>
                            <td>${product.color}</td>
                        </tr>
                        <tr>
                            <td>Storage / Type</td>
                            <td>${product.storage}</td>
                        </tr>
                        <tr>
                            <td>Warranty</td>
                            <td>${product.warranty}</td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    `;
}
