import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// SVG for the logo icon (three circles)
const logoSvg = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="11" cy="50" r="8" fill="#1E3A5F"/>
  <circle cx="42" cy="50" r="12" fill="#0F766E"/>
  <circle cx="81" cy="50" r="16" fill="#D4A000"/>
</svg>`;

// SVG with background for favicon (better visibility at small sizes)
const faviconSvg = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="16" fill="#FFFFFF"/>
  <circle cx="11" cy="50" r="8" fill="#1E3A5F"/>
  <circle cx="42" cy="50" r="12" fill="#0F766E"/>
  <circle cx="81" cy="50" r="16" fill="#D4A000"/>
</svg>`;

async function generateIcons() {
  console.log('Generating icon assets...');

  // Generate PNG icons at various sizes
  const sizes = [
    { size: 16, name: 'favicon-16x16.png', svg: faviconSvg },
    { size: 32, name: 'favicon-32x32.png', svg: faviconSvg },
    { size: 180, name: 'apple-touch-icon.png', svg: logoSvg },
    { size: 192, name: 'icon-192.png', svg: logoSvg },
    { size: 512, name: 'icon-512.png', svg: logoSvg },
    { size: 60, name: 'logo.png', svg: logoSvg }, // For structured data
  ];

  for (const { size, name, svg } of sizes) {
    const outputPath = join(projectRoot, 'public', name);
    await sharp(Buffer.from(svg))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${name}`);
  }

  // Generate ICO file (multi-resolution)
  // ICO needs 16x16 and 32x32 combined
  const ico16 = await sharp(Buffer.from(faviconSvg))
    .resize(16, 16)
    .png()
    .toBuffer();

  const ico32 = await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toBuffer();

  // Simple ICO generation (single 32x32 for now, browsers prefer PNG anyway)
  // Copy the 32x32 as favicon.ico location alternative
  await sharp(Buffer.from(faviconSvg))
    .resize(32, 32)
    .png()
    .toFile(join(projectRoot, 'public', 'favicon.png'));

  console.log('Generated: favicon.png');

  // Also save SVG versions for scalable use
  writeFileSync(join(projectRoot, 'public', 'logo.svg'), logoSvg);
  console.log('Generated: logo.svg');

  // White version for dark backgrounds (lighter navy circle)
  const logoWhiteSvg = `<svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="11" cy="50" r="8" fill="#4A6FA5"/>
  <circle cx="42" cy="50" r="12" fill="#0F766E"/>
  <circle cx="81" cy="50" r="16" fill="#D4A000"/>
</svg>`;
  writeFileSync(join(projectRoot, 'public', 'logo-light.svg'), logoWhiteSvg);
  console.log('Generated: logo-light.svg');

  // Generate a proper SVG favicon for modern browsers
  writeFileSync(join(projectRoot, 'public', 'favicon.svg'), faviconSvg);
  console.log('Generated: favicon.svg');

  console.log('\nAll icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Update src/app/favicon.ico with the new favicon');
  console.log('2. Or use favicon.svg in app/layout.tsx for modern browsers');
}

generateIcons().catch(console.error);
