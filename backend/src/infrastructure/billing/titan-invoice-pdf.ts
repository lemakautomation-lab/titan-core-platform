import {
    PDFFont,
    PDFDocument,
    PDFPage,
    StandardFonts,
    rgb,
} from "pdf-lib";

export interface TitanInvoicePdfInput {
    invoiceNumber: string;
    issuedAt: Date;
    recipientEmail: string;
    recipientName: string | null;
    issuerName: string;
    issuerRegistrationNumber: string | null;
    issuerAddressText: string | null;
    productName: string;
    amountMinor: number;
    currency: string;
    paymentProviderReference: string | null;
    confirmedAt: Date;
}

function pdfSafe(
    value: string,
): string {
    return value
        .replace(/[^\x20-\x7E]/g, "?")
        .trim();
}

function formatAmount(
    amountMinor: number,
    currency: string,
): string {
    return new Intl.NumberFormat(
        "en-ZA",
        {
            style: "currency",
            currency,
        },
    ).format(
        amountMinor / 100,
    );
}

function drawWrappedText(
    page: PDFPage,
    font: PDFFont,
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    size: number,
): number {
    const words=
        pdfSafe(text)
            .split(/\s+/)
            .filter(Boolean);

    const lines: string[]=[];
    let current="";

    for(const word of words) {
        const candidate=
            current
                ? `${current} ${word}`
                : word;

        if(
            current &&
            font.widthOfTextAtSize(
                candidate,
                size,
            ) > maxWidth
        ) {
            lines.push(
                current,
            );
            current=word;
        } else {
            current=candidate;
        }
    }

    if(current) {
        lines.push(
            current,
        );
    }

    let y=startY;

    for(const line of lines) {
        page.drawText(
            line,
            {
                x,
                y,
                size,
                font,
                color:
                    rgb(
                        0.13,
                        0.14,
                        0.16,
                    ),
            },
        );

        y-=size + 5;
    }

    return y;
}

export async function buildTitanInvoicePdf(
    input: Readonly<TitanInvoicePdfInput>,
): Promise<Uint8Array> {
    const document=
        await PDFDocument.create();

    const page=
        document.addPage([
            595.28,
            841.89,
        ]);

    const regular=
        await document.embedFont(
            StandardFonts.Helvetica,
        );

    const bold=
        await document.embedFont(
            StandardFonts.HelveticaBold,
        );

    const width=
        page.getWidth();

    const neon=
        rgb(
            0.44,
            1,
            0.32,
        );

    const black=
        rgb(
            0.035,
            0.04,
            0.05,
        );

    page.drawRectangle({
        x: 0,
        y: 708,
        width,
        height: 134,
        color:
            black,
    });

    page.drawRectangle({
        x: 0,
        y: 702,
        width,
        height: 6,
        color:
            neon,
    });

    page.drawText(
        "TITAN",
        {
            x: 42,
            y: 780,
            size: 28,
            font: bold,
            color: neon,
        },
    );

    page.drawText(
        "INVOICE",
        {
            x: 42,
            y: 746,
            size: 15,
            font: bold,
            color:
                rgb(
                    1,
                    1,
                    1,
                ),
        },
    );

    page.drawText(
        pdfSafe(
            input.invoiceNumber,
        ),
        {
            x: 375,
            y: 780,
            size: 13,
            font: bold,
            color:
                rgb(
                    1,
                    1,
                    1,
                ),
        },
    );

    page.drawText(
        `Issued ${input.issuedAt.toISOString().slice(0, 10)}`,
        {
            x: 375,
            y: 756,
            size: 9,
            font: regular,
            color:
                rgb(
                    0.75,
                    0.77,
                    0.8,
                ),
        },
    );

    let y=660;

    page.drawText(
        "ISSUED BY",
        {
            x: 42,
            y,
            size: 9,
            font: bold,
            color: black,
        },
    );

    y-=22;

    page.drawText(
        pdfSafe(
            input.issuerName,
        ),
        {
            x: 42,
            y,
            size: 12,
            font: bold,
            color: black,
        },
    );

    y-=19;

    if(input.issuerRegistrationNumber) {
        page.drawText(
            `Company registration: ${pdfSafe(input.issuerRegistrationNumber)}`,
            {
                x: 42,
                y,
                size: 9,
                font: regular,
                color: black,
            },
        );

        y-=17;
    }

    if(input.issuerAddressText) {
        for(
            const line
            of input.issuerAddressText.split(/\r?\n/)
        ) {
            if(!line.trim()) {
                continue;
            }

            y=drawWrappedText(
                page,
                regular,
                line,
                42,
                y,
                230,
                9,
            );
        }
    }

    let billY=660;

    page.drawText(
        "BILLED TO",
        {
            x: 330,
            y: billY,
            size: 9,
            font: bold,
            color: black,
        },
    );

    billY-=22;

    if(input.recipientName) {
        page.drawText(
            pdfSafe(
                input.recipientName,
            ),
            {
                x: 330,
                y: billY,
                size: 12,
                font: bold,
                color: black,
            },
        );

        billY-=19;
    }

    page.drawText(
        pdfSafe(
            input.recipientEmail,
        ),
        {
            x: 330,
            y: billY,
            size: 9,
            font: regular,
            color: black,
        },
    );

    const tableTop=515;

    page.drawRectangle({
        x: 42,
        y: tableTop,
        width: 511,
        height: 38,
        color: black,
    });

    page.drawText(
        "DESCRIPTION",
        {
            x: 56,
            y: tableTop + 14,
            size: 9,
            font: bold,
            color:
                rgb(
                    1,
                    1,
                    1,
                ),
        },
    );

    page.drawText(
        "AMOUNT",
        {
            x: 446,
            y: tableTop + 14,
            size: 9,
            font: bold,
            color:
                rgb(
                    1,
                    1,
                    1,
                ),
        },
    );

    const descriptionY=
        tableTop - 34;

    drawWrappedText(
        page,
        regular,
        input.productName,
        56,
        descriptionY,
        330,
        11,
    );

    page.drawText(
        pdfSafe(
            formatAmount(
                input.amountMinor,
                input.currency,
            ),
        ),
        {
            x: 430,
            y: descriptionY,
            size: 11,
            font: bold,
            color: black,
        },
    );

    page.drawLine({
        start: {
            x: 42,
            y: tableTop - 62,
        },
        end: {
            x: 553,
            y: tableTop - 62,
        },
        thickness: 1,
        color:
            rgb(
                0.85,
                0.86,
                0.87,
            ),
    });

    page.drawText(
        "AMOUNT PAID",
        {
            x: 334,
            y: tableTop - 104,
            size: 10,
            font: bold,
            color: black,
        },
    );

    page.drawText(
        pdfSafe(
            formatAmount(
                input.amountMinor,
                input.currency,
            ),
        ),
        {
            x: 430,
            y: tableTop - 106,
            size: 16,
            font: bold,
            color: black,
        },
    );

    page.drawRectangle({
        x: 42,
        y: 240,
        width: 511,
        height: 94,
        color:
            rgb(
                0.96,
                0.97,
                0.97,
            ),
    });

    page.drawText(
        "PAYMENT CONFIRMATION",
        {
            x: 56,
            y: 309,
            size: 9,
            font: bold,
            color: black,
        },
    );

    page.drawText(
        `Confirmed: ${input.confirmedAt.toISOString()}`,
        {
            x: 56,
            y: 286,
            size: 9,
            font: regular,
            color: black,
        },
    );

    if(input.paymentProviderReference) {
        drawWrappedText(
            page,
            regular,
            `Payment reference: ${input.paymentProviderReference}`,
            56,
            266,
            470,
            9,
        );
    }

    page.drawRectangle({
        x: 0,
        y: 0,
        width,
        height: 72,
        color: black,
    });

    page.drawText(
        "TitanTech (Pty) Ltd",
        {
            x: 42,
            y: 39,
            size: 9,
            font: bold,
            color: neon,
        },
    );

    page.drawText(
        "Generated securely by TITAN Enterprise.",
        {
            x: 42,
            y: 23,
            size: 8,
            font: regular,
            color:
                rgb(
                    0.72,
                    0.74,
                    0.77,
                ),
        },
    );

    return document.save();
}