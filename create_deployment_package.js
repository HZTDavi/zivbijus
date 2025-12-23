const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuração
const ROOT_DIR = __dirname;
const CLIENT_DIR = path.join(ROOT_DIR, 'client');
const OUTPUT_ZIP = path.join(ROOT_DIR, 'zivbijus_frontend_only.zip');

console.log('🚀 Iniciando criação do PACOTE DE DEPLOY FRONTEND-ONLY (ZivBijus)...');

// 1. Limpeza
if (fs.existsSync(OUTPUT_ZIP)) fs.unlinkSync(OUTPUT_ZIP);

// 2. Build do Frontend
console.log('🔨 Buildando Frontend (Vite)...');
try {
    execSync('npm run build', { cwd: CLIENT_DIR, stdio: 'inherit' });
} catch (e) {
    console.error('❌ Erro ao buildar o frontend.');
    process.exit(1);
}

// 3. Compactar conteudo de CLIENT/dist
console.log('📦 Criando arquivo ZIP...');
const DIST_DIR = path.join(CLIENT_DIR, 'dist');

try {
    // Check if dist exists
    if (!fs.existsSync(DIST_DIR)) {
        throw new Error("Pasta dist não encontrada!");
    }

    // Zip the CONTENT of dist, not the folder dist itself, so user extracts directly to public_html
    execSync(`cd "${DIST_DIR}" && zip -r "${OUTPUT_ZIP}" .`);

    console.log(`
✅ SUCESSO!
Arquivo criado: ${OUTPUT_ZIP}

COMO FAZER O DEPLOY NA HOSTINGER:
1. Acesse o File Manager da Hostinger (pasta public_html).
2. Apague TUDO que estiver lá (se quiser limpar o site antigo).
3. Faça upload do arquivo 'zivbijus_frontend_only.zip'.
4. Clique com botão direito e escolha "EXTRACT" (Extrair) -> Para a pasta atual (.).
5. Pronto! Seu site estático está no ar conectado ao Supabase.
    `);

} catch (e) {
    console.error('❌ Erro ao criar ZIP:', e.message);
}
