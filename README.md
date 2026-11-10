# 🚀 Clean Comments CLI

A lightweight, **zero-dependency** CLI tool written in **TypeScript** to safely and smartly remove all types of comments (JS, TS, Vue, HTML, CSS, SCSS) from your codebase before pushing to GitHub. It ensures your public repositories look clean, professional, and free of mixed or AI-generated junk comments.

Works seamlessly with **Nuxt.js, Next.js, Vite, Vue SFCs, React, Angular, Svelte, and Node.js backend projects**.

---

## ✨ Features

- **Multi-Framework Auto-Detection:** Automatically detects your project layout whether it's Nuxt (`app/`, `pages/`, `components/`, `app.vue`), Next.js, or traditional `src/`.
- **Multi-language Support:** Cleans comments in `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs`, `.vue`, `.html`, `.css`, `.scss`, `.sass`, and `.less` files.
- **Smart Vue SFC Parser:** Accurately cleans `<script>`, `<script setup>`, nested `<template>` slots, and `<style>` blocks using AST & exact compiler offsets without breaking tags.
- **Smart Protection:** Safely distinguishes between actual comments and text strings, regex literals, or URLs (e.g., `https://` won't be broken).
- **Safe Deep Scanning:** Recursively scans your project while automatically ignoring `node_modules`, `.git`, `.nuxt`, `.output`, `dist`, `.next`, `coverage`, and other build/cache directories.
- **Flexible Targets:** Run without arguments to auto-detect, or pass specific directories, files, or `.` as arguments.

---

## 🚀 How to Use

You can run this tool instantly on any project without installation, or configure it as a local development script.

### Option 1: On-the-Fly via `npx` (Recommended)

Run it inside your project root:

```bash
# Auto-detects project structure (src, app, pages, components, server, etc.)
npx github:eslam985/clean-comments#main

# Or target specific directories or files:
npx github:eslam985/clean-comments#main app
npx github:eslam985/clean-comments#main app pages components
npx github:eslam985/clean-comments#main .
```

### Option 2: Add it to your Local Project Tools

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

It is **strongly advised** to strictly use it alongside Git workflows to review changes before committing:

```bash
# 1. Stage your current codebase changes safely
git add .

# 2. Run the cleaning tool to purge AI/junk comments
npx github:eslam985/clean-comments#main

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
