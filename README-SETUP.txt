StudyStack v8 — GitHub Pages auto-shared decks

Upload the CONTENTS of this ZIP to the ROOT of your existing GitHub repository (main branch), preserving folder paths. The ZIP itself should NOT be uploaded as a single file.

Required files:
  index.html
  decks/index.json
  decks/social-studies-chapter-10.json
  scripts/build_deck_index.py
  .github/workflows/update-deck-index.yml

GitHub repository Settings > Actions > General > Workflow permissions:
  Select Read and write permissions and Save.

GitHub Pages: Settings > Pages > Deploy from branch > main > / (root).

When you upload a new valid JSON deck to decks/, GitHub Actions automatically updates decks/index.json. The GitHub Pages site reads that catalog and loads the decks on each device. Each browser saves its own Known/Unknown ratings locally.

You can use the included Social Studies deck as a test. Future deck files should be named something like science-chapter-5.json and contain {"title":"Science Chapter 5","cards":[{"front":"Question?","back":"Answer."}]}.

If a deck does not appear: Check the Actions tab for failed runs, verify the workflow has write permission, and use Refresh shared decks on the StudyStack homepage.

Updating shared deck questions: Matching question-and-answer pairs preserve local mastery. Changing either side of a card creates a new unmastered card. Removed cards are removed from the shared deck when refreshed.

Local decks and local mastery are not uploaded to GitHub. Previously exported standalone HTML decks do not auto-update.
