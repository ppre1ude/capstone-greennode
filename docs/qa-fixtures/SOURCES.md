# AI QA Fixture Sources

These images are small QA fixtures for frontend/API smoke validation. They are
not a model-quality evaluation dataset.

| Fixture ID | Local file | Source | Author | License | Notes |
| --- | --- | --- | --- | --- | --- |
| `fresh-single` | `fresh-single-fresh-20260505.jpg` | [Banana (1).jpg](https://commons.wikimedia.org/wiki/File:Banana_(1).jpg) | Renee Comet / National Cancer Institute | Public domain | Resized Wikimedia Commons file. |
| `stale-or-rotten` | `stale-or-rotten-rejected-20260505.jpg` | [Rotten apples.JPG](https://commons.wikimedia.org/wiki/File:Rotten_apples.JPG) | WikiBCS | CC0 1.0 | Resized Wikimedia Commons file. |
| `not-food` | `not-food-rejected-20260505.jpg` | [Full view of desk.jpg](https://commons.wikimedia.org/wiki/File:Full_view_of_desk.jpg) | Nono cocon | CC0 1.0 | Resized Wikimedia Commons file. |
| `screenshot-or-ui` | `screenshot-or-ui-rejected-20260505.jpg` | Generated synthetic UI fixture | Codex | Project-owned generated test artifact | Avoids third-party app/map screenshot licensing issues. |
| `low-quality` | `low-quality-review-20260505.jpg` | Derived from `fresh-single` | Renee Comet / National Cancer Institute, derived by Codex | Public domain derivative | Downsampled and darkened to create a hard-to-evaluate photo. |
| `multi-object` | `multi-object-review-20260505.jpg` | [Apples and Bananas.JPG](https://commons.wikimedia.org/wiki/File:Apples_and_Bananas.JPG) | Wilrondeau | CC BY-SA 3.0 / GFDL | Resized Wikimedia Commons file. Attribution and share-alike terms apply. |

`large-image-local-only-20260505.jpg` is intentionally not committed. It is a
local-only upload-size guard fixture.
