const puppeteer = require('puppeteer');

async function scrapeItems(searchText) {
  const targetClassSelector = '.item.product.product-item';
  
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(`https://www.russells.co.za/catalogsearch/result/?q=${searchText}`);
    await page.waitForSelector(targetClassSelector);

    const productItems = await page.$$(targetClassSelector);
    const items = [];
console.log(productItems.length)
    for (const productItem of productItems) {
      const productName = await productItem.$eval('.product-item-link', element => element.textContent.trim());
      const productPrice = await productItem.$eval('.price-box.price-final_price .price-container .price-wrapper .price', element => element.textContent.trim());
      const productImageLink = await productItem.$eval('.product-image-photo', image => image.getAttribute('src'));
      const productLink = await productItem.$eval('.product-item-link', link => link.getAttribute('href'));
      const numericPrice = parseFloat(productPrice.replace(/[^\d.]/g, '')); // Parsing float to handle decimal prices

      items.push({
        shopImage: "https://i.ibb.co/M8Hwz2Y/russells.png",
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
    console.error('Error during web scraping:', error);
    throw error;
  }
}

module.exports = {
  scrapeItems,
};
