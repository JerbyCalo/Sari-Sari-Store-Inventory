### 🧠 **ai-context.md**

```markdown
# AI Context — Sari-Sari Store Inventory Application (Electron.js)

## 📘 Project Description

Create a **desktop-based inventory management system** for a _Sari-Sari Store_ using **Electron.js**, **HTML**, **CSS**, and **JavaScript**.  
The application should allow users to **add**, **view**, and **delete** products, with data stored locally in a JSON file.

---

## 🧩 Technical Requirements

### Framework and Languages

- **Electron.js** — for building the desktop application.
- **HTML** and **CSS** — for the user interface design.
- **JavaScript** — for app logic and data handling.
- **JSON file** — for local file-based storage.

---

## ⚙️ Core Functionalities

1. **Add Item**

   - Input fields for product name, price, and quantity.
   - On submit, save the new item to the local JSON file.

2. **List Items**

   - Display all products from the JSON file in a table or list view.

3. **Delete Item**

   - Allow users to remove an existing item from the inventory.
   - Allow the user to delete specific number of units in the item.
   - Automatically update the JSON file after deletion.

4. **Persistent Storage**
   - Data should remain saved even after closing and reopening the app.

---

## 🧱 Project Structure (Suggested)
```

sari-sari-inventory-electron/
│
├── main.js # Electron main process
├── package.json # Project metadata and dependencies
│
├── /public
│ ├── index.html # Main interface
│ ├── style.css # Styling
│ └── app.js # Frontend logic (add/list/delete)
│
├── /data
│ └── inventory.json # Local file-based data storage
│
└── /build
└── (output .exe after build)

```

---

## 🧠 AI Development Instructions
- Always refer to this file when generating or modifying project files.
- Follow the structure and logic defined above.
- Keep JavaScript modular and readable.
- Ensure file read/write operations use Electron’s file system APIs (`fs` module).
- The UI should be simple and functional, using basic HTML/CSS without frameworks.
- Maintain data consistency between UI and the JSON file.
- Use `electron-packager` or `electron-builder` to create the `.exe` build.

---
```
