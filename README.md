# 🚀 Clean Comments CLI

A lightweight, **zero-dependency** CLI tool designed to safely and smartly remove all types of comments from your codebase before pushing it to GitHub. It ensures your public repositories look clean, professional, and free of mixed or AI-generated junk comments.

---

## ✨ Features

- **Multi-language Support:** Cleans comments in `.js`, `.ts`, `.vue`, `.css`, and `.html` files.
- **Smart Protection:** Safely distinguishes between actual comments and text strings or URLs (e.g., `https://` won't be broken).
- **Deep Scanning:** Recursively scans all subdirectories inside the `src` folder.
- **Zero Dependencies:** Written entirely in native Node.js, keeping it fast and bloat-free.

---

## 🔒 Prerequisites & Troubleshooting (Important)

If you are using a modern or secure Node/npm environment (especially on Linux), fetching packages via Git protocols might be disabled by default, causing an **`EALLOWGIT`** error.

To avoid this and allow npm to securely fetch this package directly from GitHub, run this command **once** in your terminal before installation:

```bash
npm config set allow-git all
```

---

## 🚀 How to Use

You can run this tool instantly on any project without installing it, or configure it as a local/global script.

### Option 1: On-the-Fly via `npx` (Recommended)
Open the terminal inside **any front-end or back-end project** that has a `src` directory, and run the following command directly:

```bash
npx github:eslam985/clean-comments#main
```

### Option 2: Add it to your Project Scripts
If you want to include it inside your project's local tools:

1. Install it via npm:
   ```bash
   npm install -D github:eslam985/clean-comments
   ```

2. Add a shortcut script inside your project's `package.json`:
   ```json
   "scripts": {
     "clean": "clean-comments"
   }
   ```

3. Run it anytime before your Git commits:
   ```bash
   npm run clean
   ```

---

## 🛡️ Safety First

While this tool is highly optimized using lookbehind assertions to protect strings, it is **strongly recommended** to use it alongside Git. 

Always ensure your current progress is staged or committed before running the tool so you can review changes easily:

```bash
# 1. Stage your current changes
git add .

# 2. Run the tool
npm run clean

# 3. Review what was removed
git diff
```

---

## 📝 License

This project is licensed under the MIT License - feel free to use and modify it!

---
Made with 💻 by [eslam985](https://github.com/eslam985)
