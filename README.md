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

- Note that this scraper is deployed on a `free dyno Heroku`, so `some features may not work properly` and, it maybe `out of quota` sometimes.

#### 1. Anoboy
  - [Get Latest Animes](https://weebs-scraper.herokuapp.com/api/anoboy)
  ```
  https://weebs-scraper.herokuapp.com/api/anoboy
  ```
  - [Search Certain Anime](https://weebs-scraper.herokuapp.com/api/anoboy?s=kaguya)
  ```
  https://weebs-scraper.herokuapp.com/api/anoboy?s=kaguya
  ```
  - [Get Anime Detail as well as the stream link](http://weebs-scraper.herokuapp.com/api/anoboy/2022~06~kaguya-sama-wa-kokurasetai-season-3-episode-13-tamat~)
  ```
  http://weebs-scraper.herokuapp.com/api/anoboy/2022~06~kaguya-sama-wa-kokurasetai-season-3-episode-13-tamat~
  ```
  
  
#### 2. Komiku
  - [Get Latest Mangas](https://weebs-scraper.herokuapp.com/api/komiku)
  ```
  https://weebs-scraper.herokuapp.com/api/komiku
  ```
  - [Search Certain Manga](https://weebs-scraper.herokuapp.com/api/komiku?s=Kaguya)
  ```
  https://weebs-scraper.herokuapp.com/api/komiku?s=Kaguya
  ```
