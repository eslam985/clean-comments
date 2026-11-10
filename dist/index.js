#!/usr/bin/env node
import _generate from "@babel/generator";
import { parse as babelParse } from "@babel/parser";
import { parse as vueParse } from "@vue/compiler-sfc";
import * as fs from "fs";
import * as path from "path";
const generate = _generate.default || _generate;
const IGNORED_DIRS = new Set([
    "node_modules",
    ".git",
    ".nuxt",
    ".output",
    "dist",
    ".next",
    ".cache",
    ".turbo",
    ".vscode",
    ".idea",
    "coverage",
    "build",
]);
const ALLOWED_EXTENSIONS = /\.(js|jsx|ts|tsx|mjs|cjs|mts|cts|vue|html|css|scss|sass|less)$/i;
const COMMON_SOURCE_DIRS = [
    "src",
    "app",
    "pages",
    "components",
    "layouts",
    "composables",
    "server",
    "plugins",
    "middleware",
    "utils",
    "lib",
    "modules",
];
const COMMON_ROOT_FILES = ["app.vue", "error.vue"];
/**
 * Get all files recursively from a directory or return the file itself
 */
const getAllFiles = (targetPath) => {
    try {
        if (!fs.existsSync(targetPath)) {
            return [];
        }
        const stat = fs.statSync(targetPath);
        if (stat.isFile()) {
            return [targetPath];
        }
        if (!stat.isDirectory()) {
            return [];
        }
        const files = [];
        const entries = fs.readdirSync(targetPath, { withFileTypes: true });
        for (const entry of entries) {
            if (entry.name.startsWith(".") && entry.isDirectory()) {
                continue;
            }
            if (IGNORED_DIRS.has(entry.name)) {
                continue;
            }
            const fullPath = path.join(targetPath, entry.name);
            if (entry.isDirectory()) {
                files.push(...getAllFiles(fullPath));
            }
            else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
        return files;
    }
    catch (error) {
        console.warn(`⚠️ Warning: Could not read path "${targetPath}":`, error.message);
        return [];
    }
};
const cleanHtmlCode = (content) => {
    const matches = content.match(/<!--[\s\S]*?-->/g);
    const count = matches ? matches.length : 0;
    if (count === 0) {
        return { content, count: 0 };
    }
    return { content: content.replace(/<!--[\s\S]*?-->/g, ""), count };
};
const cleanCssCode = (content) => {
    const matches = content.match(/\/\*[\s\S]*?\*\//g);
    const count = matches ? matches.length : 0;
    if (count === 0) {
        return { content, count: 0 };
    }
    return { content: content.replace(/\/\*[\s\S]*?\*\//g, ""), count };
};
/**
 * Clean JavaScript/TypeScript code using Babel AST
 */
const cleanJsTsCode = (code, filePath) => {
    if (!code || !code.trim()) {
        return { content: code, count: 0 };
    }
    try {
        const ast = babelParse(code, {
            sourceType: "module",
            plugins: [
                "jsx",
                "typescript",
                "decorators-legacy",
                "exportDefaultFrom",
            ],
            allowImportExportEverywhere: true,
            allowReturnOutsideFunction: true,
        });
        const count = ast.comments ? ast.comments.length : 0;
        if (count === 0) {
            return { content: code, count: 0 };
        }
        const output = generate(ast, { comments: false, retainLines: true }, code);
        return { content: output.code, count };
    }
    catch (error) {
        const target = filePath ? `file "${filePath}"` : "script block";
        console.warn(`⚠️ Warning: AST parse failed for ${target}, keeping original: ${error.message}`);
        return { content: code, count: 0 };
    }
};
/**
 * Clean Vue SFC (.vue) using exact character offsets from @vue/compiler-sfc
 */
const cleanVueFile = (fileContent, filePath) => {
    try {
        const { descriptor, errors } = vueParse(fileContent, { filename: filePath });
        if (errors && errors.length > 0) {
            console.warn(`⚠️ Warning: Vue SFC parsing reported issues for "${filePath}":`, errors[0]?.message);
        }
        const replacements = [];
        let totalCount = 0;
        // 1. Script block (<script>)
        if (descriptor.script && descriptor.script.content) {
            const { content: cleanedScript, count } = cleanJsTsCode(descriptor.script.content, `${filePath} (<script>)`);
            totalCount += count;
            if (count > 0) {
                replacements.push({
                    start: descriptor.script.loc.start.offset,
                    end: descriptor.script.loc.end.offset,
                    content: cleanedScript,
                });
            }
        }
        // 2. Script Setup block (<script setup>)
        if (descriptor.scriptSetup && descriptor.scriptSetup.content) {
            const { content: cleanedScript, count } = cleanJsTsCode(descriptor.scriptSetup.content, `${filePath} (<script setup>)`);
            totalCount += count;
            if (count > 0) {
                replacements.push({
                    start: descriptor.scriptSetup.loc.start.offset,
                    end: descriptor.scriptSetup.loc.end.offset,
                    content: cleanedScript,
                });
            }
        }
        // 3. Template block (<template>)
        if (descriptor.template && descriptor.template.content) {
            const { content: cleanedTemplate, count } = cleanHtmlCode(descriptor.template.content);
            totalCount += count;
            if (count > 0) {
                replacements.push({
                    start: descriptor.template.loc.start.offset,
                    end: descriptor.template.loc.end.offset,
                    content: cleanedTemplate,
                });
            }
        }
        // 4. Style blocks (<style>)
        if (descriptor.styles && descriptor.styles.length > 0) {
            for (const style of descriptor.styles) {
                if (!style.content)
                    continue;
                const { content: cleanedStyle, count } = cleanCssCode(style.content);
                totalCount += count;
                if (count > 0) {
                    replacements.push({
                        start: style.loc.start.offset,
                        end: style.loc.end.offset,
                        content: cleanedStyle,
                    });
                }
            }
        }
        if (replacements.length === 0 || totalCount === 0) {
            return { content: fileContent, count: 0 };
        }
        // Sort replacements in descending order by start offset so prior offsets stay valid
        replacements.sort((a, b) => b.start - a.start);
        let result = fileContent;
        for (const rep of replacements) {
            result = result.slice(0, rep.start) + rep.content + result.slice(rep.end);
        }
        return { content: result, count: totalCount };
    }
    catch (error) {
        console.warn(`⚠️ Warning: Could not parse Vue file "${filePath}":`, error.message);
        return { content: fileContent, count: 0 };
    }
};
const printHelp = () => {
    console.log(`
🚀 clean-comments - Smart, safe comment cleaner for modern codebases

Usage:
  npx clean-comments [directories or files...]

Options:
  -h, --help    Show help message

Behavior:
  If no directories or files are passed, clean-comments automatically detects
  common source directories and root components:
  ${COMMON_SOURCE_DIRS.join(", ")}, ${COMMON_ROOT_FILES.join(", ")}

Examples:
  npx clean-comments              # Auto-detects project structure (Nuxt, Next, Vite, etc.)
  npx clean-comments app          # Clean specific directory
  npx clean-comments src pages    # Clean multiple directories
  npx clean-comments .            # Clean entire project safely (excluding node_modules, build caches, etc.)
  npx clean-comments app.vue      # Clean a single file
`);
};
const main = () => {
    const args = process.argv.slice(2);
    if (args.includes("-h") || args.includes("--help")) {
        printHelp();
        return;
    }
    const userTargets = args.filter((arg) => !arg.startsWith("-"));
    let targets = [];
    if (userTargets.length > 0) {
        const missing = userTargets.filter((t) => !fs.existsSync(t));
        if (missing.length > 0) {
            for (const m of missing) {
                console.error(`❌ Target "${m}" not found!`);
            }
        }
        targets = userTargets.filter((t) => fs.existsSync(t));
        if (targets.length === 0) {
            process.exit(1);
        }
    }
    else {
        // Auto-detection mode
        const foundDirs = COMMON_SOURCE_DIRS.filter((dir) => {
            try {
                return fs.existsSync(dir) && fs.statSync(dir).isDirectory();
            }
            catch {
                return false;
            }
        });
        const foundFiles = COMMON_ROOT_FILES.filter((file) => {
            try {
                return fs.existsSync(file) && fs.statSync(file).isFile();
            }
            catch {
                return false;
            }
        });
        targets = [...foundDirs, ...foundFiles];
        if (targets.length === 0) {
            console.error(`❌ No default source directories found (checked: ${COMMON_SOURCE_DIRS.join(", ")})!`);
            console.log("\n💡 Usage: npx clean-comments [directories or files...]");
            console.log("   Example: npx clean-comments .");
            console.log("   Example: npx clean-comments app");
            process.exit(1);
        }
        console.log(`🔍 Auto-detected targets: ${targets.join(", ")}`);
    }
    try {
        const filesToProcess = new Set();
        for (const target of targets) {
            const files = getAllFiles(target);
            for (const file of files) {
                if (ALLOWED_EXTENSIONS.test(file)) {
                    filesToProcess.add(file);
                }
            }
        }
        if (filesToProcess.size === 0) {
            console.log("ℹ️ No matching files found to clean.");
            return;
        }
        let totalCommentsRemoved = 0;
        let filesCleanedCount = 0;
        for (const filePath of filesToProcess) {
            try {
                const rawContent = fs.readFileSync(filePath, "utf8");
                let result = { content: rawContent, count: 0 };
                if (filePath.endsWith(".vue")) {
                    result = cleanVueFile(rawContent, filePath);
                }
                else if (filePath.endsWith(".html")) {
                    result = cleanHtmlCode(rawContent);
                }
                else if (/\.(css|scss|sass|less)$/i.test(filePath)) {
                    result = cleanCssCode(rawContent);
                }
                else {
                    result = cleanJsTsCode(rawContent, filePath);
                }
                if (result.count > 0) {
                    fs.writeFileSync(filePath, result.content, "utf8");
                    totalCommentsRemoved += result.count;
                    filesCleanedCount++;
                    console.log(`✨ Cleaned: ${filePath} (${result.count} comments removed)`);
                }
            }
            catch (fileError) {
                console.warn(`⚠️ Warning: Failed processing "${filePath}":`, fileError.message);
            }
        }
        if (totalCommentsRemoved === 0) {
            console.log(`\n✨ Your codebase is already clean! No comments found.`);
        }
        else {
            console.log(`\n✅ Codebase successfully cleaned!`);
            console.log(`📊 Summary: ${totalCommentsRemoved} comments removed across ${filesCleanedCount} files.`);
        }
    }
    catch (error) {
        console.error("💥 An unexpected error occurred during execution:", error);
        process.exit(1);
    }
};
main();
