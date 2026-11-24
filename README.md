# Calcolatore Mutuo

Calcolatore web di un mutuo con ammortamento alla francese (rata costante).

- Importo, durata e tasso impostabili con le barre mobili **oppure** scrivendo il valore nella casella accanto.
- Calcolo in tempo reale di interessi totali pagati alla banca, rata mensile, totale da restituire.
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
