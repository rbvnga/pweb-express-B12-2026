import express from "express";

const app = express();

app.use(express.json());

// check endpoint
app.get("/", (_req, res) => {
  res.status(200).send("Server is up and running 💫");
});

const PORT = 3000;
app.listen(PORT, (error?: Error) => {
  if (error) throw error; // Express 5: error saat listen (mis. port dipakai) dikirim ke callback
  console.log(`Express is running on Port ${PORT}`);
});