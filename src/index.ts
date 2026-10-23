import * as fs from "fs";
import * as path from "path";
import { parse as babelParse } from "@babel/parser";
import _traverse from "@babel/traverse";
import _generate from "@babel/generator";
import { parse as vueParse } from "@vue/compiler-sfc";

const traverse = (_traverse as any).default || _traverse;
const generate = (_generate as any).default || _generate;

const getAllFiles = (dir: string): string[] => {
  return fs
    .readdirSync(dir)
    .reduce<string[]>((files: string[], file: string) => {
      const fullPath = path.join(dir, file);
      return fs.statSync(fullPath).isDirectory()
        ? [...files, ...getAllFiles(fullPath)]
        : [...files, fullPath];
    }, []);
};

const cleanHtmlCode = (content: string): string => {
  return content.replace(/<!--[\s\S]*?-->/g, "");
};

const cleanCssCode = (content: string): string => {
  return content.replace(/\/\*[\s\S]*?\*\//g, "");
};

/**
 * تنظيف الكود البرمجي (JS/TS) باستخدام Babel AST
 */
const cleanJsTsCode = (code: string): string => {
  try {
    const ast = babelParse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "decorators-legacy"],
      allowImportExportEverywhere: true,
    });

    traverse(ast, {
      enter(path: any) {
        if (path.node.leadingComments) path.node.leadingComments = undefined;
        if (path.node.trailingComments) path.node.trailingComments = undefined;
        if (path.node.innerComments) path.node.innerComments = undefined;
      },
    });

    const output = generate(ast, { retainLines: true }, code);
    return output.code;
  } catch (error) {
    console.warn(
      `⚠️ Warning: AST parse failed for script block, keeping original.`,
    );
    return code;
  }
};

/**
 * تنظيف ملفات الـ Vue SFC (.vue)
 */
const cleanVueFile = (fileContent: string, filePath: string): string => {
  try {
    const { descriptor } = vueParse(fileContent, { filename: filePath });
    let result = fileContent;

    // 1. تنظيف السكربت العادي أو script setup باستخدام Babel AST
    const scriptBlock = descriptor.scriptSetup || descriptor.script;
    if (scriptBlock) {
      const cleanedScript = cleanJsTsCode(scriptBlock.content);
      // استبدال محتوى السكربت القديم بالجديد داخل الملف
      const tagRegex = new RegExp(`(<script[^>]*>)([\\s\\S]*?)(<\\/script>)`);
      result = result.replace(
        tagRegex,
        (_match, openTag, _content, closeTag) => {
          return `${openTag}\n${cleanedScript}\n${closeTag}`;
        },
      );
    }

    // 2. تنظيف تعليقات الـ HTML في الـ Template <!-- ... -->
    if (descriptor.template) {
      const templateContent = descriptor.template.content;
      const cleanedTemplate = templateContent.replace(/<!--[\s\S]*?-->/g, "");
      result = result.replace(
        /(<template[^>]*>)([\s\S]*?)(<\/template>)/,
        (_match, openTag, _content, closeTag) => {
          return `${openTag}${cleanedTemplate}${closeTag}`;
        },
      );
    }

    // 3. تنظيف تعليقات الـ CSS في الـ Style /* ... */
    if (descriptor.styles && descriptor.styles.length > 0) {
      result = result.replace(
        /(<style[^>]*>)([\s\S]*?)(<\/style>)/g,
        (_match, openTag, content, closeTag) => {
          const cleanedStyle = content.replace(/\/\*[\s\S]*?\*\//g, "");
          return `${openTag}${cleanedStyle}${closeTag}`;
        },
      );
    }

    return result;
  } catch (error) {
    console.warn(`⚠️ Warning: Could not parse Vue file ${filePath}`, error);
    return fileContent;
  }
};

const main = (): void => {
  const targetDir = "src";

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Target directory "${targetDir}" not found!`);
    process.exit(1);
  }

  try {
    const files = getAllFiles(targetDir);
    const allowedExtensions = /\.(js|ts|vue|html|css)$/;
    files.forEach((filePath) => {
      if (allowedExtensions.test(filePath)) {
        const rawContent = fs.readFileSync(filePath, "utf8");
        let cleanContent = rawContent;

        if (filePath.endsWith(".vue")) {
          cleanContent = cleanVueFile(rawContent, filePath);
        } else if (filePath.endsWith(".html")) {
          cleanContent = cleanHtmlCode(rawContent);
        } else if (filePath.endsWith(".css")) {
          cleanContent = cleanCssCode(rawContent);
        } else {
          cleanContent = cleanJsTsCode(rawContent);
        }

        fs.writeFileSync(filePath, cleanContent, "utf8");
        console.log(`✨ AST Cleaned: ${filePath}`);
      }
    });

    console.log("✅ Basecode successfully cleaned using AST & SFC Parser!");
  } catch (error) {
    console.error("💥 An error occurred during execution:", error);
    process.exit(1);
  }
};

main();
