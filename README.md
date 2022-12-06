# Weebs Scraper

Web scraper for Anoboy, Doramaindo, Komiku, and Komikcast. Build using Node JS.

# Getting Started

1. Clone the repository, and navigate to the repository directory.

2. Setup `.env` for Anoboy Link and Doramaindo (Anoboy and Doramaindo Link often get changed time to time, so make sure to check it regularly). Example : 
```
ANOBOY_LINK="Enter Anoboy Link Here"
DORAMAINDO_LINK="Enter Doramaindo Link Here"
```

3. Run `npm install`.

4. Run the code.
```
npm run start
```

# Sample Result

- Note that this scraper is deployed on a `free Render service`, so `some features may not work properly` and, it maybe `out of quota` sometimes.

#### 1. Anoboy
  - [Get Latest Animes](https://weeb-scraper.onrender.com/api/anoboy)
  ```
  https://weeb-scraper.onrender.com/api/anoboy
  ```
  - [Search Certain Anime](https://weeb-scraper.onrender.com/api/anoboy?s=kaguya)
  ```
  https://weeb-scraper.onrender.com/api/anoboy?s=kaguya
  ```
  - [Get Anime Detail as well as the stream link](https://weeb-scraper.onrender.com/api/anoboy/2022~12~bleach-sennen-kessen-hen-episode-9~)
  ```
  https://weeb-scraper.onrender.com/api/anoboy/2022~12~bleach-sennen-kessen-hen-episode-9~
  ```
  
  
#### 2. Komiku
  - [Get Latest Mangas](https://weeb-scraper.onrender.com/api/komiku)
  ```
  https://weeb-scraper.onrender.com/api/komiku
  ```
  - [Search Certain Manga](https://weeb-scraper.onrender.com/api/komiku?s=Kaguya)
  ```
  https://weeb-scraper.onrender.com/api/komiku?s=Kaguya
  ```
