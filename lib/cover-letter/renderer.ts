import {
  Document,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableLayoutType,
  ExternalHyperlink,
  VerticalAlign,
} from "docx";
import type { ParsedCoverLetter, BulletPoint } from "../types";
import {
  LETTER_WIDTH,
  LETTER_HEIGHT,
  MARGIN_TOP_BOTTOM,
  MARGIN_LEFT_RIGHT,
  BLACK,
  GREEN,
  FONT,
  LINE_SPACING,
  BULLET_SIZE,
  JOB_TITLE_SIZE,
} from "../constants";

// Sidebar is ~32% of content width, body is the rest
const CONTENT_WIDTH = LETTER_WIDTH - 2 * MARGIN_LEFT_RIGHT;
const SIDEBAR_WIDTH = Math.round(CONTENT_WIDTH * 0.32);
const BODY_WIDTH = CONTENT_WIDTH - SIDEBAR_WIDTH;

// Cover letter-specific sizes
const CL_NAME_SIZE = 56;        // 28pt
const ROLE_SIZE = 24;        // 12pt
const CL_CONTACT_SIZE = 18;     // 9pt
const BODY_SIZE = JOB_TITLE_SIZE; // 10pt
const GUTTER = 360;          // gap between sidebar and body (twips)

export function renderCoverLetter(letter: ParsedCoverLetter): Document {
  const mainTable = buildLayout(letter);

  return new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, color: BLACK },
          paragraph: {
            spacing: { before: 0, after: 0, line: LINE_SPACING },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: LETTER_WIDTH, height: LETTER_HEIGHT },
            margin: {
              top: MARGIN_TOP_BOTTOM,
              bottom: MARGIN_TOP_BOTTOM,
              left: MARGIN_LEFT_RIGHT,
              right: MARGIN_LEFT_RIGHT,
            },
          },
        },
        children: [mainTable],
      },
    ],
  });
}

function buildLayout(letter: ParsedCoverLetter): Table {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [SIDEBAR_WIDTH, GUTTER, BODY_WIDTH - GUTTER],
    borders: {
      top: { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
      insideHorizontal: { style: BorderStyle.NONE, size: 0 },
      insideVertical: { style: BorderStyle.NONE, size: 0 },
    },
    rows: [
      new TableRow({
        children: [
          buildSidebarCell(letter),
          buildGutterCell(),
          buildBodyCell(letter),
        ],
      }),
    ],
  });
}

function buildSidebarCell(letter: ParsedCoverLetter): TableCell {
  const firstName = letter.name.split(" ")[0].toUpperCase();
  const lastName = letter.name.split(" ").slice(1).join(" ").toUpperCase();

  const children: Paragraph[] = [
    new Paragraph({
      spacing: { before: 0, after: 0, line: LINE_SPACING },
      children: [
        new TextRun({
          text: firstName,
          font: FONT,
          size: CL_NAME_SIZE,
          bold: true,
          color: BLACK,
        }),
      ],
    }),
  ];

  if (lastName) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 0, line: LINE_SPACING },
        children: [
          new TextRun({
            text: lastName,
            font: FONT,
            size: CL_NAME_SIZE,
            bold: true,
            color: BLACK,
          }),
        ],
      })
    );
  }

  const roleLines = letter.role.toUpperCase().split(" ");
  const midpoint = Math.ceil(roleLines.length / 2);
  const roleLine1 = roleLines.slice(0, midpoint).join(" ");
  const roleLine2 = roleLines.slice(midpoint).join(" ");

  children.push(
    new Paragraph({
      spacing: { before: 40, after: 0, line: LINE_SPACING },
      children: [
        new TextRun({
          text: roleLine1,
          font: FONT,
          size: ROLE_SIZE,
          bold: true,
          smallCaps: true,
          color: GREEN,
        }),
      ],
    })
  );

  if (roleLine2) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 0, line: LINE_SPACING },
        children: [
          new TextRun({
            text: roleLine2,
            font: FONT,
            size: ROLE_SIZE,
            bold: true,
            smallCaps: true,
            color: GREEN,
          }),
        ],
      })
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 80, after: 80 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: BLACK },
      },
      children: [new TextRun({ text: "", font: FONT, size: CL_CONTACT_SIZE })],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 60, after: 0, line: LINE_SPACING },
      children: [
        new TextRun({
          text: letter.name,
          font: FONT,
          size: CL_CONTACT_SIZE,
          bold: true,
          color: BLACK,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 0, after: 0, line: LINE_SPACING },
      children: [
        new TextRun({
          text: letter.contact.location,
          font: FONT,
          size: CL_CONTACT_SIZE,
          color: BLACK,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 0, after: 0, line: LINE_SPACING },
      children: [
        new TextRun({
          text: letter.contact.phone,
          font: FONT,
          size: CL_CONTACT_SIZE,
          color: GREEN,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 0, after: 0, line: LINE_SPACING },
      children: [
        new ExternalHyperlink({
          link: `mailto:${letter.contact.email}`,
          children: [
            new TextRun({
              text: letter.contact.email,
              font: FONT,
              size: CL_CONTACT_SIZE,
              color: GREEN,
            }),
          ],
        }),
      ],
    })
  );

  return new TableCell({
    width: { size: SIDEBAR_WIDTH, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    borders: {
      top: { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
    },
    children,
  });
}

function buildGutterCell(): TableCell {
  return new TableCell({
    width: { size: GUTTER, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
    },
    children: [new Paragraph({ children: [] })],
  });
}

function buildBodyCell(letter: ParsedCoverLetter): TableCell {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      spacing: { before: 0, after: 0 },
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BLACK },
      },
      children: [],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 120, after: 0, line: LINE_SPACING },
      children: [
        new TextRun({
          text: letter.date.toUpperCase(),
          font: FONT,
          size: BULLET_SIZE,
          color: BLACK,
        }),
      ],
    })
  );

  if (letter.recipient && letter.recipient !== "Hiring Team") {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 0, line: LINE_SPACING },
        children: [
          new TextRun({
            text: letter.recipient,
            font: FONT,
            size: BODY_SIZE,
            bold: true,
            color: BLACK,
          }),
        ],
      })
    );
  }

  if (letter.recipientCompany) {
    children.push(
      new Paragraph({
        spacing: { before: 0, after: 0, line: LINE_SPACING },
        children: [
          new TextRun({
            text: letter.recipientCompany,
            font: FONT,
            size: BODY_SIZE,
            color: BLACK,
          }),
        ],
      })
    );
  }

  const salutationSpacing =
    letter.recipient && letter.recipient !== "Hiring Team" ? 160 : 200;
  const salutation =
    letter.recipient === "Hiring Team"
      ? "Dear Hiring Team,"
      : `Dear ${letter.recipient},`;

  children.push(
    new Paragraph({
      spacing: { before: salutationSpacing, after: 0, line: LINE_SPACING },
      children: [
        new TextRun({
          text: salutation,
          font: FONT,
          size: BODY_SIZE,
          color: BLACK,
        }),
      ],
    })
  );

  for (const para of letter.paragraphs) {
    children.push(renderParagraph(para));
  }

  children.push(
    new Paragraph({
      spacing: { before: 200, after: 0, line: LINE_SPACING },
      children: [
        new TextRun({
          text: letter.closing,
          font: FONT,
          size: BODY_SIZE,
          color: BLACK,
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      spacing: { before: 200, after: 0, line: LINE_SPACING },
      children: [
        new TextRun({
          text: letter.name,
          font: FONT,
          size: BODY_SIZE,
          color: BLACK,
        }),
      ],
    })
  );

  return new TableCell({
    width: { size: BODY_WIDTH - GUTTER, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    borders: {
      top: { style: BorderStyle.NONE, size: 0 },
      bottom: { style: BorderStyle.NONE, size: 0 },
      left: { style: BorderStyle.NONE, size: 0 },
      right: { style: BorderStyle.NONE, size: 0 },
    },
    children,
  });
}

function renderParagraph(para: BulletPoint): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 0, line: LINE_SPACING },
    children: para.segments.map(
      (seg) =>
        new TextRun({
          text: seg.text,
          font: FONT,
          size: BODY_SIZE,
          bold: seg.bold,
          color: BLACK,
        })
    ),
  });
}

export { Packer };
