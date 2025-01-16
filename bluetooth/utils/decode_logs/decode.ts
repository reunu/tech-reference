const fs = require('fs').promises;

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (err) {
    console.error('Error reading file:', err);
    process.exit(1);
  }
}

function parseLine(line: string) {
  const uuidMatch = line.match(UUID_REGEX)?.[0];
  if (!uuidMatch) {
    throw new Error("Error: no uuid match");
  }

  const hexMatch = line.match(/\(0x\) ..(-..)*/);
  if (!hexMatch) {
    throw new Error("Error: no hex match");
  }

  const convertedValue = convertHexToUtf8(hexMatch[0]);
  const valueLength = convertedValue.length;

  return {
    uuid: uuidMatch,
    value: convertedValue,
  }
}

/**
 * Convert hex string to UTF8.
 * Example hex string: "(0x) 48-65-6c-6c"
 */
function convertHexToUtf8(hexString: string): string {
  const cleaned = hexString.replace("(0x) ", "").replace(/-/g, "");
  const buffer = Buffer.from(cleaned, 'hex');
  const utf8String = buffer.toString('utf8').replaceAll("\x00", '');
  return utf8String;
}

function uniq(values: string[]): string[] {
  return [...new Set(values)];
}

async function main() {
  const valuesPerUuid: Record<string, string[]> = {};

  const filePath = process.argv[2] as string;

  const lines = (await readFileContent(filePath)).split("\n");

  console.log("FILTERED LINES:");
  lines
    .filter((line) => line.includes("value:"))
    .map((line) => {
      const { uuid, value } = parseLine(line);

      // add to stats
      if (value.length > 0) {
        valuesPerUuid[uuid] = uniq([...valuesPerUuid[uuid] || "", value]);
      }

      return `${line}, "${value}", length: ${value.length}`;
    })
    .filter((line) => line.length > 1 && !line.includes("�") && !!line.match(/"(.+?)"/))
    .forEach((line) => {
      console.log(line)
    });

  console.log("");
  console.log("STATS:");
  console.log(valuesPerUuid);
}

main();
