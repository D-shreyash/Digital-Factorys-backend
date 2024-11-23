const express = require("express");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require("cors");

const app = express();
app.use(cors());
const upload = multer({ dest: "uploads/" }); // Stores files in 'uploads' folder

// Google Generative AI API setup
const genAI = new GoogleGenerativeAI("AIzaSyDbe_iut_7CSkTu0IT6MT68LwQtv67vKPA"); // Replace with your API key
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post(
  "/evaluate",
  upload.fields([{ name: "standardFile" }, { name: "testFile" }]),
  async (req, res) => {
    const standardFile = req.files["standardFile"][0];
    const testFile = req.files["testFile"][0];

    try {
      // Extract text from both PDFs
      const standardText = await extractTextFromPDF(standardFile.path);
      const testText = await extractTextFromPDF(testFile.path);

      // Construct the query
      const additionalText = `
        You are tasked with evaluating the following two documents: a Standard Document and a Test Document.

1. **Evaluation of the Test Document compared to the Standard Document**:
   Provide a detailed evaluation of the Test Document compared to the Standard Document. Identify strengths, weaknesses, and areas where improvements are needed. Use the following sections:
   
   **Strengths of the Test Document**: 
   List the strengths of the Test Document when compared to the Standard Document.

   **Weaknesses of the Test Document**: 
   List the weaknesses or missing elements in the Test Document when compared to the Standard Document.

   **Suggestions for Improvements**: 
   Suggest what must be added or improved in the Test Document to match the Standard Document, including specific changes or additions that would enhance its quality.

2. **Output Format**:
   The response should be organized into clearly defined sections with titles that can be easily parsed:
   - **Strengths of the Test Document**:
     - [Strength 1]
     - [Strength 2]
   - **Weaknesses of the Test Document**:
     - [Weakness 1]
     - [Weakness 2]
   - **Suggestions for Improvements**:
     - [Suggestion 1]
     - [Suggestion 2]
   
Please ensure that each section is properly titled and the content is clearly separated by new lines. Each list item in the sections should be on a new line for easy parsing and rendering in the frontend.
      `;
      const prompt = `
        Standard Document Content: 
        ${standardText}

        Test Document Content: 
        ${testText}

        ${additionalText}
      `;

      // Generate evaluation using Google Generative AI
      const result = await model.generateContent(prompt);

      // Clean up uploaded files after processing
      fs.unlinkSync(standardFile.path);
      fs.unlinkSync(testFile.path);

      console.log(result.response.text(), "awekdocnaowednc");

      // Respond with the AI-generated result
      res.json({
        evaluation: result.response.text(),
      });
    } catch (error) {
      console.error("Error processing request:", error);
      res.status(500).send("Error processing request");
    }
  }
);

// Extract text from a PDF
function extractTextFromPDF(filePath) {
  return new Promise((resolve, reject) => {
    const dataBuffer = fs.readFileSync(filePath);
    pdfParse(dataBuffer)
      .then((data) => resolve(data.text))
      .catch(reject);
  });
}

app.listen(3001, () => {
  console.log("Server started at port 3001");
});
