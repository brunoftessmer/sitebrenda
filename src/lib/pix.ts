// Gerador de payload Pix "Copia e Cola" (BR Code / EMV) com valor fixo,
// seguindo o Manual de Padrões para Iniciação do Pix (Bacen).
// Não depende de nenhum serviço externo: a chave Pix é fixa (da Brenda) e
// o valor é calculado a partir do total do carrinho.

import QRCode from "qrcode";

function tlv(id: string, value: string) {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

function sanitize(text: string, maxLength: number) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .slice(0, maxLength)
    .toUpperCase();
}

function crc16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export type PixPayloadInput = {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amountCents: number;
  txId: string;
  description?: string;
};

export function buildPixPayload({
  pixKey,
  merchantName,
  merchantCity,
  amountCents,
  txId,
  description,
}: PixPayloadInput): string {
  const merchantAccountInfo =
    tlv("00", "br.gov.bcb.pix") +
    tlv("01", pixKey) +
    (description ? tlv("02", sanitize(description, 40)) : "");

  const amount = (amountCents / 100).toFixed(2);
  const sanitizedTxId = sanitize(txId, 25) || "***";

  const additionalData = tlv("05", sanitizedTxId);

  const payloadWithoutCrc =
    tlv("00", "01") + // Payload Format Indicator
    tlv("26", merchantAccountInfo) + // Merchant Account Info (Pix)
    tlv("52", "0000") + // Merchant Category Code
    tlv("53", "986") + // Transaction Currency (BRL)
    tlv("54", amount) + // Transaction Amount
    tlv("58", "BR") + // Country Code
    tlv("59", sanitize(merchantName, 25) || "RECEBEDOR") + // Merchant Name
    tlv("60", sanitize(merchantCity, 15) || "CIDADE") + // Merchant City
    tlv("62", additionalData) + // Additional Data Field Template
    "6304"; // CRC placeholder (id + length, valor calculado abaixo)

  const crc = crc16(payloadWithoutCrc);
  return payloadWithoutCrc + crc;
}

export async function buildPixQrCodeDataUrl(input: PixPayloadInput) {
  const payload = buildPixPayload(input);
  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });
  return { payload, dataUrl };
}
