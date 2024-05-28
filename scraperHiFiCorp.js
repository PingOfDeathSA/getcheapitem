// scraperHiFiCorp.js
const puppeteer = require('puppeteer');

async function scrapeItemsFromHiFiCorp(searchText) {
  const targetClassSelector = '.item.product.product-item';

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://www.hificorp.co.za/catalogsearch/result/?q=${searchText}`);
    await page.waitForSelector(targetClassSelector);

    const productItems = await page.$$(targetClassSelector);
    const items = [];
    console.log(productItems.length)
    for (const productItem of productItems) {
      const productName = await productItem.$eval('.product-item-link', element => element.textContent.trim());
      const productPrice = await productItem.$eval('.price-box.price-final_price .price-container .price-wrapper .price', element => element.textContent.trim());
      const productImageLink = await productItem.$eval('.product-image-photo', image => image.getAttribute('src'));
      const productLink = await productItem.$eval('.product-item-link', link => link.getAttribute('href'));
      const numericPrice = parseInt(productPrice.replace(/[^\d]/g, ''), 10);

      items.push({
        shopImage: "https://www.contactdetails.co.za/wp-content/uploads/2023/06/HiFi-Corp.jpeg",
        link: productLink,
        name: productName,
        price: numericPrice,
        imageLink: productImageLink,
      });
    }

    items.sort((a, b) => a.price - b.price);
    await browser.close();

    return items;
  } catch (error) {
    console.error('Error during web scraping (HiFiCorp):', error);
    throw error;
  }
}

module.exports = {
  scrapeItemsFromHiFiCorp,
};
