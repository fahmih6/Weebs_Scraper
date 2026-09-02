# Weebs Scraper

Web scraper for Anoboy, Komiku, Komikcast, and Voratoon. Build using Node JS.

# Getting Started

1. Clone the repository, and navigate to the repository directory.

2. Setup `.env` for Anoboy Link and Komikcast Link (Anoboy often get changed time to time, so make sure to check it regularly). Example :

```
ANOBOY_LINK="Enter Anoboy Link Here"
KOMIKCAST_LINK="Enter Komikcast Link Here"
```

3. Run `npm install`.

4. Run the code.

```
npm run start
```

# Sample Result

- Note that this scraper is deployed on a `free Render service`, so `some features may not work properly` and, it maybe `out of quota` sometimes.
- Looks like `our free IP/Domain has been blocked by Anoboy and Komikcast` on some VPS providers, returning 403 errors.

### Handling 403 Errors (Proxy)

If you are running this on a VPS and encounter a `403 Forbidden` error (especially for Komikcast), it means the hosting IP is blocked by Cloudflare.

To fix this, you can set a proxy in `services/manga-service-v2.js`:

```javascript
const proxyConfig = {
  protocol: "http",
  host: "your-proxy-ip",
  port: your - port,
  auth: {
    username: "your-username",
    password: "your-password",
  },
};

const axiosConfig = {
  timeout: 15000,
  proxy: proxyConfig,
  headers: {
    // ... headers
  },
};
```

Or ideally, use the `KOMIKCAST_PROXY` environment variable if the logic is implemented to read from `.env`.

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

#### 3. Komikcast

- [Get Latest Mangas](https://weeb-scraper.onrender.com/api/komikcast)

```
https://weeb-scraper.onrender.com/api/komikcast
```

- [Search Certain Manga](https://weeb-scraper.onrender.com/api/komikcast?s=Kaguya)

```
https://weeb-scraper.onrender.com/api/komikcast?s=Kaguya
```

#### 4. Voratoon

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
