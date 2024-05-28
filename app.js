const express = require('express');
const bodyParser = require('body-parser');
const { scrapeItems } = require('./scraper');
const { scrapeItemsFromHiFiCorp } = require('./scraperHiFiCorp');
const app = express();
const port = 3000;
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Function to compute similarity score between two strings using Levenshtein distance
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // Initialize matrix
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Compute Levenshtein distance
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

// Function to group similar items based on name similarity
function groupSimilarItems(items, itemsFromHiFiCorp) {
    const allItems = [...items, ...itemsFromHiFiCorp];
    const groups = {};

    allItems.forEach(item => {
        const similarityKey = item.name.toLowerCase();
        if (!groups[similarityKey]) {
            groups[similarityKey] = [];
        }
        groups[similarityKey].push(item);
    });

    return Object.values(groups);
}



app.post('/search', async (req, res) => {
  const searchText = req.body.searchText;

  console.log('Received search text:', searchText);

  try {
      // Scrape items from different sources concurrently
      const [items, itemsFromHiFiCorp] = await Promise.all([
          scrapeItems(searchText),
          scrapeItemsFromHiFiCorp(searchText)
      ]);

      // Group similar items from both sources
      const groupedItems = groupSimilarItems(items, itemsFromHiFiCorp);

      // Flatten the grouped items and sort them by similarity and price
      const mergedItems = groupedItems.flatMap(group => group.sort((a, b) => {
          const similarityA = levenshteinDistance(a.name.toLowerCase(), searchText.toLowerCase());
          const similarityB = levenshteinDistance(b.name.toLowerCase(), searchText.toLowerCase());
          if (similarityA === similarityB) {
              return a.price - b.price;
          }
          return similarityA - similarityB;
      }));

      console.log(mergedItems);

      res.status(200).json({ data: mergedItems });
  } catch (error) {
      console.error('Error during web scraping:', error);
      res.status(500).send('Internal Server Error');
  }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
