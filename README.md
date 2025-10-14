# Sari-Sari Store Inventory

An Electron desktop application that helps sari-sari store owners monitor stock levels, record sales, and keep a quick snapshot of their store's performance. The UI is built with vanilla HTML, CSS, and JavaScript wrapped in an Electron shell for seamless desktop usage.

## Features
- Manage products with name, price, quantity, and instant search filtering.
- Sell or delete items with a custom quantity modal that validates user input.
- Track running totals for inventory value and recorded sales.
- Reset the entire dataset (items and sales) using an in-app confirmation dialog that maintains window focus.
- Persist inventory data locally in JSON so the latest state loads on the next launch.
- Gracefully fall back to in-memory storage if the preload bridge is unavailable (helps with basic browser previews).

## Prerequisites
- [Node.js](https://nodejs.org/) 18.x or newer
- npm (bundled with Node.js)

## Getting Started
1. Clone the repository:
   ```powershell
   git clone https://github.com/JerbyCalo/Sari-Sari-Store-Inventory.git
   cd Sari-Sari-Store-Inventory
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the application in development mode:
   ```powershell
   npm start
   ```
   This launches the Electron renderer window and reloads data from `data/inventory.json`.

## Building a Windows Package
Generate a distributable Windows build with Electron Packager:
```powershell
npm run build
```
The packaged app is emitted to the `build/` directory. Adjust the `electron-packager` options in `package.json` if you need installers for other targets.

## Data Storage
- Persistent inventory data lives in `data/inventory.json`.
- The file schema is:
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "Product name",
        "price": 12.5,
        "quantity": 20
      }
    ],
    "sales": {
      "total": 0
    }
  }
  ```
- The application normalizes the data on load, ensuring totals stay non-negative.

## Project Structure
- `main.js`: sets up the Electron main process, window lifecycle, IPC routes, and JSON persistence.
- `preload.js`: exposes a safe `inventoryAPI` bridge to the renderer.
- `public/index.html`: renderer UI template and modal markup.
- `public/style.css`: dark-themed styling for the dashboard, table, and modals.
- `public/app.js`: renderer logic for listing, adding, selling, deleting, resetting, and modal management.
- `data/inventory.json`: persisted sample data that can be replaced with your own catalog.

## Troubleshooting
- **Nothing happens on launch**: Make sure you are running `npm start` from the project root so Electron finds `main.js` and `preload.js`.
- **Reset leaves the window unfocused**: The renderer uses an in-app confirmation dialog to avoid this. If you see focus issues, ensure you're running the latest code or disable third-party window managers.
- **Data doesn't persist**: Confirm the app has write access to `data/inventory.json`. On Windows, avoid storing the project under protected folders.

## License
This project is released under the [MIT License](./LICENSE).
