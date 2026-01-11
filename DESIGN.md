# DESIGN.md
## Örskömmtun í þjálfun – Web App

---

## 1. Tilgangur verkefnis
Þetta vefapp styður þjálfara í að skipuleggja æfingaálag í viku út frá:
- Leikdegi (match day)
- Áætluðu álagi (Low / Moderate / High)
- Exposure leikmanns (Low / Medium / High)

Kerfið notar örskömmtun (microdosing) til að stýra:
- Endurheimt
- Primer / Maintenance dögum
- MD+1 / MD-1 aðlögunum

---

## 2. Heildarflæði notanda
1. Notandi velur **leikmann**
2. Notandi skilgreinir **vikuna** (leikdagur o.fl.)
3. Notandi velur **álag og exposure**
4. Notandi ýtir á **“Búa til vikuplan”**
5. Vikuplan birtist hægra megin
6. Notandi smellir á dag → **dagspjald birtist**
7. Neðst á síðunni getur notandi notað **Program Generator**

---

## 3. Layout (skyldukröfur)

### 3.1 Header
- Titill: **„Örskömmtun í þjálfun“**
- Undirtitill sem útskýrir tilgang (stuttur)
- Status texti (t.d. „Vikuplan tilbúið“)

---

### 3.2 Meginapp – 2 dálkar

#### Vinstri dálkur: **Stillingar**
Inniheldur alltaf:
- Leikmannaval (`playerSelect`)
- Álag (`loadSelect`)
- Exposure (`exposureSelect`)
- Viku/dagaval (Mán–Sun)
- Aðgerðir:
  - **Búa til vikuplan**
  - **Hreinsa**

Kröfur:
- Röðin má aldrei breytast
- Engin útkoma (results) birtist í þessum dálki
- Allar stillingar eru “input only”

---

#### Hægri dálkur: **Vikuplan**
Inniheldur:
- Viku-kort (Mán–Sun)
- Hvert kort:
  - Dagur
  - Tegund dags (Æfing / Leikur / Primer / Recovery o.s.frv.)
  - Stutt athugasemd (t.d. MD+1 override)
- Smell á kort:
  - Uppfærir dagspjald fyrir neðan

---

### 3.3 Dagspjald (Day Panel)
- Birtist **fyrir neðan viku-kort**
- Sýnir:
  - Nafn dags
  - Tegund dags
  - Ástæður (t.d. exposure, MD+1)
  - Bullet lista með leiðbeiningum

Kröfur:
- Tómt state ef enginn dagur er valinn
- Uppfærðist aðeins við click á dag

---

## 4. Program Generator (fyrir neðan meginapp)

### 4.1 Staðsetning
- Alltaf **fyrir neðan** örskömmtunar-appið
- Full breidd (100%)

### 4.2 Tæknileg útfærsla
- Program Generator er **iframe embed**
- URL:
  https://695e88c5c8a2e9e10677286f--effervescent-cascaron-c992ff.netlify.app/

### 4.3 Controls
- Takki: **Sýna / fela**
- Takki: **Opna í nýjum glugga**

---

## 5. UI / Stíll (skyldur)

### Litasamsetning
- Dökkur bakgrunnur
- Blá/fjólublá áherslulit
- Engir skærir litir

### Hönnun
- Panel-based layout
- Rounded corners (≈16px)
- Kort (cards) fyrir daga
- Soft shadow / glow

### Responsive
- Mobile:
  - Dálkar raðast í einn
  - Program Generator heldur fullri breidd

---

## 6. Tæknilegar takmarkanir (MJÖG MIKILVÆGT)

- ❌ Ekki brjóta núverandi JS logic
- ❌ Ekki breyta `id` nema sérstaklega tekið fram
- ❌ Ekki fjarlægja virkni
- ✅ Leyfilegt:
  - Endurraða HTML
  - Bæta við CSS
  - Bæta við wrapperum (div/section)
  - Bæta við UI helper functions

---

## 7. Nafnavenjur (bindingar)

| Hlutur | ID / Class |
|------|-----------|
| Leikmaður | `#playerSelect` |
| Álag | `#loadSelect` |
| Exposure | `#exposureSelect` |
| Vikuplan | `#weekCards` |
| Dagspjald | `#dayPanel` |
| Program Generator | `#programGeneratorSection` |

---

## 8. Gæðaviðmið
- Notandi á ALDREI að upplifa „það gerist ekkert“
- Allar aðgerðir gefa sjónrænt feedback
- UI á að líta út eins og eitt samræmt app

---

## 9. Markmið til framtíðar (utan scope núna)
- Samkeyrsla exposure → Program Generator
- Vista vikuplan per leikmann
- Export (PDF / CSV)

## 10. Visual Parity Requirements (STRICT)

The UI must visually match the provided reference image.

Mandatory:
- Panels must have visible depth (shadow + inner gradient)
- Cards must have clear separation and hover affordance
- Typography hierarchy:
  - Section titles: large, bold
  - Card titles: medium weight
  - Metadata: muted, smaller
- Spacing:
  - Generous padding (16–24px)
  - Clear vertical rhythm
- Background:
  - Gradient / vignette, not flat black
- No flat boxes
- No “Bootstrap-like” appearance

---
