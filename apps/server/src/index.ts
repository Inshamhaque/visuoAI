import express from "express";
const app = express();
// health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
