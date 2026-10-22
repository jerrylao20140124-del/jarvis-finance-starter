# Lesson 3 — JARVIS Allowance Controller

A futuristic allowance controller for secondary-school students. The website is English.

## Start here

Open **PROMPTS.md** after cloning. It contains EVERY classroom prompt in order, including the complete student starter prompt. Colour presets and a custom colour picker are part of Prompt 00. Do not paste every stage at once.

A working first-stage app is included as a fallback: HUD, colour controls and transaction ledger. Charts, savings targets and the advisor are compiling placeholders. Use Prompt 00 to generate/refine your starter with your chosen name and colour; then follow the numbered stages.

## Run on Windows

Open the folder containing package.json in VS Code. Use a compatible Node version (Vite 7 requires Node 20.19+ or 22.12+; this project was checked on Node 24).

```sh
npm install
npm run dev
```

Open the localhost address printed by the terminal. Ctrl+C stops the server. Check source with `npm run build` and money logic with `npm test`.

The first visit seeds ONE $100 Allowance income dated today. Use fictional transactions. Log means record a transaction, not log in.

## Publish on GitHub Pages

GitHub Pages can host the static frontend, but it cannot run the Node.js server or `/api/classify` advisor endpoint. On Pages, the advisor is unavailable; transactions and reflections still work and remain in that browser's local storage.

Build the static site into `docs/`:

```sh
npm run build:pages
```

Commit and push the generated `docs/` files. In the GitHub repository, open **Settings → Pages**, choose **Deploy from a branch**, select branch **main** and folder **/docs**, then save. The Pages link will appear in the same settings page after deployment completes.

## Teacher reference components

`teacher/Charts.tsx`, `teacher/Goal.tsx` and `teacher/Advisor.tsx` are fallback examples. Copy only the needed file's contents into the corresponding `src/components` file. The examples' relative imports are designed for that destination. Students implement one module at a time with PROMPTS.md.

## AI configuration — teacher only

Copy .env.example to .env. Default AI_MODE=mock returns a clearly labelled fixed English example. For real calls set AI_MODE=live, GEMINI_API_KEY and an available GEMINI_MODEL; restart the server. Do not put keys in browser code, VITE_ variables, Git or prompts. Real calls need a valid model, key, quota and network; no live call was tested with your private key.

All generated advice is requested in English. The student retains the final judgment. The local server listens on localhost; this is not a deployed payment/banking service.

## Storage

Transactions use integer cents and browser localStorage. Accent is saved under jarvis-accent. Git saves source, not the browser ledger. The previous ledger key is retained for compatibility; user-entered text is not silently translated or deleted. Different browsers/devices do not automatically sync.

## References

https://github.com/recharts/recharts
https://googleapis.github.io/js-genai/
https://ai.google.dev/gemini-api/docs/generate-content/structured-output
