# veto-bitcoin
# 🗳️ BitSky Veto Popup

Skrypt wyświetlający popup z apelem o **weto Prezydenta RP dla ustawy o rynku kryptoaktywów**.

---

## 📦 Licencja

**Licencja:** [The Unlicense](https://unlicense.org/)  
Pełna dowolność w wykorzystaniu, modyfikacji i rozpowszechnianiu kodu.

**Autor:** [Daniel Haczyk](https://bitsky.pl)  
Telegram: [@bitsky](https://t.me/bitsky)

---

## ⚙️ Sposoby użycia

### 🧩 Opcja 1 – Najprostsza (jedna linijka)

Wklej w stopce swojej strony:


<script src="https://cyfrowaekonomia.pl/pliki/veto.js" defer></script>

Skrypt samodzielnie utworzy popup z apelem.

### 💻 Opcja 2 – Własny hosting

Pobierz plik ze strony:  
➡️ [https://cyfrowaekonomia.pl/pliki/veto.js](https://cyfrowaekonomia.pl/pliki/veto.js)

Umieść go na swoim serwerze (np. w folderze `/js`) i dodaj w stopce:

<script src="/js/veto.js" defer></script>

Skrypt jest samowystarczalny — działa w Shadow DOM, nie korzysta z żadnych zewnętrznych bibliotek ani styli.
Nie ingeruje w wygląd strony i nie wysyła żadnych danych.
Możesz dostosować jego ustawienia bezpośrednio w kodzie (sekcja CONFIG na górze pliku veto.js).

### 🧰 Opcja 3 – Wtyczka do WordPressa

Pobierz gotową wtyczkę ZIP:  
➡️ [https://cyfrowaekonomia.pl/pliki/veto.zip](https://cyfrowaekonomia.pl/pliki/veto.zip)  

Lub zainstaluj z folderu `wordpress` z tego repozytorium.

Po instalacji i aktywacji:

1. Wejdź w **Ustawienia → BitSky Veto Popup**  
2. Zaznacz **„Włącz wyświetlanie”**  
3. Zapisz zmiany  

Wtyczka zapisuje konfigurację lokalnie w pliku `config.json` (nie korzysta z bazy danych WordPressa).  
Nie ładuje żadnych zewnętrznych zasobów i nie modyfikuje wyglądu motywu — działa całkowicie niezależnie.

---

## ⚙️ Ustawienia (dla opcji 2 i 3)

Można konfigurować:

- 📝 **Treść komunikatu** — pełna treść HTML wyświetlana w popupie  
- 🔗 **URL odnośnika** — np. link do strony z apelem (domyślnie [bitcoin.pl](https://bitcoin.pl))  
- ⏱️ **Częstotliwość wyświetlania popupu:**
  - `always` — za każdym razem (bez cookie)  
  - `minutes` — raz na określony czas *(domyślnie: 1 dzień / 1440 minut)*  
  - `never` — tylko raz (trwale zapamiętane cookie)  
- 🗓️ **Automatyczne wyłączenie** — po określonej dacie (np. 31 grudnia) popup przestanie się pokazywać  
  *(przydatne, jeśli ktoś zapomni później usunąć skrypt)*  
- 🔤 **Czcionka, rozmiary, paddingi, teksty przycisków** — można dostosować, jednak zalecane jest pozostawienie wartości domyślnych  

---

## 🔒 Bezpieczeństwo i zgodność

- Skrypt i wtyczka są **całkowicie nieinwazyjne** – nie zmieniają styli strony, działają w **Shadow DOM**.  
- Nie korzystają z żadnych zewnętrznych zasobów (czcionek, bibliotek, trackerów).  
- Nie zapisują danych użytkowników i nie wysyłają niczego poza stronę.  
- Wtyczka WordPress zapisuje ustawienia lokalnie w pliku `config.json` — **nie korzysta z bazy danych**.  
- Po instalacji popup **nie uruchamia się automatycznie** – trzeba go włączyć ręcznie w panelu ustawień.

---

## 📸 Efekt

Czarny popup z białym, pogrubionym tekstem, przyciskami:  
- **„Szczegóły”** – w stylu outline (czarne tło, biała ramka)  
- **„Zamknij”** – biały przycisk z czarnym obramowaniem  

Na urządzeniach mobilnych popup zajmuje cały ekran, a przyciski ustawiają się pionowo (100% szerokości).

---

## 📬 Kontakt

**Autor:** [Daniel Haczyk](https://bitsky.pl)  
Telegram: [@bitsky](https://t.me/bitsky)  
Projekt: [CyfrowaEkonomia.pl](https://cyfrowaekonomia.pl)

---

> 🇵🇱 Projekt społeczny mający na celu wsparcie inicjatywy weta wobec ustawy o rynku kryptoaktywów.