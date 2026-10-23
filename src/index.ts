#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

/**
 * تقرأ جميع الملفات داخل المجلد والمجلدات الفرعية بشكل تراجعي (Recursive)
 * @param dir المجلد المراد البحث بداخله
 * @returns قائمة بمسارات الملفات الكاملة
 */
const getAllFiles = (dir: string): string[] => {
  return fs.readdirSync(dir).reduce<string[]>((files: string[], file: string) => {
    const fullPath = path.join(dir, file);
    return fs.statSync(fullPath).isDirectory() 
      ? [...files, ...getAllFiles(fullPath)] 
      : [...files, fullPath];
  }, []);
};

/**
 * تنظف محتوى الملف من كافة أنواع التعليقات مع حماية النصوص والروابط
 * @param content كود الملف الأصلي
 * @returns الكود نظيفاً بدون تعليقات
 */
const stripComments = (content: string): string => {
  const commentRegex = /(['"`])(?:\\.|[^\\])*?\1|(\/\*[\s\(\S\)]*?\*\/|<!--[\s\(\S\)]*?-->|(?<!:)\/\/.*)/g;
  return content.replace(commentRegex, (match: string, _g1: string, g2: string | undefined) => g2 ? '' : match);
};


const main = (): void => {
  const targetDir = 'src';

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Target directory "${targetDir}" not found! Make sure you run this in a project root.`);
    process.exit(1);
  }

  try {
    const files = getAllFiles(targetDir);
    const allowedExtensions = /\.(js|ts|vue|css|html)$/;
    
    files.forEach((filePath) => {
      if (allowedExtensions.test(filePath)) {
        const rawContent = fs.readFileSync(filePath, 'utf8');
        const cleanContent = stripComments(rawContent);

        fs.writeFileSync(filePath, cleanContent, 'utf8');
        console.log(`✨ Cleaned: ${filePath}`);
      }
    });

    console.log('✅ Basecode successfully cleaned of all junk comments!');
  } catch (error) {
    console.error('💥 An error occurred during execution:', error);
    process.exit(1);
  }
};

// تشغيل الأداة
main();
