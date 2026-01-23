# ☕ CafeInsight (MVP)

An intelligent analytics dashboard for cafe owners to visualize sales data and get AI-powered business advice.

Built as a prototype to demonstrate the power of combining simple Excel data with Gemini AI.

![CafeInsight Screenshot](https://placehold.co/1200x600/indigo/white?text=CafeInsight+Dashboard)

## ✨ key Features

*   **📊 Instant Visualization**: Turns raw Excel/CSV sales logs into beautiful interactive charts (Revenue, Peak Hours, Product Mix).
*   **🤖 AI Business Analyst**: Uses **Google Gemini** to analyze sales trends and provide 3 actionable textual recommendations (e.g., "Boost revenue by 15% via combo-offers").
*   **✍️ Expert Mode**: Manual override mode to inject human expert advice into the final report.
*   **📄 PDF Generation**: One-click professional PDF export for printing or sharing in WhatsApp (includes smart page breaks).
*   **🔒 Local & Private**: Processes data locally in the browser.

## 🛠 Tech Stack

*   **Frontend**: React (Vite) + TypeScript
*   **Styling**: TailwindCSS + FontAwesome
*   **Charts**: Recharts
*   **AI**: Google Generative AI SDK (Gemini)
*   **PDF**: html2canvas + jsPDF

## 🚀 How to Run

1.  **Clone the repo**
    ```bash
    git clone https://github.com/ulytau/report-app.git
    cd report-app
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start Development Server**
    ```bash
    npm run dev
    ```

4.  **Open Browser**
    Go to `http://localhost:3000`

## 📁 Project Status

**Status: Archived (MVP Completed)**
This project served as a successful proof-of-concept for an AI-driven SaaS report generator.
