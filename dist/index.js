import * as fs from "fs";
import * as path from "path";
import { parse as babelParse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import { parse as vueParse } from "@vue/compiler-sfc";
const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;
const getAllFiles = (dir) => {
    return fs
        .readdirSync(dir)
        .reduce((files, file) => {
        const fullPath = path.join(dir, file);
        return fs.statSync(fullPath).isDirectory()
            ? [...files, ...getAllFiles(fullPath)]
            : [...files, fullPath];
    }, []);
};
const cleanHtmlCode = (content) => {
    const matches = content.match(/<!--[\s\S]*?-->/g);
    const count = matches ? matches.length : 0;
    return { content: content.replace(/<!--[\s\S]*?-->/g, ""), count };
};
const cleanCssCode = (content) => {
    const matches = content.match(/\/\*[\s\S]*?\*\//g);
    const count = matches ? matches.length : 0;
    return { content: content.replace(/\/\*[\s\S]*?\*\//g, ""), count };
};
/**
 * تنظيف الكود البرمجي (JS/TS) باستخدام Babel AST
 */
const cleanJsTsCode = (code) => {
    let count = 0;
    try {
        const ast = babelParse(code, {
            sourceType: "module",
            plugins: ["jsx", "typescript", "decorators-legacy"],
            allowImportExportEverywhere: true,
        });
        traverse(ast, {
            enter(path) {
                if (path.node.leadingComments) {
                    count += path.node.leadingComments.length;
                    path.node.leadingComments = undefined;
                }
                if (path.node.trailingComments) {
                    count += path.node.trailingComments.length;
                    path.node.trailingComments = undefined;
                }
                if (path.node.innerComments) {
                    count += path.node.innerComments.length;
                    path.node.innerComments = undefined;
                }
            },
        });
        const output = generate(ast, { retainLines: true }, code);
        return { content: output.code, count };
    }
    catch (error) {
        console.warn(`⚠️ Warning: AST parse failed for script block, keeping original.`);
        return { content: code, count: 0 };
    }
};
/**
 * تنظيف ملفات الـ Vue SFC (.vue)
 */
const cleanVueFile = (fileContent, filePath) => {
    try {
        const { descriptor } = vueParse(fileContent, { filename: filePath });
        let result = fileContent;
        let totalCount = 0;
        const scriptBlock = descriptor.scriptSetup || descriptor.script;
        if (scriptBlock) {
            const { content: cleanedScript, count } = cleanJsTsCode(scriptBlock.content);
            totalCount += count;
            if (count > 0) {
                const tagRegex = new RegExp(`(<script[^>]*>)([\\s\\S]*?)(<\\/script>)`);
                result = result.replace(tagRegex, (_match, openTag, _content, closeTag) => {
                    return `${openTag}\n${cleanedScript}\n${closeTag}`;
                });
            }
        }
        if (descriptor.template) {
            const { content: cleanedTemplate, count } = cleanHtmlCode(descriptor.template.content);
            totalCount += count;
            if (count > 0) {
                result = result.replace(/(<template[^>]*>)([\s\S]*?)(<\/template>)/, (_match, openTag, _content, closeTag) => {
                    return `${openTag}${cleanedTemplate}${closeTag}`;
                });
            }
        }
        if (descriptor.styles && descriptor.styles.length > 0) {
            for (const style of descriptor.styles) {
                const { content: cleanedStyle, count } = cleanCssCode(style.content);
                totalCount += count;
                if (count > 0) {
                    result = result.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (_match, openTag, _content, closeTag) => {
                        return `${openTag}${cleanedStyle}${closeTag}`;
                    });
                }
            }
        }
        return { content: result, count: totalCount };
    }
    catch (error) {
        console.warn(`⚠️ Warning: Could not parse Vue file ${filePath}`, error);
        return { content: fileContent, count: 0 };
    }
};
const main = () => {
    const targetDir = "src";
    if (!fs.existsSync(targetDir)) {
        console.error(`❌ Target directory "${targetDir}" not found!`);
        process.exit(1);
    }
    try {
        const files = getAllFiles(targetDir);
        const allowedExtensions = /\.(js|ts|vue|html|css)$/;
        let totalCommentsRemoved = 0;
        files.forEach((filePath) => {
            if (allowedExtensions.test(filePath)) {
                const rawContent = fs.readFileSync(filePath, "utf8");
                let result = { content: rawContent, count: 0 };
                if (filePath.endsWith(".vue")) {
                    result = cleanVueFile(rawContent, filePath);
                }
                else if (filePath.endsWith(".html")) {
                    result = cleanHtmlCode(rawContent);
                }
                else if (filePath.endsWith(".css")) {
                    result = cleanCssCode(rawContent);
                }
                else {
                    result = cleanJsTsCode(rawContent);
                }
                if (result.count > 0) {
                    fs.writeFileSync(filePath, result.content, "utf8");
                    totalCommentsRemoved += result.count;
                    console.log(`✨ Cleaned: ${filePath} (${result.count} comments removed)`);
                }
            }
        });
        console.log(`\n✅ Basecode successfully cleaned! Total comments removed: ${totalCommentsRemoved}`);
    }
    catch (error) {
        console.error("💥 An error occurred during execution:", error);
        process.exit(1);
    }
};
main();
