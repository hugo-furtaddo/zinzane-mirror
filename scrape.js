// cloneAll.js
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const xml2js = require('xml2js');

async function getUrlsFromSitemap(sitemapUrl) {
  console.log(`🔍 Baixando sitemap: ${sitemapUrl}`);
  const res = await axios.get(sitemapUrl);
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(res.data);

  // Se for <urlset>, retorna todas as <loc>
  if (result.urlset && result.urlset.url) {
    return result.urlset.url.map(u => u.loc[0]);
  }

  // Se for <sitemapindex>, percorre cada sub-sitemap recursivamente
  if (result.sitemapindex && result.sitemapindex.sitemap) {
    let urls = [];
    for (const s of result.sitemapindex.sitemap) {
      const subSitemap = s.loc[0];
      const subUrls = await getUrlsFromSitemap(subSitemap);
      urls = urls.concat(subUrls);
    }
    return urls;
  }

  return [];
}

async function clonePage(page, pageUrl, saveDir) {
  console.log(`➡️  Clonando ${pageUrl}`);
  await page.goto(pageUrl, { waitUntil: 'networkidle2' });
  const html = await page.content();
  await fs.writeFile(path.join(saveDir, 'index.html'), html);
}

(async () => {
  // Parâmetros: URL base e pasta de saída
  const [,, baseUrl = 'https://www.zinzane.com.br', outputDir = 'clone-all'] = process.argv;
  const base = baseUrl.replace(/\/$/, '');

  // Dois sitemaps fornecidos pelo usuário
  const sitemapUrls = [
    `${base}/sitemap/userRoute-0.xml`,
    `${base}/sitemap/product-0.xml`
  ];

  // Limpa ou cria a pasta de saída
  await fs.emptyDir(outputDir);

  // Coleta URLs de cada sitemap
  let allUrls = [];
  for (const sitemap of sitemapUrls) {
    try {
      const urls = await getUrlsFromSitemap(sitemap);
      console.log(`✅ Encontradas ${urls.length} URLs em ${sitemap}`);
      allUrls = allUrls.concat(urls);
    } catch (err) {
      console.error(`❌ Erro ao ler ${sitemap}:`, err.message);
    }
  }

  // Remove duplicatas e filtra URLs válidas
  allUrls = [...new Set(allUrls)].filter(u => u.startsWith('http'));

  console.log(`\n🌐 Total de páginas únicas para clonar: ${allUrls.length}\n`);

  // Inicia o Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Para cada URL, cria pasta espelhando a rota e salva index.html
  for (const pageUrl of allUrls) {
    try {
      const urlObj = new URL(pageUrl);
      // monta o diretório de saída baseado em pathname
      let saveDir = path.join(outputDir, urlObj.pathname);
      if (saveDir.endsWith(path.sep)) {
        saveDir = saveDir.slice(0, -1);
      }
      if (urlObj.pathname === '/' || urlObj.pathname === '') {
        saveDir = outputDir;
      }
      await fs.ensureDir(saveDir);
      await clonePage(page, pageUrl, saveDir);
    } catch (err) {
      console.error(`❌ Erro clonando ${pageUrl}:`, err.message);
    }
  }

  await browser.close();
  console.log(`\n🎉 Clone completo em "${outputDir}"`);
})();
