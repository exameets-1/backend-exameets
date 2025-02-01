import app from "./app.js"
const PORT = process.env.PORT || 10000 ; // Use the port from the environment or fallback to 10000 for local dev
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
