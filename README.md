# Weebs Scraper

Web scraper for Anoboy, Komiku, and Voratoon. Built using Node JS.

# Getting Started

1. Clone the repository, and navigate to the repository directory.

2. Setup `.env` for Anoboy Link (Anoboy often gets changed from time to time, so make sure to check it regularly). Example:

```
ANOBOY_LINK="Enter Anoboy Link Here"
```

3. Run `npm install`.

4. Run the code.

```
npm run start
```

# Sample Result

- Note that this scraper is deployed on a free Render service, so some features may take time to respond or run out of quota.
- Some hosting IP addresses may be blocked by upstream providers, returning 403 errors.

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

#### 3. Voratoon

- [Get Latest Mangas](https://weeb-scraper.onrender.com/api/voratoon)

```
https://weeb-scraper.onrender.com/api/voratoon
```

- [Search Certain Manga](https://weeb-scraper.onrender.com/api/voratoon?s=the+bully)

```
https://weeb-scraper.onrender.com/api/voratoon?s=the+bully
```

- [Get Manga Detail](https://weeb-scraper.onrender.com/api/voratoon/ota-kun-ni-dake-yasashisugiru-ayame-san)

```
https://weeb-scraper.onrender.com/api/voratoon/ota-kun-ni-dake-yasashisugiru-ayame-san
```

- [Get Chapter Images](https://weeb-scraper.onrender.com/api/voratoon/chapter/ota-kun-ni-dake-yasashisugiru-ayame-san/1)

```
https://weeb-scraper.onrender.com/api/voratoon/chapter/ota-kun-ni-dake-yasashisugiru-ayame-san/1
```

#### 4. Komikcast (Deprecated)

Komikcast reached End of Service (EOS) and was replaced by Voratoon. All requests to `/api/komikcast` return HTTP `410 Gone` with a migration pointer to `/api/voratoon`.

```
https://weeb-scraper.onrender.com/api/komikcast
```
