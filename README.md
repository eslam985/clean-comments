# 🚀 Clean Comments CLI

A lightweight, **zero-dependency** CLI tool written in **TypeScript** to safely and smartly remove all types of comments (JS, TS, Vue, HTML, CSS) from your codebase before pushing to GitHub. It ensures your public repositories look clean, professional, and free of mixed or AI-generated junk comments.

---

## ✨ Features

- **Multi-language Support:** Cleans comments in `.js`, `.ts`, `.vue`, `.css`, and `.html` files.
- **Smart Protection:** Safely distinguishes between actual comments and text strings or URLs (e.g., `https://` won't be broken).
- **Deep Scanning:** Recursively scans all subdirectories inside the target folder.
- **Zero External Dependencies:** Built natively on Node.js FS APIs, keeping it fast and lightweight.

---

## 🔒 Prerequisites & Troubleshooting (Crucial)

During development and deployment, we encountered and resolved key environmental challenges. Follow these quick steps to ensure a flawless setup:

### 1. Fixing Git Fetch Protocol Error (`EALLOWGIT`)
Modern Node/npm environments (especially on Linux) block direct package installation via Git for security reasons, throw an `EALLOWGIT` error.
* **The Solution:** Run this command **once** in your terminal to allow secure package fetching directly from GitHub:
  ```bash
  npm config set allow-git all
  ```

### 2. Handling Blocked Install Scripts Warning
Since this package builds itself automatically using TypeScript under a `postinstall` hook, npm might throw an `install-scripts` security warning and block the build.
* **The Solution:** If you see this warning during installation, approve the package scripts by running:
  ```bash
  npm install-scripts approve clean-comments
  ```

### 3. Preventing `node_modules` Leak to GitHub
Ensure you do not accidentally upload your heavy local development dependencies (`node_modules/` or `dist/`) to your public repository.
* **The Solution:** Always initialize a proper `.gitignore` file in your repository root containing:
  ```text
  node_modules/
  dist/
  ```

---

## 🚀 How to Use

You can run this tool instantly on any project without installation, or configure it as a local development script.

### Option 1: On-the-Fly via `npx` (Recommended)
Open the terminal inside **any front-end or back-end project** that has a `src` directory, and run the following command directly:

```bash
npx github:eslam985/clean-comments#main
```

### Option 2: Add it to your Local Project Tools
If you want to bake it permanently into your project's local tools:

1. Install it as a dev dependency via npm:
   ```bash
   npm install -D github:eslam985/clean-comments#main
   ```

2. Open your project's local `package.json` and map a shortcut script under `"scripts"`:
   ```json
   "scripts": {
     "clean": "clean-comments"
   }
   ```

3. Run it anytime before staging your Git commits:
   ```bash
   npm run clean
   ```

---

## 🛡️ Best Safety Practices

While this tool is heavily optimized to protect string expressions via conditional lookbehinds, it is **strongly advised** to strictly use it alongside Git workflows to avoid irreversible code losses.

Follow this standard execution order:

```bash
# 1. Stage your current codebase changes safely
git add .

# 2. Run the cleaning tool to purge AI/junk comments
npm run clean

# 3. Format spacing and clean up empty lines using Prettier
npm run format

# 4. Review exact changes to make sure everything is 100% safe
git diff
```

---

## 📝 License

This project is licensed under the MIT License - feel free to use and modify it!

---
Made with 💻 by [eslam985](https://github.com/eslam985)
