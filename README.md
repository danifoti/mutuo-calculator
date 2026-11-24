# Calcolatore Mutuo

Calcolatore web di un mutuo con ammortamento alla francese (rata costante).

- Valore della casa, percentuale da finanziare, importo del mutuo (max 500.000 €), durata e tasso impostabili con le barre mobili **oppure** scrivendo il valore nella casella accanto.
- Pulsanti rapidi per finanziare il 50%, 60% o 80% del valore della casa; percentuale e importo restano collegati.
- Calcolo in tempo reale di rata mensile, interessi totali pagati alla banca, anticipo da versare, totale da restituire e costo totale della casa.
- Piano di ammortamento annuale.

Sito statico (HTML/CSS/JS, nessuna dipendenza né build).

## Uso in locale

Apri `index.html` nel browser, oppure:

```bash
npx serve .
```

## Deploy su Vercel

Importa il repository su [vercel.com/new](https://vercel.com/new): Vercel lo riconosce come sito statico,
non serve configurare comando di build né cartella di output.

In alternativa, dalla CLI:

```bash
npx vercel --prod
```
