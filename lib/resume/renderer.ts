import {
  Document,
  Paragraph,
  TextRun,
  Tab,
  TabStopType,
  AlignmentType,
  BorderStyle,
  Packer,
  LevelFormat,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableLayoutType,
  ExternalHyperlink,
} from "docx";
import type {
  ParsedResume,
  ContactInfo,
  ExperienceEntry,
  EducationEntry,
  SkillEntry,
  BulletPoint,
} from "../types";
import {
  LETTER_WIDTH,
  LETTER_HEIGHT,
  MARGIN_TOP_BOTTOM,
  MARGIN_LEFT_RIGHT,
  NAME_SIZE,
  SECTION_HEADER_SIZE,
  JOB_TITLE_SIZE,
  CONTACT_SIZE,
  BULLET_SIZE,
  SKILLS_SIZE,
  GREEN,
  BLACK,
  FONT,
  LINE_SPACING,
  RIGHT_TAB_POSITION,
} from "../constants";

export function renderResume(resume: ParsedResume): Document {
  const children: (Paragraph | Table)[] = [];

  children.push(...renderName(resume.name));
  children.push(renderContactTable(resume.contact));
  children.push(...renderHorizontalRule());

  if (resume.summary) {
    children.push(renderSectionHeader("SUMMARY"));
    children.push(...renderSummary(resume.summary));
    children.push(...renderHorizontalRule());
  }

  children.push(renderSectionHeader("PROFESSIONAL EXPERIENCE"));
  for (const entry of resume.experience) {
    children.push(...renderExperienceEntry(entry));
  }

  children.push(...renderHorizontalRule());
  children.push(renderSectionHeader("EDUCATION"));
  for (const entry of resume.education) {
    children.push(...renderEducationEntry(entry));
  }

  children.push(...renderHorizontalRule());
  children.push(renderSectionHeader("SKILLS"));
  for (const entry of resume.skills) {
    children.push(renderSkillEntry(entry));
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT,
            color: BLACK,
          },
          paragraph: {
            spacing: {
              before: 0,
              after: 0,
              line: LINE_SPACING,
            },
          },
        },
      },
    },
    numbering: {
      config: [
        {
          reference: "resume-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: 480,
                    hanging: 240,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: LETTER_WIDTH,
              height: LETTER_HEIGHT,
            },
            margin: {
              top: MARGIN_TOP_BOTTOM,
              bottom: MARGIN_TOP_BOTTOM,
              left: MARGIN_LEFT_RIGHT,
              right: MARGIN_LEFT_RIGHT,
            },
          },
        },
        children,
      },
    ],
  });
}

function renderName(name: string): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 80, line: LINE_SPACING },
      children: [
        new TextRun({
          text: name,
          font: FONT,
          size: NAME_SIZE,
          bold: true,
          smallCaps: true,
          color: BLACK,
        }),
      ],
    }),
  ];
}

function renderContactTable(contact: ContactInfo): Table {
  const contentWidth = LETTER_WIDTH - 2 * MARGIN_LEFT_RIGHT;
  const halfWidth = Math.round(contentWidth / 2);

  function contactCell(
    label: string,
    value: string,
    isLink?: { text: string; url: string }
  ): TableCell {
    const children: (TextRun | ExternalHyperlink)[] = [
      new TextRun({
        text: `${label}: `,
        font: FONT,
        size: CONTACT_SIZE,
        bold: true,
        color: GREEN,
      }),
    ];

    if (isLink) {
      children.push(
        new ExternalHyperlink({
          link: isLink.url,
          children: [
            new TextRun({
              text: isLink.text,
              font: FONT,
              size: CONTACT_SIZE,
              bold: true,
              color: BLACK,
              underline: {},
            }),
          ],
        })
      );
    } else {
      children.push(
        new TextRun({
          text: value,
          font: FONT,
          size: CONTACT_SIZE,
          bold: true,
          color: BLACK,
        })
      );
    }

    return new TableCell({
      width: { size: halfWidth, type: WidthType.DXA },
      margins: { top: 0, bottom: 0, left: 0, right: 0 },
      borders: {
        top: { style: BorderStyle.NONE, size: 0 },
        bottom: { style: BorderStyle.NONE, size: 0 },
        left: { style: BorderStyle.NONE, size: 0 },
        right: { style: BorderStyle.NONE, size: 0 },
      },
      children: [
        new Paragraph({
          spacing: { before: 0, after: 0, line: LINE_SPACING },
          children,
        }),
      ],
    });
  }

  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [halfWidth, halfWidth],
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
          contactCell("Email me", contact.email),
          contactCell("LinkedIn", "", {
            text: contact.linkedin.text,
            url: contact.linkedin.url,
          }),
        ],
      }),
      new TableRow({
        children: [
          contactCell("Call me", contact.phone),
          contactCell("Address", contact.location),
        ],
      }),
    ],
  });
}

function renderHorizontalRule(): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 60, after: 60 },
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: BLACK,
        },
      },
      children: [],
    }),
  ];
}

function renderSectionHeader(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 80, after: 40, line: LINE_SPACING },
    children: [
      new TextRun({
        text: title.toUpperCase(),
        font: FONT,
        size: SECTION_HEADER_SIZE,
        bold: true,
        color: GREEN,
      }),
    ],
  });
}

function renderSummary(text: string): Paragraph[] {
  return [
    new Paragraph({
      spacing: { before: 0, after: 0, line: LINE_SPACING },
      children: [
        new TextRun({
          text,
          font: FONT,
          size: BULLET_SIZE,
          color: BLACK,
        }),
      ],
    }),
  ];
}

function renderExperienceEntry(entry: ExperienceEntry): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      spacing: { before: 80, after: 0, line: LINE_SPACING },
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: RIGHT_TAB_POSITION,
        },
      ],
      children: [
        new TextRun({
          text: `${entry.company} – ${entry.role}`,
          font: FONT,
          size: JOB_TITLE_SIZE,
          bold: true,
          color: BLACK,
        }),
        new TextRun({
          text: entry.location ? `; ${entry.location}` : "",
          font: FONT,
          size: JOB_TITLE_SIZE,
          bold: false,
          color: BLACK,
        }),
        new TextRun({
          font: FONT,
          size: JOB_TITLE_SIZE,
          children: [new Tab()],
        }),
        new TextRun({
          text: entry.dateRange,
          font: FONT,
          size: JOB_TITLE_SIZE,
          italics: true,
          color: BLACK,
        }),
      ],
    })
  );

  for (const bullet of entry.bullets) {
    paragraphs.push(renderBullet(bullet));
  }

  if (entry.stack) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 40, after: 0, line: LINE_SPACING },
        children: [
          new TextRun({
            text: "Stack: ",
            font: FONT,
            size: BULLET_SIZE,
            bold: true,
            color: BLACK,
          }),
          new TextRun({
            text: entry.stack,
            font: FONT,
            size: BULLET_SIZE,
            color: BLACK,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

function renderBullet(bullet: BulletPoint): Paragraph {
  return new Paragraph({
    numbering: {
      reference: "resume-bullets",
      level: 0,
    },
    spacing: { before: 0, after: 0, line: LINE_SPACING },
    children: bullet.segments.map(
      (seg) =>
        new TextRun({
          text: seg.text,
          font: FONT,
          size: BULLET_SIZE,
          bold: seg.bold,
          color: BLACK,
        })
    ),
  });
}

function renderEducationEntry(entry: EducationEntry): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  const titleChildren: (TextRun | Tab)[] = [
    new TextRun({
      text: entry.degree,
      font: FONT,
      size: JOB_TITLE_SIZE,
      bold: true,
      color: BLACK,
    }),
  ];

  if (entry.dateRange) {
    titleChildren.push(
      new TextRun({
        font: FONT,
        size: JOB_TITLE_SIZE,
        children: [new Tab()],
      })
    );
    titleChildren.push(
      new TextRun({
        text: entry.dateRange,
        font: FONT,
        size: JOB_TITLE_SIZE,
        italics: true,
        color: BLACK,
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      spacing: { before: 40, after: 0, line: LINE_SPACING },
      tabStops: [
        { type: TabStopType.RIGHT, position: RIGHT_TAB_POSITION },
      ],
      children: titleChildren,
    })
  );

  if (entry.institution) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 0, after: 0, line: LINE_SPACING },
        children: [
          new TextRun({
            text: entry.institution,
            font: FONT,
            size: BULLET_SIZE,
            color: BLACK,
          }),
        ],
      })
    );
  }

  for (const sub of entry.subBullets) {
    paragraphs.push(
      new Paragraph({
        numbering: { reference: "resume-bullets", level: 0 },
        spacing: { before: 0, after: 0, line: LINE_SPACING },
        children: [
          new TextRun({
            text: sub,
            font: FONT,
            size: BULLET_SIZE,
            italics: true,
            color: BLACK,
          }),
        ],
      })
    );
  }

  return paragraphs;
}

function renderSkillEntry(entry: SkillEntry): Paragraph {
  return new Paragraph({
    spacing: { before: 0, after: 0, line: LINE_SPACING },
    children: [
      new TextRun({
        text: `${entry.label}: `,
        font: FONT,
        size: SKILLS_SIZE,
        bold: true,
        color: BLACK,
      }),
      new TextRun({
        text: entry.value,
        font: FONT,
        size: SKILLS_SIZE,
        bold: false,
        color: BLACK,
      }),
    ],
  });
}

export { Packer };
