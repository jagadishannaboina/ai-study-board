const express = require("express");

const router = express.Router();

const Groq = require("groq-sdk");

const groq = new Groq({

    apiKey: process.env.GROQ_API_KEY

});

router.post("/summarize", async (req, res) => {

    try {

        const { text } = req.body;

        const completion = await groq.chat.completions.create({

            messages: [

                {

                    role: "system",

                    content: `

You are an AI collaborative whiteboard assistant.

Your task:

- Read whiteboard notes carefully

- Give short and professional summaries

- Do NOT explain topics deeply

- Do NOT generate tutorials

- Keep response under 5 lines

- Focus only on what users wrote on the board

`

                },

                {

                    role: "user",

                    content: `

Summarize these whiteboard notes briefly and professionally:

${text}

`

                }

            ],

            model: "llama-3.1-8b-instant"

        });

        res.json({

            summary: completion.choices[0].message.content

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({

            message: "Groq AI Error"

        });

    }

});

module.exports = router;