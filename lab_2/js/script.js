const products = [
    {
        id: 1,
        name: "iPhone 15",
        brand: "Apple",
        category: "Smartphone",
        price: "₹69,999",
        availability: "In Stock",
        icon: "📱",
        description: "A powerful smartphone with a beautiful display, excellent camera system and fast performance.",
        color: "Black",
        storage: "128 GB",
        warranty: "1 Year"
    },
    {
        id: 2,
        name: "Galaxy S24",
        brand: "Samsung",
        category: "Smartphone",
        price: "₹74,999",
        availability: "In Stock",
        icon: "📱",
        description: "A premium Android smartphone with a bright display, advanced cameras and flagship performance.",
        color: "Onyx Black",
        storage: "256 GB",
        warranty: "1 Year"
    },
    {
        id: 3,
        name: "MacBook Air",
        brand: "Apple",
        category: "Laptop",
        price: "₹99,999",
        availability: "In Stock",
        icon: "💻",
        description: "A thin and lightweight laptop designed for everyday productivity, study, development and creative work.",
        color: "Midnight",
        storage: "256 GB SSD",
        warranty: "1 Year"
    },
    {
        id: 4,
        name: "WH-1000XM5",
        brand: "Sony",
        category: "Headphones",
        price: "₹29,999",
        availability: "Out of Stock",
        icon: "🎧",
        description: "Premium wireless headphones featuring industry-leading noise cancellation and immersive sound.",
        color: "Black",
        storage: "Wireless",
        warranty: "1 Year"
    }
];

const table = document.getElementById("productTable");
const count = document.getElementById("productCount");

count.textContent = `${products.length} products`;

products.forEach(product => {
    const row = document.createElement("tr");
    row.className = "product-row";

    row.innerHTML = `
        <td>
            <div class="product-name">
                ${product.name}
                <small>${product.icon} Click to view details</small>
            </div>
        </td>
        <td>${product.brand}</td>
        <td>${product.category}</td>
        <td class="price">${product.price}</td>
        <td>
            <span class="status ${product.availability === "In Stock" ? "in-stock" : "out-stock"}">
                ${product.availability}
            </span>
        </td>
        <td>
            <button class="view-btn">View</button>
        </td>
    `;

    row.addEventListener("click", () => {
        window.location.href = `details.html?id=${product.id}`;
    });

    table.appendChild(row);
});
