
import path from 'path';
import * as XLSX from 'xlsx';

const OUTPUT_FILE = 'sales_data_month.xlsx';

// Configuration
const START_DATE = new Date('2025-12-01T00:00:00');
const DAYS_TO_GENERATE = 31;
const DAILY_TRANSACTIONS_MIN = 30;
const DAILY_TRANSACTIONS_MAX = 80;

const PRODUCTS = [
    { name: 'Капучино 0.3', price: 900, weight: 40 },
    { name: 'Капучино 0.4', price: 1200, weight: 30 },
    { name: 'Латте 0.3', price: 950, weight: 35 },
    { name: 'Латте 0.4', price: 1250, weight: 25 },
    { name: 'Американо 0.3', price: 700, weight: 20 },
    { name: 'Эспрессо', price: 500, weight: 15 },
    { name: 'Раф Цитрусовый 0.4', price: 1400, weight: 10 },
    { name: 'Круассан с шоколадом', price: 850, weight: 15 },
    { name: 'Круассан классический', price: 650, weight: 10 },
    { name: 'Чизкейк Нью-Йорк', price: 1100, weight: 8 },
];

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function weightedRandomProduct() {
    const totalWeight = PRODUCTS.reduce((acc, p) => acc + p.weight, 0);
    let random = Math.random() * totalWeight;
    for (const product of PRODUCTS) {
        if (random < product.weight) return product;
        random -= product.weight;
    }
    return PRODUCTS[0];
}

// Generate Peak Hours (Morning 8-10, Lunch 12-14, Evening 17-19)
function generateRandomTime(date) {
    const r = Math.random();
    let hour;
    
    // 30% Morning peak (8-10)
    if (r < 0.30) hour = randomInt(8, 10);
    // 30% Lunch peak (12-14)
    else if (r < 0.60) hour = randomInt(12, 14);
    // 20% Evening (17-19)
    else if (r < 0.80) hour = randomInt(17, 19);
    // 20% Random other times (7-22)
    else hour = randomInt(7, 22);

    const minute = randomInt(0, 59);
    const newDate = new Date(date);
    newDate.setHours(hour, minute, 0, 0);
    return newDate;
}

const data = [];

// Header similar to iiko/Poster
// Дата открытия | Время | Наименование | Кол-во | Сумма | Категория (Optional)
const HEADERS = ['Дата', 'Время', 'Товар', 'Количество', 'Сумма', 'Категория'];
data.push(HEADERS);

console.log(`Generating data from ${START_DATE.toISOString().split('T')[0]} for ${DAYS_TO_GENERATE} days...`);

for (let i = 0; i < DAYS_TO_GENERATE; i++) {
    const currentDate = new Date(START_DATE);
    currentDate.setDate(START_DATE.getDate() + i);
    
    // Weekend multiplier (more sales on weekends maybe?)
    const dayOfWeek = currentDate.getDay(); // 0 is Sunday
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    
    let numTransactions = randomInt(DAILY_TRANSACTIONS_MIN, DAILY_TRANSACTIONS_MAX);
    if (isWeekend) numTransactions = Math.floor(numTransactions * 1.2);

    for (let j = 0; j < numTransactions; j++) {
        const product = weightedRandomProduct();
        const dateTime = generateRandomTime(currentDate);
        
        // Formats
        // Date: DD.MM.YYYY
        const dateStr = dateTime.toLocaleDateString('ru-RU');
        // Time: HH:MM
        const timeStr = dateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        
        const qty = Math.random() > 0.9 ? 2 : 1; // 10% chance of buying 2
        const total = product.price * qty;

        data.push([
            dateStr,
            timeStr,
            product.name,
            qty,
            total,
            product.name.includes('Круассан') || product.name.includes('Чизкейк') ? 'Еда' : 'Напитки'
        ]);
    }
}

// Create Workbook
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(data);

// Column widths
ws['!cols'] = [
    { wch: 12 }, // Date
    { wch: 10 }, // Time
    { wch: 25 }, // Product
    { wch: 10 }, // Qty
    { wch: 10 }, // Sum
    { wch: 15 }  // Category
];

XLSX.utils.book_append_sheet(wb, ws, "Sales");

const outputPath = path.resolve(OUTPUT_FILE);
XLSX.writeFile(wb, outputPath);

console.log(`✅ generated ${data.length - 1} records to ${outputPath}`);
