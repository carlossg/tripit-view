# TripIt Viewer

A modern, privacy-focused web application to visualize your TripIt travel history. Transform your TripIt JSON exports into beautiful, interactive statistics and timelines.

**Live Demo**: [https://tripit.csanchez.org](https://tripit.csanchez.org)

## 🚀 Features

- **🛡️ Privacy First**: All data is processed locally in your browser. No data is ever uploaded to any server.
- **📊 Interactive Dashboard**:
  - **Stats Summary**: Total trips, flights, unique countries, and total days traveled.
  - **Yearly & Monthly Breakdown**: Interactive charts for trips, flights, days, and total miles flown.
  - **Airline Statistics**: Stacked bar charts showing flights per airline per year and an all-time top airlines overview.
- **👥 Traveler Filtering**: Multiselect filter to see stats for specific family members or travel companions (grouped by first name).
- **🗺️ Detailed Timelines**: View a chronological history of every trip, including flights, hotels, car rentals, and rail bookings.
- **💾 Local Persistence**: Remembers your uploaded data and filter preferences using your browser's local storage.
- **📥 CSV Export**: Export your processed and filtered trip data for further analysis.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/carlossg/tripit-viewer.git
   cd tripit-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Deployment

The project is ready for **GitHub Pages**. For detailed instructions on manual or automated deployment (via GitHub Actions), see [DEPLOY.md](./DEPLOY.md).

## 📖 How to Use

1. **Export from TripIt**: request a JSON export of your data from support (support@tripit.com).
2. **Upload**: Open the application and drag-and-drop your TripIt JSON file.
   - *Don't have a file yet?* You can use our **[Sample Data](https://tripit.csanchez.org/sample-data.json)** to try it out!
3. **Explore**: Use the filters and charts to dive into your travel statistics.

## 🔒 Privacy Policy

TripIt Data Visualizer is a 100% client-side application. 
- **No Server**: There is no backend server.
- **No Tracking**: We do not use any analytics or trackers.
- **Local Storage**: Your data is stored only in your browser's `localStorage` for your convenience and can be cleared at any time using the "Load New File" button.

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
