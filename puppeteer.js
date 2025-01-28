const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());

app.post('/generate-pdf', async (req, res) => {
    const { htmlContent } = req.body;

    if (!htmlContent) {
        return res.status(400).send('htmlContent is required');
    }

    try {
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 800 });
        await page.setContent(htmlContent, { waitUntil: 'networkidle2' });

        // Aguarda até que o gráfico com ID "gastosChart" esteja completamente carregado e visível
        await page.waitForFunction(() => {
            const chart = document.querySelector('#gastosChart');
            if (!chart) return false; // Verifica se o elemento existe
            return chart.offsetWidth > 0 && chart.offsetHeight > 0; // Verifica se o gráfico está visível
        });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });

        await browser.close();

        // Salva o PDF temporariamente para depuração (opcional)
        fs.writeFileSync('temp.pdf', pdfBuffer);

        // Envia o PDF como resposta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="generated.pdf"');
        res.end(Buffer.from(pdfBuffer));
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

app.listen(port, () => {
    console.log('Server is running on http://localhost:${port}');
});