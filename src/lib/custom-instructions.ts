export type CustomInstructionSections = {
  persona: string;
  tone: string;
  guardrails: string;
  agentInstructions: string;
};

const SECTION_HEADER_PATTERN =
  /^\[(PERSONA|TONE|GUARDRAILS|INSTRUKSI KHUSUS AI AGENT[^\]]*)\]\s*$/gim;
const MAX_SECTION_LENGTH = 8_000;

function normalizeSection(value: string) {
  return value.replace(/\r\n/g, "\n").trim().slice(0, MAX_SECTION_LENGTH);
}

export function parseCustomInstructions(rawInstructions: string): CustomInstructionSections {
  const raw = rawInstructions
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, MAX_SECTION_LENGTH * 4);
  if (!raw) {
    return { persona: "", tone: "", guardrails: "", agentInstructions: "" };
  }

  const matches = Array.from(raw.matchAll(SECTION_HEADER_PATTERN));
  if (matches.length === 0) {
    return {
      persona: normalizeSection(raw),
      tone: "",
      guardrails: "",
      agentInstructions: "",
    };
  }

  const sections: CustomInstructionSections = {
    persona: "",
    tone: "",
    guardrails: "",
    agentInstructions: "",
  };

  matches.forEach((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? raw.length;
    const value = normalizeSection(raw.slice(start, end));
    const header = match[1].toUpperCase();

    if (header === "PERSONA") sections.persona = value;
    else if (header === "TONE") sections.tone = value;
    else if (header === "GUARDRAILS") sections.guardrails = value;
    else sections.agentInstructions = value;
  });

  return sections;
}

export function serializeCustomInstructions(
  sections: Pick<CustomInstructionSections, "persona" | "tone" | "guardrails">,
) {
  return [
    "[PERSONA]",
    normalizeSection(sections.persona),
    "",
    "[TONE]",
    normalizeSection(sections.tone),
    "",
    "[GUARDRAILS]",
    normalizeSection(sections.guardrails),
  ].join("\n");
}

export function hasCustomInstructionContent(sections: CustomInstructionSections) {
  return Boolean(
    sections.persona ||
      sections.tone ||
      sections.guardrails ||
      sections.agentInstructions,
  );
}

export function formatCustomInstructionsForPrompt(sections: CustomInstructionSections) {
  const parts = [
    `PERSONA / IDENTITAS\n${sections.persona || "Tidak diatur."}`,
    `TONE OF VOICE / GAYA BAHASA\n${sections.tone || "Tidak diatur."}`,
    `GUARDRAILS PEMILIK BISNIS\n${sections.guardrails || "Tidak diatur."}`,
  ];

  if (sections.agentInstructions) {
    parts.push(
      `INSTRUKSI KHUSUS AI AGENT (prioritas di bawah Custom Instructions global)\n${sections.agentInstructions}`,
    );
  }

  return parts.join("\n\n");
}
