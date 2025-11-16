const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const PDFDocument = require('pdfkit');
const Question = require('../models/Question');

// Export questions as DOCX
const exportDOCX = async (req, res) => {
  try {
    const { questionIds, userId, includeAnswers = true, includeHints = true } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Question IDs are required' });
    }

    // Fetch questions
    const questions = await Question.find({
      _id: { $in: questionIds },
      userId
    }).sort({ createdAt: -1 });

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found' });
    }

    // Create document
    const sections = [];

    // Title
    sections.push(
      new Paragraph({
        text: 'Question Bank Export',
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({ text: '' }) // Empty line
    );

    // Add questions
    questions.forEach((q, index) => {
      sections.push(
        new Paragraph({
          text: `Question ${index + 1}`,
          heading: HeadingLevel.HEADING_2,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Type: ${q.type.toUpperCase()} | Difficulty: ${q.difficulty.toUpperCase()}`,
              italics: true,
            }),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({
              text: q.question,
              bold: true,
            }),
          ],
        }),
        new Paragraph({ text: '' })
      );

      // MCQ Options
      if (q.type === 'mcq' && q.options && q.options.length > 0) {
        q.options.forEach((option, idx) => {
          sections.push(
            new Paragraph({
              text: `${String.fromCharCode(65 + idx)}. ${option}`,
            })
          );
        });
        sections.push(new Paragraph({ text: '' }));
      }

      // Answer
      if (includeAnswers) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Answer: ${q.correctAnswer}`,
                color: '008000',
                bold: true,
              }),
            ],
          }),
          new Paragraph({ text: '' })
        );
      }

      // Explanation
      if (includeAnswers && q.explanation) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Explanation: `,
                bold: true,
              }),
              new TextRun({
                text: q.explanation,
              }),
            ],
          }),
          new Paragraph({ text: '' })
        );
      }

      // Hint
      if (includeHints && q.hint) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Hint: `,
                italics: true,
              }),
              new TextRun({
                text: q.hint,
                italics: true,
              }),
            ],
          }),
          new Paragraph({ text: '' })
        );
      }

      // Separator
      sections.push(
        new Paragraph({ text: '---' }),
        new Paragraph({ text: '' })
      );
    });

    const doc = new Document({
      sections: [{
        properties: {},
        children: sections,
      }],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename=questions.docx');
    res.send(buffer);

  } catch (error) {
    console.error('Export DOCX error:', error);
    res.status(500).json({ 
      error: 'Failed to export questions',
      message: error.message 
    });
  }
};

// Export questions as PDF
const exportPDF = async (req, res) => {
  try {
    const { questionIds, userId, includeAnswers = true, includeHints = true } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({ error: 'Question IDs are required' });
    }

    // Fetch questions
    const questions = await Question.find({
      _id: { $in: questionIds },
      userId
    }).sort({ createdAt: -1 });

    if (questions.length === 0) {
      return res.status(404).json({ error: 'No questions found' });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=questions.pdf');
    
    // Pipe PDF to response
    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('Question Bank Export', { align: 'center' });
    doc.moveDown(2);

    // Add questions
    questions.forEach((q, index) => {
      // Question number and metadata
      doc.fontSize(14).font('Helvetica-Bold').text(`Question ${index + 1}`, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica-Oblique').text(`Type: ${q.type.toUpperCase()} | Difficulty: ${q.difficulty.toUpperCase()}`);
      doc.moveDown(0.5);

      // Question text
      doc.fontSize(12).font('Helvetica-Bold').text(q.question);
      doc.moveDown(0.5);

      // MCQ Options
      if (q.type === 'mcq' && q.options && q.options.length > 0) {
        doc.font('Helvetica');
        q.options.forEach((option, idx) => {
          doc.text(`${String.fromCharCode(65 + idx)}. ${option}`);
        });
        doc.moveDown(0.5);
      }

      // Answer
      if (includeAnswers) {
        doc.font('Helvetica-Bold').fillColor('green').text(`Answer: ${q.correctAnswer}`);
        doc.fillColor('black');
        doc.moveDown(0.5);
      }

      // Explanation
      if (includeAnswers && q.explanation) {
        doc.font('Helvetica-Bold').text('Explanation: ', { continued: true });
        doc.font('Helvetica').text(q.explanation);
        doc.moveDown(0.5);
      }

      // Hint
      if (includeHints && q.hint) {
        doc.font('Helvetica-Oblique').text(`Hint: ${q.hint}`);
        doc.moveDown(0.5);
      }

      // Separator
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1);

      // Add new page if needed (except for last question)
      if (index < questions.length - 1 && doc.y > 650) {
        doc.addPage();
      }
    });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Export PDF error:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to export questions',
        message: error.message 
      });
    }
  }
};

module.exports = {
  exportDOCX,
  exportPDF
};
