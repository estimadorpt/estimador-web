import sharp from 'sharp';
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const brandingDir = join(projectRoot, 'public', 'branding');

async function generateBranding() {
  console.log('Generating branding assets...\n');

  // Export sizes for each SVG type
  const exports = [
    // Icon (square) exports
    { svg: 'logo-icon-large.svg', sizes: [256, 512, 1024, 2048] },
    
    // Stacked exports (for LinkedIn, social, etc.)
    { svg: 'logo-stacked.svg', sizes: [400, 800, 1200] },
    { svg: 'logo-stacked-dark.svg', sizes: [400, 800, 1200] },
    
    // Horizontal exports
    { svg: 'logo-horizontal.svg', sizes: [300, 600, 1200] },
  ];

  for (const { svg, sizes } of exports) {
    const svgPath = join(brandingDir, svg);
    const svgContent = readFileSync(svgPath, 'utf8');
    const baseName = basename(svg, '.svg');
    
    console.log(`Processing ${svg}...`);
    
    for (const width of sizes) {
      const outputName = `${baseName}-${width}w.png`;
      const outputPath = join(brandingDir, outputName);
      
      await sharp(Buffer.from(svgContent))
        .resize({ width })
        .png()
        .toFile(outputPath);
      
      console.log(`  ✓ ${outputName}`);
    }
    console.log('');
  }

  // Generate LinkedIn-optimized versions (1200x627 for link previews, 1200x1200 for posts)
  console.log('Generating LinkedIn-optimized versions...');
  
  const stackedSvg = readFileSync(join(brandingDir, 'logo-stacked.svg'), 'utf8');
  const stackedDarkSvg = readFileSync(join(brandingDir, 'logo-stacked-dark.svg'), 'utf8');
  
  // LinkedIn post (square)
  await sharp(Buffer.from(stackedSvg))
    .resize(1200, 1200, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(join(brandingDir, 'linkedin-post-light.png'));
  console.log('  ✓ linkedin-post-light.png (1200x1200)');
  
  await sharp(Buffer.from(stackedDarkSvg))
    .resize(1200, 1200, { fit: 'contain', background: { r: 30, g: 41, b: 59, alpha: 1 } })
    .png()
    .toFile(join(brandingDir, 'linkedin-post-dark.png'));
  console.log('  ✓ linkedin-post-dark.png (1200x1200)');

  // LinkedIn cover (1584x396)
  console.log('\nGenerating LinkedIn cover...');
  const coverDarkSvg = readFileSync(join(brandingDir, 'linkedin-cover-dark.svg'), 'utf8');
  await sharp(Buffer.from(coverDarkSvg))
    .resize(1584, 396)
    .png()
    .toFile(join(brandingDir, 'linkedin-cover-dark.png'));
  console.log('  ✓ linkedin-cover-dark.png (1584x396)');

  console.log('\n✅ All branding assets generated!');
  console.log(`\nAssets saved to: public/branding/`);
  console.log('\nAvailable files:');
  
  const files = readdirSync(brandingDir).sort();
  files.forEach(f => console.log(`  - ${f}`));
}

generateBranding().catch(console.error);

