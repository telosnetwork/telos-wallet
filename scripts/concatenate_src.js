const fs = require('fs');
const path = require('path');

const pwd = process.cwd();

const srcDirectory = './src'; // Asegúrate de que este es el camino correcto a la carpeta src
const outputFiles = {
    js: 'all_javascript.js',
    ts: 'all_typescript.ts',
    scss: 'all_styles.scss',
    html: 'all_templates.html',
};

// Función para escribir el contenido de un archivo en el archivo correspondiente
function appendFileContent(filePath, fileType) {
    const content = fs.readFileSync(filePath, 'utf8');
    let commentSyntax = '// file: ';
    let sufix = '\n\n';

    if (fileType === 'html') {
        commentSyntax = '<!-- file: ';
        sufix = ' -->\n\n';
    }

    const writeStream = fs.createWriteStream(outputFiles[fileType], { flags: 'a' });
    writeStream.write(`${commentSyntax}${filePath}${sufix}`);
    writeStream.write(content + '\n\n');
    writeStream.end();
}

// Función recursiva para leer directorios y archivos
function readDirectory(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stats = fs.statSync(fullPath);
        if (stats.isDirectory()) {
            readDirectory(fullPath); // Llamada recursiva para directorios
        } else if (stats.isFile()) {
            const fileType = path.extname(file).slice(1);
            if (outputFiles[fileType]) {
                appendFileContent(fullPath, fileType); // Procesar archivos según su tipo
            }
        }
    }
}

// Leer y procesar la carpeta src
readDirectory(srcDirectory);
