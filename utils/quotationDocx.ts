import type { penawaranM } from "~/types/penawaranModel";
import type { ITableCellBorders } from "docx";

export type QuotationDocxLabels = {
  ref: string;
  refNo: string;
  date: string;
  to: string;
  attn: string;
  email: string;
  subject: string;
  address: string;
  vessel: string;
  location: string;
  currency: string;
  thDescription: string;
  thQty: string;
  thUom: string;
  thUnitPrice: string;
  grandTotal: string;
  amountInWords: string;
  sigHeaderLeft: string;
  sigHeaderRight: string;
  sigRoleRight: string;
};

type CreateQuotationDocxOptions = {
  detail: penawaranM;
  labels: QuotationDocxLabels;
  language: "id" | "en";
  quotationId: string;
  formattedDate: string;
  currencyLabel: string;
  amountInWords: string;
  headerColor: string;
  headerTextColor: string;
  showTotal: boolean;
  formatCurrency: (value: number | null | undefined) => string;
};

type RunStyle = {
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  color?: string;
  size?: number;
};

type ParagraphStyle = {
  alignment?: "left" | "center" | "right" | "both";
  before?: number;
  after?: number;
  line?: number;
  keepNext?: boolean;
};

const fetchAsset = async (path: string) => {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Gagal memuat aset DOCX: ${path}`);
  return new Uint8Array(await response.arrayBuffer());
};

const createTransparentWatermark = async (path: string, opacity: number) => {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    return fetchAsset(path);
  }

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const result = new Image();
    result.onload = () => resolve(result);
    result.onerror = reject;
    result.src = path;
  });
  await image.decode?.().catch(() => undefined);

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) return fetchAsset(path);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.globalAlpha = opacity;
  context.drawImage(image, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("Gagal membuat watermark DOCX"));
    }, "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
};

const createSolidColorPng = async (color: string) => {
  if (typeof document === "undefined") {
    const fallback =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
    return Uint8Array.from(atob(fallback), (character) =>
      character.charCodeAt(0),
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 8;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Gagal membuat aksen warna DOCX");
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error("Gagal membuat aksen warna DOCX"));
    }, "image/png");
  });
  return new Uint8Array(await blob.arrayBuffer());
};

export const createEditableQuotationDocx = async (
  options: CreateQuotationDocxOptions,
) => {
  const {
    AlignmentType,
    BorderStyle,
    Document,
    Footer,
    HeightRule,
    HorizontalPositionAlign,
    HorizontalPositionRelativeFrom,
    ImageRun,
    LineRuleType,
    Packer,
    PageOrientation,
    Paragraph,
    ShadingType,
    Table,
    TableCell,
    TableLayoutType,
    TableRow,
    TextRun,
    TextWrappingType,
    UnderlineType,
    VerticalAlignTable,
    VerticalPositionRelativeFrom,
    WidthType,
    convertMillimetersToTwip,
  } = await import("docx");

  const {
    detail,
    labels,
    language,
    quotationId,
    formattedDate,
    currencyLabel,
    amountInWords,
    formatCurrency,
    showTotal,
  } = options;
  const headerColor = options.headerColor.replace("#", "").toUpperCase();
  const headerTextColor = options.headerTextColor
    .replace("#", "")
    .toUpperCase();
  const contentWidth = convertMillimetersToTwip(174);
  const itemColumns = [360, 5_200, 620, 680, 1_300, 1_704];
  const noBorder = {
    style: BorderStyle.NONE,
    size: 0,
    color: "FFFFFF",
  };
  const noBorders = {
    top: noBorder,
    bottom: noBorder,
    left: noBorder,
    right: noBorder,
    insideHorizontal: noBorder,
    insideVertical: noBorder,
  };
  const tableBorders = {
    top: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
    left: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
    right: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
    insideHorizontal: {
      style: BorderStyle.SINGLE,
      size: 4,
      color: "E2E8F0",
    },
    insideVertical: {
      style: BorderStyle.SINGLE,
      size: 4,
      color: "E2E8F0",
    },
  };
  const signatureConfigs: Record<
    string,
    { path: string; width: number; height: number }
  > = {
    "Muhammad Ridwan": { path: "/ttd_ridwan.png", width: 132, height: 88 },
    "Seilla Maryana": {
      path: "/ttd_seilla_hitam.png",
      width: 158,
      height: 118,
    },
    "Leo Adiatmaja Sembiring": {
      path: "/ttd_leo.png",
      width: 136,
      height: 92,
    },
    Lilis: { path: "/ttd_lilis_hitam.png", width: 158, height: 118 },
  };
  const signatureConfig = signatureConfigs[detail.sign_by || ""];
  const [
    logoBytes,
    watermarkBytes,
    signatureBytes,
    primaryAccentBytes,
    secondaryAccentBytes,
  ] = await Promise.all([
    fetchAsset("/logokopsurat.png"),
    createTransparentWatermark("/logowatermark.png", 0.105),
    signatureConfig
      ? fetchAsset(signatureConfig.path)
      : Promise.resolve<Uint8Array | null>(null),
    createSolidColorPng(`#${headerColor}`),
    createSolidColorPng("#CBD5E1"),
  ]);

  const runs = (value: unknown, style: RunStyle = {}) =>
    String(value ?? "")
      .split(/\r?\n/)
      .map(
        (line, index) =>
          new TextRun({
            text: line || " ",
            break: index ? 1 : undefined,
            font: "Arial",
            size: style.size ?? 17,
            color: style.color ?? "1E293B",
            bold: style.bold,
            italics: style.italics,
            underline: style.underline
              ? { type: UnderlineType.SINGLE }
              : undefined,
          }),
      );

  const paragraph = (
    value: unknown | InstanceType<typeof TextRun>[],
    style: ParagraphStyle = {},
    runStyle: RunStyle = {},
  ) =>
    new Paragraph({
      children: Array.isArray(value) ? value : runs(value, runStyle),
      alignment:
        style.alignment === "center"
          ? AlignmentType.CENTER
          : style.alignment === "right"
            ? AlignmentType.RIGHT
            : style.alignment === "both"
              ? AlignmentType.JUSTIFIED
              : AlignmentType.LEFT,
      spacing: {
        before: style.before ?? 0,
        after: style.after ?? 0,
        line: style.line ?? 220,
        lineRule: LineRuleType.AUTO,
      },
      keepNext: style.keepNext,
      widowControl: false,
    });

  const cell = (
    children: InstanceType<typeof Paragraph>[],
    width: number,
    config: {
      fill?: string;
      columnSpan?: number;
      verticalAlign?: "top" | "center" | "bottom";
      margins?: { top: number; right: number; bottom: number; left: number };
      borders?: ITableCellBorders;
    } = {},
  ) =>
    new TableCell({
      children,
      width: { size: width, type: WidthType.DXA },
      columnSpan: config.columnSpan,
      verticalAlign:
        config.verticalAlign === "top"
          ? VerticalAlignTable.TOP
          : config.verticalAlign === "bottom"
            ? VerticalAlignTable.BOTTOM
            : VerticalAlignTable.CENTER,
      margins: config.margins ?? {
        top: 95,
        right: 100,
        bottom: 95,
        left: 100,
      },
      shading: config.fill
        ? { type: ShadingType.CLEAR, fill: config.fill, color: "auto" }
        : undefined,
      borders: config.borders,
    });

  const fixedTable = (
    widths: number[],
    rows: InstanceType<typeof TableRow>[],
    borders = noBorders,
  ) =>
    new Table({
      rows,
      width: { size: contentWidth, type: WidthType.DXA },
      columnWidths: widths,
      layout: TableLayoutType.FIXED,
      alignment: AlignmentType.CENTER,
      borders,
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
    });

  const logoRun = new ImageRun({
    type: "png",
    data: logoBytes,
    transformation: { width: 144, height: 60 },
    altText: {
      name: "PT Duta Raya Marine logo",
      title: "PT Duta Raya Marine logo",
      description: "PT Duta Raya Marine logo",
    },
  });
  const letterhead = fixedTable(
    [2_300, 5_264, 2_300],
    [
      new TableRow({
        cantSplit: true,
        children: [
          cell(
            [
              new Paragraph({
                children: [logoRun],
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 0 },
              }),
            ],
            2_300,
            {
              margins: { top: 0, right: 0, bottom: 0, left: 0 },
            },
          ),
          cell(
            [
              paragraph(
                "PT. DUTA RAYA MARINE",
                { alignment: "center", after: 20 },
                { bold: true, color: "0F2B48", size: 36 },
              ),
              paragraph(
                "Ruko Dreamland H3 No. 05, Tanjung Riau,\nSekupang, Kota Batam, Kepulauan Riau.",
                { alignment: "center", line: 190 },
                { size: 15 },
              ),
              paragraph(
                "Jl. Raya Pasar Minggu No. 15A, Jakarta Selatan.",
                { alignment: "center", before: 10, line: 190 },
                { size: 15 },
              ),
              paragraph(
                "E-mail: sales@dutarayamarine.com , Phone/WhatsApp : +62823-8450-3953\nWebsite: www.dutarayamarine.com",
                { alignment: "center", before: 10, line: 190 },
                { size: 15 },
              ),
            ],
            5_264,
          ),
          cell([paragraph(" ")], 2_300),
        ],
      }),
    ],
  );

  const accentPrimary = new Paragraph({
    children: [
      new ImageRun({
        type: "png",
        data: primaryAccentBytes,
        transformation: { width: 658, height: 4 },
      }),
    ],
    spacing: { before: 20, after: 12, line: 60, lineRule: LineRuleType.EXACT },
  });
  const accentSecondary = new Paragraph({
    children: [
      new ImageRun({
        type: "png",
        data: secondaryAccentBytes,
        transformation: { width: 658, height: 1 },
      }),
    ],
    spacing: { before: 0, after: 0, line: 15, lineRule: LineRuleType.EXACT },
  });

  const metaRows = [
    [labels.refNo, detail.no_penawaran || "-", true],
    [labels.date, formattedDate, true],
    [labels.to, detail.nama_perusahaan || "-", true],
    [labels.attn, detail.pic || "-", false],
    [labels.email, detail.email || "-", false],
    [labels.subject, detail.perihal || "-", true],
    [labels.address, detail.alamat_perusahaan || "-", true],
    [labels.vessel, detail.vessel || "-", true],
    [labels.location, detail.location || "-", true],
    [labels.currency, currencyLabel, true],
  ] as const;
  const metaTable = fixedTable(
    [1_850, 240, 7_774],
    metaRows.map(
      ([label, value, bold]) =>
        new TableRow({
          cantSplit: true,
          children: [
            cell(
              [paragraph(label, {}, { size: 17 })],
              1_850,
              { margins: { top: 12, right: 40, bottom: 12, left: 100 } },
            ),
            cell(
              [paragraph(":", {}, { size: 17 })],
              240,
              { margins: { top: 12, right: 10, bottom: 12, left: 10 } },
            ),
            cell(
              [
                paragraph(value, {}, {
                  size: 17,
                  bold,
                  color: bold ? "0F2B48" : "334155",
                }),
              ],
              7_774,
              { margins: { top: 12, right: 100, bottom: 12, left: 10 } },
            ),
          ],
        }),
    ),
  );

  const headerTitles: Array<[
    string,
    "left" | "center" | "right",
  ]> = [
    ["SN", "center"],
    [labels.thDescription, "left"],
    [labels.thQty, "center"],
    [labels.thUom, "center"],
    [labels.thUnitPrice, "right"],
    ["TOTAL PRICE", "right"],
  ];
  const itemRows: InstanceType<typeof TableRow>[] = [
    new TableRow({
      cantSplit: true,
      tableHeader: true,
      height: { value: 390, rule: HeightRule.ATLEAST },
      children: headerTitles.map(([title, alignment], index) =>
        cell(
          [
            paragraph(
              title,
              { alignment, line: 190 },
              { bold: true, size: 17, color: headerTextColor },
            ),
          ],
          itemColumns[index],
          { fill: headerColor },
        ),
      ),
    }),
  ];
  (detail.penawaran_item || []).forEach((item, index) => {
    const fill = index % 2 === 1 ? "F8FAFC" : undefined;
    const values: Array<[
      unknown,
      "left" | "center" | "right",
      RunStyle,
    ]> = [
      [`${index + 1}.`, "center", { size: 17, color: "64748B" }],
      [item.nama || "-", "left", { size: 17, color: "1E293B" }],
      [item.qty, "center", { size: 17, color: "334155" }],
      [item.uom || "-", "center", { size: 17, color: "64748B" }],
      [formatCurrency(item.amount), "right", { size: 17, color: "475569" }],
      [
        formatCurrency(item.subtotal_item),
        "right",
        { size: 17, bold: true, color: "0F2B48" },
      ],
    ];
    itemRows.push(
      new TableRow({
        cantSplit: true,
        children: values.map(([value, alignment, style], columnIndex) =>
          cell(
            [paragraph(value, { alignment, line: 210 }, style)],
            itemColumns[columnIndex],
            { fill, verticalAlign: "top" },
          ),
        ),
      }),
    );
  });

  const addSummaryRow = (
    label: string,
    value: string,
    config: { fill?: string; italics?: boolean } = {},
  ) => {
    itemRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          cell(
            [
              paragraph(
                label,
                { alignment: "right" },
                { bold: true, size: 17, color: "0F2B48" },
              ),
            ],
            8_160,
            { columnSpan: 5, fill: config.fill },
          ),
          cell(
            [
              paragraph(
                value,
                { alignment: "right" },
                {
                  bold: !config.italics,
                  italics: config.italics,
                  size: 17,
                  color: "0F2B48",
                },
              ),
            ],
            1_704,
            { fill: config.fill },
          ),
        ],
      }),
    );
  };
  if (showTotal) {
    if (Number(detail.discount_penawaran) > 0) {
      addSummaryRow("Subtotal", formatCurrency(detail.subtotal_penawaran));
      const discountAmount = Math.max(
        0,
        Number(detail.subtotal_penawaran || 0) -
          Number(detail.grand_total_penawaran || 0),
      );
      addSummaryRow("Discount", `- ${formatCurrency(discountAmount)}`, {
        italics: true,
      });
    }
    addSummaryRow(
      labels.grandTotal,
      formatCurrency(detail.grand_total_penawaran),
      { fill: "F8FAFC" },
    );
    itemRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          cell(
            [
              paragraph(
                [
                  ...runs(`${labels.amountInWords}: `, {
                    bold: true,
                    size: 16,
                    color: "475569",
                  }),
                  ...runs(`# ${amountInWords}`, {
                    italics: true,
                    size: 16,
                    color: "334155",
                  }),
                ],
                { line: 200 },
              ),
            ],
            contentWidth,
            { columnSpan: 6, fill: "F8FAFC" },
          ),
        ],
      }),
    );
  }
  const itemTable = fixedTable(itemColumns, itemRows, tableBorders);

  const terms: InstanceType<typeof Paragraph>[] = [];
  if ((detail.termCondition || []).length) {
    terms.push(
      paragraph(
        "TERMS & CONDITIONS:",
        { before: 110, after: 30, keepNext: true },
        { bold: true, size: 17 },
      ),
      ...(detail.termCondition || []).map((term, index) =>
        paragraph(`${index + 1}. ${term.nama_term}`, { after: 16 }, { size: 17 }),
      ),
    );
  }

  const signatureChildren: InstanceType<typeof Paragraph>[] = [
    paragraph(
      labels.sigHeaderLeft,
      { alignment: "center", after: 10 },
      { bold: true, color: "0F2B48", size: 17 },
    ),
    paragraph(
      "PT. DUTA RAYA MARINE",
      { alignment: "center", after: 10 },
      { bold: true, size: 17 },
    ),
  ];
  if (signatureConfig && signatureBytes) {
    signatureChildren.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: "png",
            data: signatureBytes,
            transformation: {
              width: signatureConfig.width,
              height: signatureConfig.height,
            },
            altText: {
              name: `${detail.sign_by} signature`,
              title: `${detail.sign_by} signature`,
              description: `${detail.sign_by} signature`,
            },
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0 },
      }),
    );
  } else {
    signatureChildren.push(paragraph(" ", { after: 720 }));
  }
  signatureChildren.push(
    paragraph(
      detail.sign_by || "",
      { alignment: "center" },
      { bold: true, underline: true, color: "0F2B48", size: 17 },
    ),
  );
  const approvalSpacer = signatureConfig?.height && signatureConfig.height > 100
    ? 1_360
    : 1_020;
  const signatureTable = fixedTable(
    [4_932, 4_932],
    [
      new TableRow({
        cantSplit: true,
        children: [
          cell(signatureChildren, 4_932, { verticalAlign: "top" }),
          cell(
            [
              paragraph(
                labels.sigHeaderRight,
                { alignment: "center", after: 10 },
                { bold: true, color: "0F2B48", size: 17 },
              ),
              paragraph(
                detail.nama_perusahaan || " ",
                { alignment: "center", after: approvalSpacer },
                { bold: true, size: 17 },
              ),
              paragraph(
                "( ................................................ )",
                { alignment: "center" },
                { bold: true, size: 17 },
              ),
              paragraph(
                labels.sigRoleRight,
                { alignment: "center", before: 15 },
                { color: "64748B", size: 16 },
              ),
            ],
            4_932,
            { verticalAlign: "top" },
          ),
        ],
      }),
    ],
  );

  const watermark = new Paragraph({
    children: [
      new ImageRun({
        type: "png",
        data: watermarkBytes,
        transformation: { width: 540, height: 227 },
        floating: {
          horizontalPosition: {
            relative: HorizontalPositionRelativeFrom.PAGE,
            align: HorizontalPositionAlign.CENTER,
          },
          verticalPosition: {
            relative: VerticalPositionRelativeFrom.PAGE,
            offset: 6_000_000,
          },
          behindDocument: true,
          allowOverlap: true,
          layoutInCell: true,
          wrap: { type: TextWrappingType.NONE },
        },
        altText: {
          name: "Quotation watermark",
          title: "Quotation watermark",
          description: "PT Duta Raya Marine watermark",
        },
      }),
    ],
    spacing: { before: 0, after: 0, line: 1, lineRule: LineRuleType.EXACT },
  });

  const footer = new Footer({
    children: [
      new Paragraph({
        children: [new TextRun({ text: " " })],
        border: {
          top: { style: BorderStyle.SINGLE, size: 8, color: "0F2B48" },
        },
        spacing: { before: 0, after: 0 },
      }),
    ],
  });
  const salutation =
    language === "id"
      ? "Bersama ini kami sampaikan penawaran harga sebagai berikut:"
      : "We are pleased to submit our quotation as follows:";

  const document = new Document({
    title: `Quotation ${quotationId}`,
    creator: "PT. DUTA RAYA MARINE",
    lastModifiedBy: "PT. DUTA RAYA MARINE",
    styles: {
      default: {
        document: {
          run: { font: "Arial", size: 17, color: "1E293B" },
          paragraph: {
            spacing: { before: 0, after: 0, line: 220 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: convertMillimetersToTwip(2),
              right: convertMillimetersToTwip(18),
              bottom: convertMillimetersToTwip(25),
              left: convertMillimetersToTwip(18),
              header: 0,
              footer: convertMillimetersToTwip(8),
              gutter: 0,
            },
          },
        },
        footers: { default: footer },
        children: [
          watermark,
          letterhead,
          accentPrimary,
          accentSecondary,
          paragraph(
            labels.ref,
            { alignment: "center", before: 70, after: 70, keepNext: true },
            { bold: true, color: "0F2B48", size: 30 },
          ),
          metaTable,
          paragraph(
            salutation,
            { alignment: "both", before: 90, after: 90, keepNext: true },
            { color: "334155", size: 17 },
          ),
          itemTable,
          ...terms,
          paragraph(" ", { line: 80 }),
          signatureTable,
        ],
      },
    ],
  });

  return Packer.toBlob(document);
};
