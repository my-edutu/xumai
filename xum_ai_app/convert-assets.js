const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
const filesToConvert = ['icon.png', 'adaptive-icon.png', 'favicon.png'];

async function convert() {
    for (const file of filesToConvert) {
        const filePath = path.join(assetsDir, file);
        if (fs.existsSync(filePath)) {
            console.log(`Converting ${file} to true PNG...`);
            const buffer = fs.readFileSync(filePath);
            await sharp(buffer)
                .png()
                .toFile(path.join(assetsDir, `temp_${file}`));

            fs.unlinkSync(filePath);
            fs.renameSync(path.join(assetsDir, `temp_${file}`), filePath);
            console.log(`Successfully converted ${file}`);
        }
    }
}

convert().catch(console.error);
