import type { Request, Response, Application } from "express";

import express from "express";
import path from "path";

const app: Application = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

app.get("/", (_: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "../index.html"));
});

app.get("/preview", async (req: Request, res: Response) => {
    try {
        const url = req.query.url?.toString();
        const agent = req.query.agent?.toString() ?? "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)";

        if (!url || !URL.canParse(url.toString())) {
            return res.status(422).json({ error: "invalid url" });
        }

        const parsedUrl = new URL(url);

        const response = await fetch(parsedUrl, {
            method: "GET",
            headers: {
                "User-Agent": agent,
            },
        });

        if (!response.ok) {
            console.log({
                request: {
                    headers: {
                        "User-Agent": agent,
                    },
                },
                response,
            });
            return res.status(422).json({ error: "invalid url response" });
        }

        const html = await response.text();

        const getMeta = (name: string): string | undefined => {
            const regex = new RegExp(`<meta\\s+[^>]*?(?:property|name)=["']${name}["'][^>]*?content=["']([^"']+)["']`, "i");
            const match = html.match(regex);
            return match?.[1];
        };

        const getTitleTag = (): string | undefined => {
            const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            return match?.[1]?.trim();
        };

        return res.json({
            title: getMeta("og:title") || getTitleTag(),
            description: getMeta("og:description"),
            image: getMeta("og:image"),
            site: parsedUrl,
        });
    } catch (error) {
        return res.status(500).json({ error: "Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
