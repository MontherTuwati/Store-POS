# 🧾 StorePOS Point of Sale (POS)

![StorePOS Screenshot](screenshots/storepos_pos.png)

**StorePOS** is a sleek, offline-first desktop Point of Sale application built with Electron and Node.js. Designed for small to medium-sized retail environments, it offers essential sales functionality, multi-device networking, and intuitive user management all in a single packaged executable.

---

## ✨ Key Features

- 🖥 Multi-terminal: Connect multiple PCs to one shared database
- 🧾 Receipt printing with customizable layout
- 🔍 Barcode scanning & product search
- 👥 Staff accounts with permission levels
- 🛒 Product and category management
- 📦 Basic inventory control
- 🧾 Open Tabs (saved orders)
- 📇 Customer database
- 📊 Transaction history with filters:
  - By Till
  - By Cashier
  - By Date Range
  - By Status
- 🖨 Generate & print barcodes for products

---

## ⚙️ Tech Stack

- 🖥 **Electron** – for cross-platform desktop delivery  
- 🧠 **Node.js + Express** – for API layer  
- 🧾 **jQuery** – legacy-friendly UI logic  
- 💽 **SQLite (or NeDB)** – for offline-first local data storage  

---

## 🚀 Getting Started

### 🔧 Prerequisites

- **Node.js v16.14.0 or higher**  
  Use [nvm](https://github.com/nvm-sh/nvm) for safe version management.

- **Yarn** package manager  
  [Install Yarn](https://classic.yarnpkg.com/lang/en/docs/install/)

---

### 📦 Setup & Run (Development)

```bash
# Clone the repo
git clone https://github.com/MontherTuwati/Store-POS.git

cd Store-POS

# Install dependencies
yarn install
```

#### 🛠 Run in Development Mode

```bash
yarn electron
```

#### 📦 Build for Production

```bash
yarn electron-build
```

> 📝 The build will target your current OS.  
To build for other platforms (e.g., Windows from Linux), refer to: [electron.build/cli](https://www.electron.build/cli)

---

## 🧑‍💻 Contributing

We welcome community contributions! Please follow this workflow:

### 🌱 Branching

- Create a new branch for each feature or bugfix:

```bash
git checkout -b feature/short-description
```

### 🛠 Development Flow

- Fork the repo and clone your fork
- Code using existing style (jQuery + Express + Electron)
- Test thoroughly (including offline behavior)
- Commit clearly:

```bash
git commit -m "Fix: resolves incorrect cash rounding"
```

- Push to your fork and open a Pull Request (PR)

### ✅ Pull Request Guidelines

- Title should reflect the core change
- PR description must include:
  - Summary of changes
  - Screenshot or GIF (for UI updates)
  - Related issues (if any)

---

## 📄 License

Licensed under the  
**[GNU Affero General Public License v3.0](LICENSE)**

> 💬 *For custom builds or commercial licensing, reach out directly.*

---

## 🙌 Maintainer

**Monther Tuwati**  
[github.com/MontherTuwati](https://github.com/MontherTuwati)
